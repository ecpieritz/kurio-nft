import type { EntityId, ISODateString } from '@/lib/api/contracts/common'

export interface SessionUser {
  id: EntityId
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export interface SessionResponse {
  user: SessionUser
  expiresAt: ISODateString
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  user: SessionUser
  createdAt: ISODateString
}

export interface LogoutResponse {
  success: true
}
