import { io, type Socket } from 'socket.io-client'

import type { NftUpdatedEvent } from '@/lib/api/contracts'

interface ServerToClientEvents {
  'nft.updated': (payload: NftUpdatedEvent) => void
}

type ClientToServerEvents = Record<never, never>

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let realtimeSocket: RealtimeSocket | null = null

function getRealtimeUrl(): string {
  const configuredUrl = import.meta.env.VITE_REALTIME_URL?.trim()

  if (configuredUrl) {
    return configuredUrl
  }

  return window.location.origin
}

export function getRealtimeSocket(): RealtimeSocket {
  realtimeSocket ??= io(getRealtimeUrl(), {
    autoConnect: false,

    path: '/socket.io',

    transports: ['websocket'],

    reconnection: true,

    reconnectionAttempts: 5,

    reconnectionDelay: 500,

    reconnectionDelayMax: 3_000,
  })

  return realtimeSocket
}
