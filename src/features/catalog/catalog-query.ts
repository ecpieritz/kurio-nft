import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchNftDetails, fetchNfts } from '@/features/catalog/catalog-api'
import type { NftListRequest } from '@/lib/api/contracts'

export const catalogQueryKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogQueryKeys.all, 'list'] as const,
  list: (request: NftListRequest) => [...catalogQueryKeys.lists(), request] as const,
  details: () => [...catalogQueryKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogQueryKeys.details(), nftId] as const,
}

export function catalogQueryOptions(request: NftListRequest) {
  return queryOptions({
    queryKey: catalogQueryKeys.list(request),
    queryFn: ({ signal }) => fetchNfts(request, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useCatalogQuery(request: NftListRequest) {
  return useQuery(catalogQueryOptions(request))
}

export function nftDetailsQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogQueryKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNftDetails(nftId, signal),
    staleTime: 30_000,
  })
}

export function useNftDetailsQuery(nftId: string) {
  return useQuery(nftDetailsQueryOptions(nftId))
}
