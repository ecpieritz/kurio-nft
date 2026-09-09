import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  createWallet,
  fetchWallets,
  updateWallet,
} from '@/features/wallets/wallets-api'
import type {
  CollectorWallet,
  SaveWalletRequest,
  WalletCollection,
} from '@/lib/api/contracts'

export const walletQueryKeys = {
  all: ['wallets'] as const,

  collection: () =>
    [
      ...walletQueryKeys.all,
      'collection',
    ] as const,
}

export function useWalletsQuery(): UseQueryResult<
  WalletCollection,
  Error
> {
  return useQuery<
    WalletCollection,
    Error
  >({
    queryKey:
      walletQueryKeys.collection(),

    queryFn: ({
      signal,
    }): Promise<WalletCollection> =>
      fetchWallets(signal),

    staleTime: 30_000,
  })
}

export function useCreateWalletMutation(): UseMutationResult<
  CollectorWallet,
  Error,
  SaveWalletRequest
> {
  const queryClient =
    useQueryClient()

  return useMutation<
    CollectorWallet,
    Error,
    SaveWalletRequest
  >({
    mutationFn:
      createWallet,

    onSuccess: (
      createdWallet,
    ) => {
      queryClient.setQueryData<WalletCollection>(
        walletQueryKeys.collection(),

        (
          current,
        ) => {
          const currentItems =
            current?.items ?? []

          const items =
            createdWallet.primary
              ? currentItems.map(
                  (
                    wallet,
                  ) => ({
                    ...wallet,
                    primary: false,
                  }),
                )
              : currentItems

          return {
            items: [
              ...items,
              createdWallet,
            ],
          }
        },
      )
    },
  })
}

interface UpdateWalletVariables {
  walletId: string
  request: SaveWalletRequest
}

export function useUpdateWalletMutation(): UseMutationResult<
  CollectorWallet,
  Error,
  UpdateWalletVariables
> {
  const queryClient =
    useQueryClient()

  return useMutation<
    CollectorWallet,
    Error,
    UpdateWalletVariables
  >({
    mutationFn: ({
      walletId,
      request,
    }) =>
      updateWallet(
        walletId,
        request,
      ),

    onSuccess: (
      updatedWallet,
    ) => {
      queryClient.setQueryData<WalletCollection>(
        walletQueryKeys.collection(),

        (
          current,
        ) => ({
          items:
            current?.items.map(
              (
                wallet,
              ) => {
                if (
                  wallet.id ===
                  updatedWallet.id
                ) {
                  return updatedWallet
                }

                if (
                  updatedWallet.primary
                ) {
                  return {
                    ...wallet,
                    primary: false,
                  }
                }

                return wallet
              },
            ) ?? [
              updatedWallet,
            ],
        }),
      )
    },
  })
}