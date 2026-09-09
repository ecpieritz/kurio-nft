import type {
  DecimalString,
  EntityId,
  ISODateString,
  VersionedResource,
} from '@/lib/api/contracts/common'
import type { NftImage } from '@/lib/api/contracts/nft'

export interface CartItem extends VersionedResource {
  id: EntityId
  nftId: EntityId
  editionId: EntityId
  tokenId: string
  name: string
  image: NftImage
  unitPriceEth: DecimalString
  quantity: number
  availableQuantity: number
  priceChanged: boolean
  availabilityChanged: boolean
}

export interface Cart extends VersionedResource {
  id: EntityId
  userId: EntityId | null
  visitorId: EntityId | null
  items: CartItem[]
  updatedAt: ISODateString
}

export interface AddCartItemRequest {
  nftId: EntityId
  editionId: EntityId
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
  expectedVersion: number
}

export interface RemoveCartItemResponse {
  removedItemId: EntityId
  cart: Cart
}
