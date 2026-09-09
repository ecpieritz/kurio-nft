import { apiRequest } from '@/lib/api'
import type { NftDetails, NftListRequest, NftListResponse } from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'

function createSearchParams(request: NftListRequest): URLSearchParams {
  const params = new URLSearchParams({
    sort: request.sort,
    page: String(request.page),
    pageSize: String(request.pageSize),
  })

  if (request.search) params.set('search', request.search)
  if (request.minPriceEth) params.set('minPriceEth', request.minPriceEth)
  if (request.maxPriceEth) params.set('maxPriceEth', request.maxPriceEth)
  request.categories?.forEach((category) => params.append('category', category))
  request.networks?.forEach((network) => params.append('network', network))

  return params
}

export function fetchNfts(request: NftListRequest, signal?: AbortSignal): Promise<NftListResponse> {
  return apiRequest<NftListResponse>({
    method: 'GET',
    url: endpoints.nfts.list,
    params: createSearchParams(request),
    signal,
  })
}

export function fetchNftDetails(nftId: string, signal?: AbortSignal): Promise<NftDetails> {
  return apiRequest<NftDetails>({
    method: 'GET',
    url: endpoints.nfts.details(nftId),
    signal,
  })
}
