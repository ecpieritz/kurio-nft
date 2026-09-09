import type {
  BlockchainNetwork,
  DecimalString,
  EntityId,
  ISODateString,
  VersionedResource,
  WalletAddress,
} from '@/lib/api/contracts/common'
import type { NftImage } from '@/lib/api/contracts/nft'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface CollectorCheckoutDetails {
  displayName: string
  username: string
  email: string
  profileName: string
  ensName: string
  note?: string
}

export interface CreateOrderRequest {
  quoteId: EntityId
  walletId: EntityId
  network: BlockchainNetwork
  collector: CollectorCheckoutDetails
}

export interface OrderItemSnapshot {
  nftId: EntityId
  editionId: EntityId
  tokenId: string
  name: string
  image: NftImage
  quantity: number
  unitPriceEth: DecimalString
  subtotalEth: DecimalString
}

export interface OrderReceipt {
  transactionReference: string
  explorerUrl: string
  walletAddress: WalletAddress
  walletProvider: string
  confirmedAt: ISODateString
  items: OrderItemSnapshot[]
  subtotalEth: DecimalString
  discountEth: DecimalString
  networkFeeEth: DecimalString
  totalEth: DecimalString
}

export interface Order extends VersionedResource {
  id: EntityId
  userId: EntityId
  status: OrderStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  receipt: OrderReceipt | null
  declineReason?: string
}

export interface IdempotencyHeaders {
  'Idempotency-Key': string
}
