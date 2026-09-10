import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type {
  DecimalString,
  NftDetails,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from '@/lib/api/contracts'
import { mockDatabase } from '@/mocks/database/database'
import {
  getActiveScenario,
  setActiveScenario,
} from '@/mocks/scenarios/runtime'

const realtimeApi =
  ws.link(
    'wss://realtime.kurio.test/socket.io/',
  )

const REALTIME_NFT_ID =
  'emerald-ape-042'

const REALTIME_PRICE:
  DecimalString =
  '1.29'

const STALE_REALTIME_PRICE:
  DecimalString =
  '0.01'

const REALTIME_EDITION_ID =
  `${REALTIME_NFT_ID}:1-50`

function toRealtimeEvent(
  nft: NftDetails,
): NftUpdatedEvent {
  return {
    nftId:
      nft.id,

    version:
      nft.version,

    priceEth:
      nft.priceEth,

    previousPriceEth:
      nft.previousPriceEth,

    availableQuantity:
      nft.availableQuantity,

    editions:
      nft.editions.map(
        (edition) => ({
          editionId:
            edition.id,

          availableQuantity:
            edition.availableQuantity,

          purchasable:
            edition.purchasable,
        }),
      ),

    occurredAt:
      new Date().toISOString(),
  }
}

function toOrderUpdatedEvent(
  order: Order,
): OrderUpdatedEvent {
  return {
    orderId:
      order.id,

    userId:
      order.userId,

    version:
      order.version,

    order:
      structuredClone(
        order,
      ),

    occurredAt:
      new Date().toISOString(),
  }
}

function getConnectedUserId(
  clientUrl: string,
): string | null {
  const sessionToken =
    new URL(
      clientUrl,
    ).searchParams.get(
      'sessionToken',
    )

  if (!sessionToken) {
    return null
  }

  const state =
    mockDatabase.read()

  const session =
    state.sessions.find(
      (candidate) =>
        candidate.id ===
        sessionToken,
    )

  if (
    !session ||
    Date.parse(
      session.expiresAt,
    ) <= Date.now()
  ) {
    return null
  }

  if (
    getActiveScenario()
      .flags
      .sessionExpired
  ) {
    return null
  }

  return session.userId
}

function applyRealtimeScenario():
  NftUpdatedEvent | null {
  const scenario =
    getActiveScenario()

  const shouldChangePrice =
    scenario.flags
      .priceChanged ===
    true

  const shouldSellOutEdition =
    scenario.flags
      .editionSoldOut ===
    true

  if (
    !shouldChangePrice &&
    !shouldSellOutEdition
  ) {
    return null
  }

  const state =
    mockDatabase.read()

  const nft =
    state.nfts.find(
      (candidate) =>
        candidate.id ===
        REALTIME_NFT_ID,
    )

  if (!nft) {
    return null
  }

  let changed =
    false

  if (
    shouldChangePrice &&
    nft.priceEth !==
      REALTIME_PRICE
  ) {
    nft.previousPriceEth =
      nft.priceEth

    nft.priceEth =
      REALTIME_PRICE

    changed =
      true
  }

  if (
    shouldSellOutEdition
  ) {
    const edition =
      nft.editions.find(
        (candidate) =>
          candidate.id ===
          REALTIME_EDITION_ID,
      )

    if (
      edition &&
      (
        edition.availableQuantity !==
          0 ||
        edition.purchasable
      )
    ) {
      edition.availableQuantity =
        0

      edition.purchasable =
        false

      nft.availableQuantity =
        nft.editions.reduce(
          (
            highest,
            candidate,
          ) =>
            Math.max(
              highest,
              candidate.availableQuantity,
            ),
          0,
        )

      changed =
        true
    }
  }

  if (changed) {
    nft.version +=
      1

    state.revision +=
      1

    mockDatabase.write(
      state,
    )
  }

  return toRealtimeEvent(
    nft,
  )
}

function createEventSignature(
  event: NftUpdatedEvent,
): string {
  return JSON.stringify({
    nftId:
      event.nftId,

    version:
      event.version,

    priceEth:
      event.priceEth,

    availableQuantity:
      event.availableQuantity,

    editions:
      event.editions,
  })
}

function createStaleEvent(
  event: NftUpdatedEvent,
): NftUpdatedEvent {
  return {
    ...event,

    version:
      Math.max(
        0,
        event.version - 1,
      ),

    priceEth:
      STALE_REALTIME_PRICE,

    previousPriceEth:
      event.priceEth,

    occurredAt:
      new Date(
        Date.now() -
          60_000,
      ).toISOString(),
  }
}

export const realtimeHandlers = [
  realtimeApi.addEventListener(
    'connection',
    (connection) => {
      const socket =
        toSocketIo(
          connection,
        )

      const connectedUserId =
        getConnectedUserId(
          connection.client.url,
        )

      const lastOrderVersionById =
        new Map<
          string,
          number
        >()

      let lastNftSignature:
        string | null =
        null

      let staleSequenceEmitted =
        false

      let disconnectTimer:
        number | null =
        null

      if (connectedUserId) {
        const state =
          mockDatabase.read()

        for (
          const order
          of state.orders
        ) {
          if (
            order.userId ===
            connectedUserId
          ) {
            lastOrderVersionById.set(
              order.id,
              order.version,
            )
          }
        }
      }

      const scenarioAtConnection =
        getActiveScenario()

      if (
        scenarioAtConnection
          .flags
          .realtimeDisconnectOnce
      ) {
        disconnectTimer =
          window.setTimeout(
            () => {
              setActiveScenario(
                'price-changed',
              )

              connection.client.close(
                1012,
                'Mock realtime reconnect',
              )
            },
            180,
          )
      }

      function synchronizeNft(): void {
        const event =
          applyRealtimeScenario()

        if (!event) {
          return
        }

        const signature =
          createEventSignature(
            event,
          )

        if (
          signature ===
          lastNftSignature
        ) {
          return
        }

        lastNftSignature =
          signature

        socket.client.emit(
          'nft.updated',
          event,
        )

        if (
          getActiveScenario()
            .flags
            .realtimeStaleDuplicate &&
          !staleSequenceEmitted
        ) {
          staleSequenceEmitted =
            true

          window.setTimeout(
            () => {
              socket.client.emit(
                'nft.updated',
                event,
              )
            },
            35,
          )

          window.setTimeout(
            () => {
              socket.client.emit(
                'nft.updated',
                createStaleEvent(
                  event,
                ),
              )
            },
            70,
          )
        }
      }

      function synchronizeOrders(): void {
        if (
          !connectedUserId
        ) {
          return
        }

        const state =
          mockDatabase.read()

        for (
          const order
          of state.orders
        ) {
          if (
            order.userId !==
            connectedUserId
          ) {
            continue
          }

          const previousVersion =
            lastOrderVersionById.get(
              order.id,
            )

          if (
            previousVersion !==
              undefined &&
            order.version <=
              previousVersion
          ) {
            continue
          }

          lastOrderVersionById.set(
            order.id,
            order.version,
          )

          socket.client.emit(
            'order.updated',
            toOrderUpdatedEvent(
              order,
            ),
          )
        }
      }

      const initialTimer =
        window.setTimeout(
          () => {
            synchronizeNft()
            synchronizeOrders()
          },
          150,
        )

      const interval =
        window.setInterval(
          () => {
            synchronizeNft()
            synchronizeOrders()
          },
          500,
        )

      connection.client
        .addEventListener(
          'close',
          () => {
            window.clearTimeout(
              initialTimer,
            )

            window.clearInterval(
              interval,
            )

            if (
              disconnectTimer !==
              null
            ) {
              window.clearTimeout(
                disconnectTimer,
              )
            }
          },
        )
    },
  ),
]