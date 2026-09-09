import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { authQueryKeys } from '@/features/auth/session/auth-query-keys'
import {
  changePassword,
  fetchProfile,
  updateAvatar,
  updateProfile,
} from '@/features/profile/profile-api'
import { walletQueryKeys } from '@/features/wallets/wallets-query'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  SessionResponse,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/lib/api/contracts'

export const profileQueryKeys = {
  all: ['profile'] as const,

  details: () =>
    [
      ...profileQueryKeys.all,
      'details',
    ] as const,
}

function synchronizeSessionUser(
  queryClient: QueryClient,
  profile: CollectorProfile,
): void {
  queryClient.setQueryData<SessionResponse>(
    authQueryKeys.session,
    (current) => {
      if (!current) {
        return current
      }

      return {
        ...current,

        user: {
          ...current.user,

          username:
            profile.username,

          email:
            profile.email,

          displayName:
            profile.displayName,

          avatarUrl:
            profile.avatarUrl,
        },
      }
    },
  )
}

export function useProfileQuery(): UseQueryResult<
  CollectorProfile,
  Error
> {
  return useQuery<
    CollectorProfile,
    Error
  >({
    queryKey:
      profileQueryKeys.details(),

    queryFn: ({
      signal,
    }): Promise<CollectorProfile> =>
      fetchProfile(signal),

    staleTime: 30_000,
  })
}

export function useUpdateProfileMutation(): UseMutationResult<
  CollectorProfile,
  Error,
  UpdateProfileRequest
> {
  const queryClient =
    useQueryClient()

  return useMutation<
    CollectorProfile,
    Error,
    UpdateProfileRequest
  >({
    mutationFn:
      updateProfile,

    onSuccess: (
      profile,
    ) => {
      queryClient.setQueryData<CollectorProfile>(
        profileQueryKeys.details(),
        profile,
      )

      synchronizeSessionUser(
        queryClient,
        profile,
      )

      void queryClient.invalidateQueries({
        queryKey:
          walletQueryKeys.all,
      })
    },
  })
}

export function useUpdateAvatarMutation(): UseMutationResult<
  CollectorProfile,
  Error,
  UpdateAvatarRequest
> {
  const queryClient =
    useQueryClient()

  return useMutation<
    CollectorProfile,
    Error,
    UpdateAvatarRequest
  >({
    mutationFn:
      updateAvatar,

    onSuccess: (
      profile,
    ) => {
      queryClient.setQueryData<CollectorProfile>(
        profileQueryKeys.details(),
        profile,
      )

      synchronizeSessionUser(
        queryClient,
        profile,
      )
    },
  })
}

export function useChangePasswordMutation(): UseMutationResult<
  ChangePasswordResponse,
  Error,
  ChangePasswordRequest
> {
  return useMutation<
    ChangePasswordResponse,
    Error,
    ChangePasswordRequest
  >({
    mutationFn:
      changePassword,
  })
}