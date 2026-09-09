import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type { DecimalString, NftDetails, NftUpdatedEvent } from '@/lib/api/contracts'
import { mockDatabase } from '@/mocks/database/database'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

const realtimeApi = ws.link('*/socket.io/')

const REALTIME_NFT_ID = 'emerald-ape-042'

const REALTIME_PRICE: DecimalString = '1.29'

const REALTIME_EDITION_ID = `${REALTIME_NFT_ID}:1-50`

function toRealtimeEvent(nft: NftDetails): NftUpdatedEvent {
  return {
    nftId: nft.id,

    version: nft.version,

    priceEth: nft.priceEth,

    previousPriceEth: nft.previousPriceEth,

    availableQuantity: nft.availableQuantity,

    editions: nft.editions.map((edition) => ({
      editionId: edition.id,

      availableQuantity: edition.availableQuantity,

      purchasable: edition.purchasable,
    })),

    occurredAt: new Date().toISOString(),
  }
}

function applyRealtimeScenario(): NftUpdatedEvent | null {
  const scenario = getActiveScenario()

  const shouldChangePrice = scenario.flags.priceChanged === true

  const shouldSellOutEdition = scenario.flags.editionSoldOut === true

  if (!shouldChangePrice && !shouldSellOutEdition) {
    return null
  }

  const state = mockDatabase.read()

  const nft = state.nfts.find((candidate) => candidate.id === REALTIME_NFT_ID)

  if (!nft) {
    return null
  }

  let changed = false

  if (shouldChangePrice && nft.priceEth !== REALTIME_PRICE) {
    nft.previousPriceEth = nft.priceEth

    nft.priceEth = REALTIME_PRICE

    changed = true
  }

  if (shouldSellOutEdition) {
    const edition = nft.editions.find((candidate) => candidate.id === REALTIME_EDITION_ID)

    if (edition && (edition.availableQuantity !== 0 || edition.purchasable)) {
      edition.availableQuantity = 0

      edition.purchasable = false

      nft.availableQuantity = nft.editions.reduce(
        (highest, candidate) => Math.max(highest, candidate.availableQuantity),
        0,
      )

      changed = true
    }
  }

  if (changed) {
    nft.version += 1

    state.revision += 1

    mockDatabase.write(state)
  }

  return toRealtimeEvent(nft)
}

function createEventSignature(event: NftUpdatedEvent): string {
  return JSON.stringify({
    nftId: event.nftId,

    version: event.version,

    priceEth: event.priceEth,

    availableQuantity: event.availableQuantity,

    editions: event.editions,
  })
}

export const realtimeHandlers = [
  realtimeApi.addEventListener(
    'connection',

    (connection) => {
      const socket = toSocketIo(connection)

      let lastSignature: string | null = null

      function synchronize(): void {
        const event = applyRealtimeScenario()

        if (!event) {
          return
        }

        const signature = createEventSignature(event)

        if (signature === lastSignature) {
          return
        }

        lastSignature = signature

        socket.client.emit('nft.updated', event)
      }

      const initialTimer = window.setTimeout(synchronize, 150)

      const interval = window.setInterval(synchronize, 750)

      connection.client.addEventListener('close', () => {
        window.clearTimeout(initialTimer)

        window.clearInterval(interval)
      })
    },
  ),
]
