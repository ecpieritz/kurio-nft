import type { DecimalString, EntityId, ISODateString } from '@/lib/api/contracts/common'
import type { Order } from '@/lib/api/contracts/orders'

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

export interface OrderUpdatedEvent {
  orderId: EntityId
  userId: EntityId
  version: number
  order: Order
  occurredAt: ISODateString
}
