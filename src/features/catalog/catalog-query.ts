import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchNfts } from '@/features/catalog/catalog-api'
import type { NftListRequest } from '@/lib/api/contracts'

export const catalogQueryKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogQueryKeys.all, 'list'] as const,
  list: (request: NftListRequest) => [...catalogQueryKeys.lists(), request] as const,
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
