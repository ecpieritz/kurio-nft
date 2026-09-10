export type MockOperation =
  'auth' | 'nfts' | 'favorites' | 'cart' | 'quote' | 'orders' | 'profile' | 'wallets' | 'probe'

export const mockScenarioIds = [
  'default',
  'empty-catalog',
  'slow-network',
  'variable-latency',
  'out-of-order',
  'offline',
  'timeout',
  'http-422',
  'server-error',
  'session-expired',
  'registration-conflict',
  'invalid-coupon',
  'expired-coupon',
  'price-changed',
  'edition-sold-out',
  'favorite-mutation-error',
  'realtime-stale-duplicate',
  'realtime-reconnect',
  'order-timeout',
  'payment-confirmed',
  'payment-declined',
] as const

export type MockScenarioId = (typeof mockScenarioIds)[number]

export interface MockScenarioFlags {
  emptyCatalog?: boolean
  sessionExpired?: boolean
  registrationConflict?: boolean
  invalidCoupon?: boolean
  expiredCoupon?: boolean
  priceChanged?: boolean
  editionSoldOut?: boolean
  favoriteMutationError?: boolean
  realtimeStaleDuplicate?: boolean
  realtimeDisconnectOnce?: boolean
  timeoutAfterOrderCreation?: boolean
  paymentOutcome?: 'confirmed' | 'declined'
}

type NetworkEffect =
  | { type: 'none' }
  | { type: 'latency'; sequenceMs: readonly number[] }
  | { type: 'network-error'; operations: readonly MockOperation[] | 'all' }
  | { type: 'timeout'; operations: readonly MockOperation[] | 'all' }
  | {
      type: 'http-error'
      operations: readonly MockOperation[] | 'all'
      status: number
    }

export interface MockScenarioDefinition {
  id: MockScenarioId
  label: string
  description: string
  network: NetworkEffect
  flags: MockScenarioFlags
}

export const mockScenarios = {
  default: {
    id: 'default',
    label: 'Default success',
    description: 'Stable data, normal latency and successful operations.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: {},
  },
  'empty-catalog': {
    id: 'empty-catalog',
    label: 'Empty catalog',
    description: 'NFT list requests return a valid empty result.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { emptyCatalog: true },
  },
  'slow-network': {
    id: 'slow-network',
    label: 'Slow network',
    description: 'Every mocked business request waits 1.2 seconds.',
    network: { type: 'latency', sequenceMs: [1200] },
    flags: {},
  },
  'variable-latency': {
    id: 'variable-latency',
    label: 'Variable latency',
    description: 'Requests use a deterministic sequence of different delays.',
    network: { type: 'latency', sequenceMs: [75, 325, 125, 600] },
    flags: {},
  },
  'out-of-order': {
    id: 'out-of-order',
    label: 'Out-of-order responses',
    description: 'Consecutive requests resolve in a deterministic non-sequential order.',
    network: { type: 'latency', sequenceMs: [900, 80, 550, 40] },
    flags: {},
  },
  offline: {
    id: 'offline',
    label: 'Offline',
    description: 'Business requests fail at the network layer.',
    network: { type: 'network-error', operations: 'all' },
    flags: {},
  },
  timeout: {
    id: 'timeout',
    label: 'Request timeout',
    description: 'Business requests never resolve and are cancelled by the Axios timeout.',
    network: { type: 'timeout', operations: 'all' },
    flags: {},
  },
  'http-422': {
    id: 'http-422',
    label: 'HTTP validation error',
    description: 'Business requests return a deterministic HTTP 422 response.',
    network: { type: 'http-error', operations: 'all', status: 422 },
    flags: {},
  },
  'server-error': {
    id: 'server-error',
    label: 'HTTP service unavailable',
    description: 'Business requests return a retryable HTTP 503 response.',
    network: { type: 'http-error', operations: 'all', status: 503 },
    flags: {},
  },
  'session-expired': {
    id: 'session-expired',
    label: 'Expired session',
    description: 'Authenticated resources reject the active session.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { sessionExpired: true },
  },
  'registration-conflict': {
    id: 'registration-conflict',
    label: 'Registration conflict',
    description: 'Account creation reports an existing e-mail or username.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { registrationConflict: true },
  },
  'invalid-coupon': {
    id: 'invalid-coupon',
    label: 'Invalid coupon',
    description: 'Quote validation rejects the submitted coupon.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { invalidCoupon: true },
  },
  'expired-coupon': {
    id: 'expired-coupon',
    label: 'Expired coupon',
    description: 'Quote validation reports an expired coupon.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { expiredCoupon: true },
  },
  'price-changed': {
    id: 'price-changed',
    label: 'Price changed',
    description: 'An NFT price changes while it is in the cart.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { priceChanged: true },
  },
  'edition-sold-out': {
    id: 'edition-sold-out',
    label: 'Edition sold out',
    description: 'An NFT edition becomes unavailable during checkout.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { editionSoldOut: true },
  },
  'favorite-mutation-error': {
    id: 'favorite-mutation-error',
    label: 'Favorite mutation error',
    description: 'Favorite reads succeed, but the next favorite mutation returns a server error.',
    network: { type: 'latency', sequenceMs: [500] },
    flags: { favoriteMutationError: true },
  },
  'realtime-stale-duplicate': {
    id: 'realtime-stale-duplicate',
    label: 'Duplicate and stale realtime events',
    description: 'Emits a valid NFT update followed by a duplicate and an older event.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { priceChanged: true, realtimeStaleDuplicate: true },
  },
  'realtime-reconnect': {
    id: 'realtime-reconnect',
    label: 'Realtime reconnect',
    description:
      'Disconnects the Socket.IO client once and publishes an NFT update after reconnection.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { realtimeDisconnectOnce: true },
  },
  'order-timeout': {
    id: 'order-timeout',
    label: 'Timeout after order creation',
    description: 'The order is stored, but the first creation response times out.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { timeoutAfterOrderCreation: true },
  },
  'payment-confirmed': {
    id: 'payment-confirmed',
    label: 'Confirmed payment',
    description: 'The simulated wallet confirms the pending order.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { paymentOutcome: 'confirmed' },
  },
  'payment-declined': {
    id: 'payment-declined',
    label: 'Declined payment',
    description: 'The simulated wallet declines the pending order.',
    network: { type: 'latency', sequenceMs: [80] },
    flags: { paymentOutcome: 'declined' },
  },
} as const satisfies Record<MockScenarioId, MockScenarioDefinition>

export const defaultMockScenarioId: MockScenarioId = 'default'

export function isMockScenarioId(value: unknown): value is MockScenarioId {
  return typeof value === 'string' && value in mockScenarios
}
