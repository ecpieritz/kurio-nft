import { io, type Socket } from 'socket.io-client'

import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/lib/api/contracts'

interface ServerToClientEvents {
  'nft.updated': (payload: NftUpdatedEvent) => void
  'order.updated': (payload: OrderUpdatedEvent) => void
}

type ClientToServerEvents = Record<never, never>

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const MOCK_REALTIME_URL = 'https://realtime.kurio.test'

let realtimeSocket: RealtimeSocket | null = null
let realtimeSocketSessionToken: string | null = null

function mocksAreEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MOCKS !== 'false'
}

function getRealtimeUrl(): string {
  const configuredUrl = import.meta.env.VITE_REALTIME_URL?.trim()

  if (configuredUrl) {
    return configuredUrl
  }

  return mocksAreEnabled() ? MOCK_REALTIME_URL : window.location.origin
}

export function getRealtimeSocket(sessionToken: string | null): RealtimeSocket {
  if (realtimeSocket && realtimeSocketSessionToken !== sessionToken) {
    realtimeSocket.removeAllListeners()
    realtimeSocket.disconnect()
    realtimeSocket = null
  }

  if (!realtimeSocket) {
    realtimeSocketSessionToken = sessionToken

    realtimeSocket = io(getRealtimeUrl(), {
      autoConnect: false,
      forceNew: true,
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3_000,
      query: sessionToken ? { sessionToken } : undefined,
    })
  }

  return realtimeSocket
}