import { apiRequest } from '@/lib/api/client'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'

export function fetchProfile(
  signal?: AbortSignal,
): Promise<CollectorProfile> {
  return apiRequest<CollectorProfile>({
    method: 'GET',
    url: endpoints.profile.details,
    signal,
  })
}

export function updateProfile(
  request: UpdateProfileRequest,
): Promise<CollectorProfile> {
  return apiRequest<
    CollectorProfile,
    UpdateProfileRequest
  >({
    method: 'PATCH',
    url: endpoints.profile.details,
    data: request,
  })
}

export function updateAvatar(
  request: UpdateAvatarRequest,
): Promise<CollectorProfile> {
  return apiRequest<
    CollectorProfile,
    UpdateAvatarRequest
  >({
    method: 'PATCH',
    url: endpoints.profile.avatar,
    data: request,
  })
}

export function changePassword(
  request: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  return apiRequest<
    ChangePasswordResponse,
    ChangePasswordRequest
  >({
    method: 'PATCH',
    url: endpoints.profile.password,
    data: request,
  })
}