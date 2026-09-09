export type EntityId = string
export type ISODateString = string
export type DecimalString = `${number}`
export type EthereumAddress = `0x${string}`
export type WalletAddress = string

export type BlockchainNetwork = 'ethereum' | 'polygon' | 'solana'

export interface VersionedResource {
  version: number
}

export interface PageRequest {
  page: number
  pageSize: number
}

export interface PageMetadata extends PageRequest {
  totalItems: number
  totalPages: number
}

export interface PaginatedResponse<TItem> {
  items: TItem[]
  page: PageMetadata
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'AVAILABILITY_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'REQUEST_CANCELLED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR'

export interface FieldError {
  field: string
  code: string
  message: string
}

export interface ApiErrorPayload {
  code: ApiErrorCode
  message: string
  retryable: boolean
  requestId?: string
  fieldErrors?: FieldError[]
  details?: Record<string, unknown>
}

export interface ApiErrorResponse {
  error: ApiErrorPayload
}
