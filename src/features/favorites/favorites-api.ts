import { apiRequest } from '@/lib/api'
import type { FavoriteCollection, FavoriteMutationResponse } from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'

export function fetchFavorites(signal?: AbortSignal): Promise<FavoriteCollection> {
  return apiRequest<FavoriteCollection>({
    method: 'GET',
    url: endpoints.favorites.list,
    signal,
  })
}

export function updateFavorite(
  nftId: string,
  favorite: boolean,
): Promise<FavoriteMutationResponse> {
  return apiRequest<FavoriteMutationResponse>({
    method: favorite ? 'PUT' : 'DELETE',
    url: endpoints.favorites.item(nftId),
  })
}