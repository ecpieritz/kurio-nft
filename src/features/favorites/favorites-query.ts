import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchFavorites, updateFavorite } from '@/features/favorites/favorites-api'
import type { FavoriteCollection } from '@/lib/api/contracts'

export const favoriteQueryKeys = {
  all: ['favorites'] as const,
  collection: (userId: string) => [...favoriteQueryKeys.all, userId] as const,
}

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoriteQueryKeys.collection(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
    staleTime: 30_000,
  })
}

export function useFavoritesQuery(userId: string | null) {
  return useQuery({
    ...favoritesQueryOptions(userId ?? 'anonymous'),
    enabled: Boolean(userId),
  })
}

interface ToggleFavoriteVariables {
  nftId: string
  favorite: boolean
}

interface ToggleFavoriteContext {
  previous?: FavoriteCollection
}

export function useToggleFavoriteMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = favoriteQueryKeys.collection(userId ?? 'anonymous')

  return useMutation<
    Awaited<ReturnType<typeof updateFavorite>>,
    Error,
    ToggleFavoriteVariables,
    ToggleFavoriteContext
  >({
    mutationFn: ({ nftId, favorite }) => updateFavorite(nftId, favorite),

    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey })

      const previous =
        queryClient.getQueryData<FavoriteCollection>(queryKey)

      const currentIds = previous?.nftIds ?? []

      const nftIds = favorite
        ? currentIds.includes(nftId)
          ? currentIds
          : [...currentIds, nftId]
        : currentIds.filter((favoriteId) => favoriteId !== nftId)

      queryClient.setQueryData<FavoriteCollection>(queryKey, {
        nftIds,
        version: (previous?.version ?? 0) + 1,
      })

      return { previous }
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      } else {
        queryClient.removeQueries({
          queryKey,
          exact: true,
        })
      }
    },

    onSuccess: (response) => {
      queryClient.setQueryData<FavoriteCollection>(
        queryKey,
        (current) => ({
          nftIds: current?.nftIds ?? [],
          version: response.version,
        }),
      )
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
