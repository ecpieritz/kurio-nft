import { createContext } from 'react'

import type { LoginRequest, SessionUser } from '@/lib/api/contracts'

export type AuthStatus = 'anonymous' | 'authenticated' | 'pending'

export interface AuthContextValue {
  status: AuthStatus
  user: SessionUser | null
  sessionError: Error | null
  login: (request: LoginRequest) => Promise<SessionUser>
  logout: () => Promise<void>
  retrySession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
