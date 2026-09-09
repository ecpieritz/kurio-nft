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

export interface LoginResponse extends SessionResponse {
  sessionToken: string
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

export interface RegisterResponse extends SessionResponse {
  user: SessionUser
  createdAt: ISODateString
  sessionToken: string
}

export interface LogoutResponse {
  success: true
}
