import type { DecimalString, EntityId, ISODateString } from '@/lib/api/contracts/common'

export interface NftEditionAvailabilityUpdate {
  editionId: EntityId
  availableQuantity: number
  purchasable: boolean
}

export interface NftUpdatedEvent {
  nftId: EntityId
  version: number
  priceEth: DecimalString
  previousPriceEth?: DecimalString
  availableQuantity: number
  editions: NftEditionAvailabilityUpdate[]
  occurredAt: ISODateString
}
