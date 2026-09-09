import type {
  BlockchainNetwork,
  DecimalString,
  EntityId,
  PaginatedResponse,
  VersionedResource,
} from '@/lib/api/contracts/common'

export type NftCategory =
  | 'digital-art'
  | 'photography'
  | 'music'
  | '3d-art'
  | 'collectibles'
  | 'generative'
  | 'games'
  | 'memberships'
  | 'utility'

export type NftSort = 'recent' | 'popular' | 'price-asc' | 'price-desc'

export interface NftImage {
  url: string
  alt: string
  width: number
  height: number
}

export interface NftEdition {
  id: EntityId
  label: string
  minted: number
  supply: number | null
  availableQuantity: number
  purchasable: boolean
}

export interface NftSummary extends VersionedResource {
  id: EntityId
  tokenId: string
  name: string
  collectionName: string
  category: NftCategory
  network: BlockchainNetwork
  priceEth: DecimalString
  previousPriceEth?: DecimalString
  image: NftImage
  availableQuantity: number
  featured: boolean
  rare: boolean
}

export interface NftDetails extends NftSummary {
  description: string
  longDescription: string
  contractAddress: string
  creatorRoyaltyPercentage: DecimalString
  attributes: string[]
  editions: NftEdition[]
  gallery: NftImage[]
  rating: DecimalString
  reviewCount: number
}

export interface NftListRequest {
  search?: string
  categories?: NftCategory[]
  networks?: BlockchainNetwork[]
  minPriceEth?: DecimalString
  maxPriceEth?: DecimalString
  sort: NftSort
  page: number
  pageSize: number
}

export interface NftListFacets {
  categories: Record<NftCategory, number>
  networks: Record<BlockchainNetwork, number>
  minPriceEth: DecimalString
  maxPriceEth: DecimalString
}

export interface NftListResponse extends PaginatedResponse<NftSummary> {
  facets: NftListFacets
}
