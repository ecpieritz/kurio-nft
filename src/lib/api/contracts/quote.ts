import type {
  BlockchainNetwork,
  DecimalString,
  EntityId,
  ISODateString,
} from '@/lib/api/contracts/common'

export type CouponStatus = 'applied' | 'invalid' | 'expired' | 'not-applied'

export interface QuoteItemRequest {
  cartItemId: EntityId
  quantity: number
  expectedNftVersion: number
}

export interface QuoteRequest {
  cartId: EntityId
  expectedCartVersion: number
  network: BlockchainNetwork
  couponCode?: string
  items: QuoteItemRequest[]
}

export interface QuoteItem {
  cartItemId: EntityId
  nftId: EntityId
  editionId: EntityId
  quantity: number
  unitPriceEth: DecimalString
  subtotalEth: DecimalString
  nftVersion: number
}

export interface QuoteResponse {
  id: EntityId
  cartId: EntityId
  cartVersion: number
  network: BlockchainNetwork
  items: QuoteItem[]
  coupon: {
    code: string | null
    status: CouponStatus
  }
  subtotalEth: DecimalString
  discountEth: DecimalString
  networkFeeEth: DecimalString
  totalEth: DecimalString
  expiresAt: ISODateString
}
