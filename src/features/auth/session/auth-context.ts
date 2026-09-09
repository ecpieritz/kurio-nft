import { createContext } from 'react'

import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  SessionUser,
} from '@/lib/api/contracts'

export type AuthStatus = 'anonymous' | 'authenticated' | 'pending'

export interface AuthContextValue {
  status: AuthStatus
  user: SessionUser | null
  sessionError: Error | null
  sessionExpiredAt: number | null
  loginCompletedAt: number | null
  login: (request: LoginRequest) => Promise<SessionUser>
  register: (request: RegisterRequest) => Promise<RegisterResponse>
  logout: () => Promise<void>
  retrySession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
