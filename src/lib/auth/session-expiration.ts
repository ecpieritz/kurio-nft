import { ApiClientError } from '@/lib/api/error'

type SessionExpirationListener = (error: ApiClientError) => void

const listeners = new Set<SessionExpirationListener>()

export function isSessionInvalidationError(error: unknown): error is ApiClientError {
  return (
    error instanceof ApiClientError &&
    (error.status === 401 || error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHORIZED')
  )
}

export function reportSessionExpiration(error: ApiClientError): void {
  listeners.forEach((listener) => listener(error))
}

export function subscribeToSessionExpiration(listener: SessionExpirationListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
