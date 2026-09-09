import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SessionResponse,
} from '@/lib/api/contracts'
import { apiRequest } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'

export function fetchSession(): Promise<SessionResponse> {
  return apiRequest<SessionResponse>({
    method: 'GET',
    url: endpoints.auth.session,
  })
}

export function loginAccount(request: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse, LoginRequest>({
    method: 'POST',
    url: endpoints.auth.login,
    data: request,
  })
}

export function logoutAccount(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>({
    method: 'POST',
    url: endpoints.auth.logout,
  })
}
