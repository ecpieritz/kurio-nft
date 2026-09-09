import type { RegisterRequest, RegisterResponse } from '@/lib/api/contracts'
import { apiRequest } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'

export function registerAccount(request: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse, RegisterRequest>({
    method: 'POST',
    url: endpoints.auth.register,
    data: request,
  })
}
