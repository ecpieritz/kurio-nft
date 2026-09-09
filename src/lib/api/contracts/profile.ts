import type { EntityId, ISODateString, VersionedResource } from '@/lib/api/contracts/common'

export interface CollectorProfile extends VersionedResource {
  userId: EntityId
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  updatedAt: ISODateString
}

export interface UpdateProfileRequest {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  expectedVersion: number
}

export interface UpdateAvatarRequest {
  avatarDataUrl: string | null
  expectedVersion: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  changedAt: ISODateString
}
