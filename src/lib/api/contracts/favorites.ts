import type { EntityId, VersionedResource } from '@/lib/api/contracts/common'

export interface FavoriteCollection extends VersionedResource {
  nftIds: EntityId[]
}

export interface FavoriteMutationRequest {
  nftId: EntityId
}

export interface FavoriteMutationResponse extends VersionedResource {
  nftId: EntityId
  favorite: boolean
}
