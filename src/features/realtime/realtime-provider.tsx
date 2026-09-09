import {
  useEffect,
  type PropsWithChildren,
} from 'react'
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
import { getRealtimeSocket } from '@/lib/realtime/socket'

function getEditionUpdate(
  editions:
    readonly NftEditionAvailabilityUpdate[],
  editionId: string,
): NftEditionAvailabilityUpdate | undefined {
  return editions.find(
    (edition) =>
      edition.editionId ===
      editionId,
  )
}

export function RealtimeProvider({
  children,
}: PropsWithChildren) {
  const queryClient =
    useQueryClient()

  useEffect(() => {
    const socket =
      getRealtimeSocket()

    function handleNftUpdated(
      event: NftUpdatedEvent,
    ): void {
      queryClient.setQueryData<NftDetails>(
        catalogQueryKeys.detail(
          event.nftId,
        ),
        (
          current,
        ) => {
          if (!current) {
            return current
          }

          return {
            ...current,

            priceEth:
              event.priceEth,

            previousPriceEth:
              event.previousPriceEth,

            availableQuantity:
              event.availableQuantity,

            version:
              event.version,

            editions:
              current.editions.map(
                (
                  edition,
                ) => {
                  const update =
                    getEditionUpdate(
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
                },
              ),
          }
        },
      )

      queryClient.setQueriesData<NftListResponse>(
        {
          queryKey:
            catalogQueryKeys.lists(),
        },
        (
          current,
        ) => {
          if (!current) {
            return current
          }

          return {
            ...current,

            items:
              current.items.map(
                (
                  nft,
                ) => {
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
        (
          current,
        ) => {
          if (!current) {
            return current
          }

          const items =
            current.items.map(
              (
                item,
              ) => {
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
                  edition
                    ?.availableQuantity ??
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

    socket.on(
      'nft.updated',
      handleNftUpdated,
    )

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off(
        'nft.updated',
        handleNftUpdated,
      )

      socket.disconnect()
    }
  }, [queryClient])

  return children
}