import type {
  BlockchainNetwork,
  Cart,
  CollectorProfile,
  CollectorWallet,
  DecimalString,
  EntityId,
  FavoriteCollection,
  ISODateString,
  NftDetails,
  Order,
  OrderItemSnapshot,
  QuoteResponse,
  SessionUser,
  WalletAddress,
} from '@/lib/api/contracts'

export interface MockUserRecord
  extends SessionUser {
  normalizedEmail: string
  passwordDigest: string
  createdAt: ISODateString
}

export interface MockSessionRecord {
  id: EntityId
  userId: EntityId
  expiresAt: ISODateString
}

export interface MockCouponRecord {
  code: string
  discountPercent: number
  expiresAt: ISODateString
  enabled: boolean
}

export interface MockOrderSnapshotRecord {
  orderId: EntityId
  cartId: EntityId
  network: BlockchainNetwork
  walletAddress: WalletAddress
  walletProvider: string
  items: OrderItemSnapshot[]
  subtotalEth: DecimalString
  discountEth: DecimalString
  networkFeeEth: DecimalString
  totalEth: DecimalString
}

export interface MockIdempotencyRecord {
  key: string
  userId: EntityId
  requestFingerprint: string
  orderId: EntityId
  orderSnapshot?: MockOrderSnapshotRecord
}

export interface MockDatabaseState {
  schemaVersion: 1
  revision: number
  users: MockUserRecord[]
  sessions: MockSessionRecord[]
  nfts: NftDetails[]

  favoritesByUser: Record<
    EntityId,
    FavoriteCollection
  >

  carts: Cart[]
  quotes: QuoteResponse[]
  orders: Order[]

  profilesByUser: Record<
    EntityId,
    CollectorProfile
  >

  walletsByUser: Record<
    EntityId,
    CollectorWallet[]
  >

  coupons: MockCouponRecord[]

  idempotencyRecords:
    MockIdempotencyRecord[]
}