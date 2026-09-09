import { http, HttpResponse } from 'msw'

import type {
  ApiErrorResponse,
  FavoriteCollection,
  FavoriteMutationResponse,
} from '@/lib/api/contracts'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { mockDatabase } from '@/mocks/database/database'
import { applyNetworkScenario } from '@/mocks/scenarios/network'

function notFoundResponse(): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'NFT n\u00e3o encontrado.',
        retryable: false,
      },
    },
    { status: 404 },
  )
}

export const favoriteHandlers = [
  http.get('*/api/favorites', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('favorites')
    if (scenarioResponse) return scenarioResponse

    const authorization = authorizeMockRequest(request)
    if (!authorization.authorized) return authorization.response

    const response: FavoriteCollection = authorization.state.favoritesByUser[
      authorization.userId
    ] ?? { nftIds: [], version: 1 }
    return HttpResponse.json(response)
  }),

  http.put('*/api/favorites/:nftId', async ({ request, params }) => {
    const scenarioResponse = await applyNetworkScenario('favorites')
    if (scenarioResponse) return scenarioResponse

    const authorization = authorizeMockRequest(request)
    if (!authorization.authorized) return authorization.response

    const nftId = String(params.nftId)
    if (!authorization.state.nfts.some((nft) => nft.id === nftId)) return notFoundResponse()

    const current = authorization.state.favoritesByUser[authorization.userId] ?? {
      nftIds: [],
      version: 0,
    }
    const nextIds = current.nftIds.includes(nftId) ? current.nftIds : [...current.nftIds, nftId]
    const nextCollection: FavoriteCollection = {
      nftIds: nextIds,
      version: current.version + 1,
    }
    authorization.state.favoritesByUser[authorization.userId] = nextCollection
    authorization.state.revision += 1
    mockDatabase.write(authorization.state)

    const response: FavoriteMutationResponse = {
      nftId,
      favorite: true,
      version: nextCollection.version,
    }
    return HttpResponse.json(response)
  }),

  http.delete('*/api/favorites/:nftId', async ({ request, params }) => {
    const scenarioResponse = await applyNetworkScenario('favorites')
    if (scenarioResponse) return scenarioResponse

    const authorization = authorizeMockRequest(request)
    if (!authorization.authorized) return authorization.response

    const nftId = String(params.nftId)
    if (!authorization.state.nfts.some((nft) => nft.id === nftId)) return notFoundResponse()

    const current = authorization.state.favoritesByUser[authorization.userId] ?? {
      nftIds: [],
      version: 0,
    }
    const nextCollection: FavoriteCollection = {
      nftIds: current.nftIds.filter((favoriteId) => favoriteId !== nftId),
      version: current.version + 1,
    }
    authorization.state.favoritesByUser[authorization.userId] = nextCollection
    authorization.state.revision += 1
    mockDatabase.write(authorization.state)

    const response: FavoriteMutationResponse = {
      nftId,
      favorite: false,
      version: nextCollection.version,
    }
    return HttpResponse.json(response)
  }),
]
