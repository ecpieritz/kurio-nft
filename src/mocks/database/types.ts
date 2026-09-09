import type {
  Cart,
  CollectorProfile,
  CollectorWallet,
  EntityId,
  FavoriteCollection,
  ISODateString,
  NftDetails,
  Order,
  QuoteResponse,
  SessionUser,
} from '@/lib/api/contracts'

export interface MockUserRecord extends SessionUser {
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

export interface MockIdempotencyRecord {
  key: string
  requestFingerprint: string
  orderId: EntityId
}

export interface MockDatabaseState {
  schemaVersion: 1
  revision: number
  users: MockUserRecord[]
  sessions: MockSessionRecord[]
  nfts: NftDetails[]
  favoritesByUser: Record<EntityId, FavoriteCollection>
  carts: Cart[]
  quotes: QuoteResponse[]
  orders: Order[]
  profilesByUser: Record<EntityId, CollectorProfile>
  walletsByUser: Record<EntityId, CollectorWallet[]>
  coupons: MockCouponRecord[]
  idempotencyRecords: MockIdempotencyRecord[]
}
