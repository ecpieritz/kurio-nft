import { useEffect, useRef, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/session/use-auth'
import { cartQueryKeys } from '@/features/cart/cart-query'
import { catalogQueryKeys } from '@/features/catalog/catalog-query'
import { orderQueryKeys } from '@/features/orders/orders-query'
import { quoteQueryKeys } from '@/features/quote/quote-query'
import type {
  Cart,
  NftDetails,
  NftEditionAvailabilityUpdate,
  NftListResponse,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from '@/lib/api/contracts'
import { getSessionToken } from '@/lib/auth/session-token'
import type { RealtimeSocket } from '@/lib/realtime/socket'

const REALTIME_CONNECT_DELAY_MS = 750

function getEditionUpdate(
  editions: readonly NftEditionAvailabilityUpdate[],
  editionId: string,
): NftEditionAvailabilityUpdate | undefined {
  return editions.find((edition) => edition.editionId === editionId)
}

export function RealtimeProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const activeUserId = auth.user?.id ?? null
  const queryClient = useQueryClient()
  const latestVersionByNftRef = useRef(new Map<string, number>())
  const latestVersionByOrderRef = useRef(new Map<string, number>())

  useEffect(() => {
    let socket: RealtimeSocket | null = null
    let disposed = false
    let hasConnectedOnce = false

    latestVersionByOrderRef.current.clear()

    function handleNftUpdated(event: NftUpdatedEvent): void {
      let latestVersion = latestVersionByNftRef.current.get(event.nftId)

      const detailVersion = queryClient.getQueryData<NftDetails>(
        catalogQueryKeys.detail(event.nftId),
      )?.version

      if (detailVersion !== undefined) {
        latestVersion = Math.max(latestVersion ?? detailVersion, detailVersion)
      }

      const listEntries = queryClient.getQueriesData<NftListResponse>({
        queryKey: catalogQueryKeys.lists(),
      })

      for (const [, list] of listEntries) {
        const listVersion = list?.items.find((nft) => nft.id === event.nftId)?.version

        if (listVersion !== undefined) {
          latestVersion = Math.max(latestVersion ?? listVersion, listVersion)
        }
      }

      if (latestVersion !== undefined && event.version <= latestVersion) {
        return
      }

      latestVersionByNftRef.current.set(event.nftId, event.version)

      queryClient.setQueryData<NftDetails>(
        catalogQueryKeys.detail(event.nftId),
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            priceEth: event.priceEth,
            previousPriceEth: event.previousPriceEth,
            availableQuantity: event.availableQuantity,
            version: event.version,
            editions: current.editions.map((edition) => {
              const update = getEditionUpdate(
                event.editions,
                edition.id,
              )

              if (!update) {
                return edition
              }

              return {
                ...edition,
                availableQuantity:
                  update.availableQuantity,
                purchasable:
                  update.purchasable,
              }
            }),
          }
        },
      )

      queryClient.setQueriesData<NftListResponse>(
        {
          queryKey:
            catalogQueryKeys.lists(),
        },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            items:
              current.items.map(
                (nft) => {
                  if (
                    nft.id !==
                    event.nftId
                  ) {
                    return nft
                  }

                  return {
                    ...nft,
                    priceEth:
                      event.priceEth,
                    previousPriceEth:
                      event.previousPriceEth,
                    availableQuantity:
                      event.availableQuantity,
                    version:
                      event.version,
                  }
                },
              ),
          }
        },
      )

      queryClient.setQueriesData<Cart>(
        {
          queryKey:
            cartQueryKeys.all,
        },
        (current) => {
          if (!current) {
            return current
          }

          const items =
            current.items.map(
              (item) => {
                if (
                  item.nftId !==
                  event.nftId
                ) {
                  return item
                }

                const edition =
                  getEditionUpdate(
                    event.editions,
                    item.editionId,
                  )

                const availableQuantity =
                  edition?.availableQuantity ??
                  event.availableQuantity

                const priceChanged =
                  item.priceChanged ||
                  item.unitPriceEth !==
                    event.priceEth

                const availabilityChanged =
                  item.availabilityChanged ||
                  item.availableQuantity !==
                    availableQuantity ||
                  item.quantity >
                    availableQuantity

                return {
                  ...item,
                  unitPriceEth:
                    event.priceEth,
                  availableQuantity,
                  priceChanged,
                  availabilityChanged,
                }
              },
            )

          return {
            ...current,
            items,
          }
        },
      )

      queryClient.removeQueries({
        queryKey:
          quoteQueryKeys.all,
      })

      void queryClient.invalidateQueries({
        queryKey:
          catalogQueryKeys.lists(),
      })
    }

    function handleOrderUpdated(
      event: OrderUpdatedEvent,
    ): void {
      if (
        !activeUserId ||
        event.userId !== activeUserId
      ) {
        return
      }

      if (
        event.order.id !==
          event.orderId ||
        event.order.userId !==
          event.userId ||
        event.order.version !==
          event.version
      ) {
        return
      }

      const currentOrder =
        queryClient.getQueryData<Order>(
          orderQueryKeys.detail(
            event.orderId,
          ),
        )

      const latestVersion =
        latestVersionByOrderRef.current.get(
          event.orderId,
        ) ??
        currentOrder?.version

      if (
        latestVersion !== undefined &&
        event.version <= latestVersion
      ) {
        return
      }

      latestVersionByOrderRef.current.set(
        event.orderId,
        event.version,
      )

      queryClient.setQueryData<Order>(
        orderQueryKeys.detail(
          event.orderId,
        ),
        event.order,
      )

      if (
        event.order.status !==
        'pending'
      ) {
        queryClient.removeQueries({
          queryKey:
            quoteQueryKeys.all,
        })

        void queryClient.invalidateQueries({
          queryKey:
            cartQueryKeys.all,
        })

        void queryClient.invalidateQueries({
          queryKey:
            catalogQueryKeys.all,
        })
      }
    }

    function reconcileAfterReconnect(): void {
      void queryClient.invalidateQueries({
        queryKey:
          catalogQueryKeys.all,
      })

      void queryClient.invalidateQueries({
        queryKey:
          cartQueryKeys.all,
      })

      if (activeUserId) {
        void queryClient.invalidateQueries({
          queryKey:
            orderQueryKeys.all,
        })
      }

      queryClient.removeQueries({
        queryKey:
          quoteQueryKeys.all,
      })
    }

    function handleConnect(): void {
      if (hasConnectedOnce) {
        reconcileAfterReconnect()
      }

      hasConnectedOnce = true
    }

    const connectTimer =
      window.setTimeout(
        () => {
          void import(
            '@/lib/realtime/socket'
          ).then(
            ({
              getRealtimeSocket,
            }) => {
              if (disposed) {
                return
              }

              const sessionToken =
                auth.status ===
                'authenticated'
                  ? getSessionToken()
                  : null

              socket =
                getRealtimeSocket(
                  sessionToken,
                )

              socket.on(
                'connect',
                handleConnect,
              )

              socket.on(
                'nft.updated',
                handleNftUpdated,
              )

              socket.on(
                'order.updated',
                handleOrderUpdated,
              )

              if (
                !socket.connected
              ) {
                socket.connect()
              }
            },
          )
        },
        REALTIME_CONNECT_DELAY_MS,
      )

    return () => {
      disposed = true

      window.clearTimeout(
        connectTimer,
      )

      if (socket) {
        socket.off(
          'connect',
          handleConnect,
        )

        socket.off(
          'nft.updated',
          handleNftUpdated,
        )

        socket.off(
          'order.updated',
          handleOrderUpdated,
        )

        socket.disconnect()
      }
    }
  }, [
    activeUserId,
    auth.status,
    queryClient,
  ])

  return children
}