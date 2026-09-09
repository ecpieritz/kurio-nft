import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  fetchNftDetails,
  fetchNfts,
} from '@/features/catalog/catalog-api'
import type {
  NftDetails,
  NftListRequest,
  NftListResponse,
} from '@/lib/api/contracts'

export const catalogQueryKeys = {
  all: ['nfts'] as const,

  lists: () =>
    [
      ...catalogQueryKeys.all,
      'list',
    ] as const,

  list: (
    request: NftListRequest,
  ) =>
    [
      ...catalogQueryKeys.lists(),
      request,
    ] as const,

  details: () =>
    [
      ...catalogQueryKeys.all,
      'detail',
    ] as const,

  detail: (
    nftId: string,
  ) =>
    [
      ...catalogQueryKeys.details(),
      nftId,
    ] as const,
}

export function useCatalogQuery(
  request: NftListRequest,
): UseQueryResult<
  NftListResponse,
  Error
> {
  return useQuery<
    NftListResponse,
    Error
  >({
    queryKey:
      catalogQueryKeys.list(
        request,
      ),

    queryFn: ({
      signal,
    }): Promise<NftListResponse> =>
      fetchNfts(
        request,
        signal,
      ),

    placeholderData:
      keepPreviousData,

    staleTime: 30_000,
  })
}

export function useNftDetailsQuery(
  nftId: string,
): UseQueryResult<
  NftDetails,
  Error
> {
  return useQuery<
    NftDetails,
    Error
  >({
    queryKey:
      catalogQueryKeys.detail(
        nftId,
      ),

    queryFn: ({
      signal,
    }): Promise<NftDetails> =>
      fetchNftDetails(
        nftId,
        signal,
      ),

    staleTime: 30_000,
  })
}