export type SessionStatus = 'anonymous' | 'authenticated' | 'pending'

export interface RouterAuthContext {
  status: SessionStatus
  userId: string | null
}

export interface RouterContext {
  auth: RouterAuthContext
}

export const anonymousAuthContext: RouterAuthContext = {
  status: 'anonymous',
  userId: null,
}
