import { useEffect, useRef, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { cartQueryKeys } from '@/features/cart/cart-query'
import { catalogQueryKeys } from '@/features/catalog/catalog-query'
import { quoteQueryKeys } from '@/features/quote/quote-query'
import type {
  Cart,
  NftDetails,
  NftEditionAvailabilityUpdate,
  NftListResponse,
  NftUpdatedEvent,
} from '@/lib/api/contracts'
import type { RealtimeSocket } from '@/lib/realtime/socket'

const REALTIME_CONNECT_DELAY_MS = 500

function getEditionUpdate(
  editions: readonly NftEditionAvailabilityUpdate[],
  editionId: string,
): NftEditionAvailabilityUpdate | undefined {
  return editions.find((edition) => edition.editionId === editionId)
}

export function RealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const latestVersionByNftRef = useRef(new Map<string, number>())

  useEffect(() => {
    let socket: RealtimeSocket | null = null
    let disposed = false

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

      queryClient.setQueryData<NftDetails>(catalogQueryKeys.detail(event.nftId), (current) => {
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
            const update = getEditionUpdate(event.editions, edition.id)

            if (!update) {
              return edition
            }

            return {
              ...edition,

              availableQuantity: update.availableQuantity,

              purchasable: update.purchasable,
            }
          }),
        }
      })

      queryClient.setQueriesData<NftListResponse>(
        {
          queryKey: catalogQueryKeys.lists(),
        },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,

            items: current.items.map((nft) => {
              if (nft.id !== event.nftId) {
                return nft
              }

              return {
                ...nft,

                priceEth: event.priceEth,

                previousPriceEth: event.previousPriceEth,

                availableQuantity: event.availableQuantity,

                version: event.version,
              }
            }),
          }
        },
      )

      queryClient.setQueriesData<Cart>(
        {
          queryKey: cartQueryKeys.all,
        },
        (current) => {
          if (!current) {
            return current
          }

          const items = current.items.map((item) => {
            if (item.nftId !== event.nftId) {
              return item
            }

            const edition = getEditionUpdate(event.editions, item.editionId)

            const availableQuantity = edition?.availableQuantity ?? event.availableQuantity

            const priceChanged = item.priceChanged || item.unitPriceEth !== event.priceEth

            const availabilityChanged =
              item.availabilityChanged ||
              item.availableQuantity !== availableQuantity ||
              item.quantity > availableQuantity

            return {
              ...item,

              unitPriceEth: event.priceEth,

              availableQuantity,

              priceChanged,

              availabilityChanged,
            }
          })

          return {
            ...current,
            items,
          }
        },
      )

      queryClient.removeQueries({
        queryKey: quoteQueryKeys.all,
      })

      void queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.lists(),
      })
    }

    const connectTimer = window.setTimeout(() => {
      void import('@/lib/realtime/socket').then(({ getRealtimeSocket }) => {
        if (disposed) {
          return
        }

        socket = getRealtimeSocket()
        socket.on('nft.updated', handleNftUpdated)

        if (!socket.connected) {
          socket.connect()
        }
      })
    }, REALTIME_CONNECT_DELAY_MS)

    return () => {
      disposed = true
      window.clearTimeout(connectTimer)

      if (socket) {
        socket.off('nft.updated', handleNftUpdated)
        socket.disconnect()
      }
    }
  }, [queryClient])

  return children
}
