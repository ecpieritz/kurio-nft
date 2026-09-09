import { http, HttpResponse } from 'msw'

import type {
  ApiErrorResponse,
  BlockchainNetwork,
  DecimalString,
  NftCategory,
  NftDetails,
  NftListFacets,
  NftListResponse,
  NftSort,
  NftSummary,
} from '@/lib/api/contracts'
import { categoryOptions, networkOptions, sortOptions } from '@/features/catalog/catalog-config'
import { mockDatabase } from '@/mocks/database/database'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isDecimalString(value: string): value is DecimalString {
  return decimalPattern.test(value)
}

function compareDecimals(left: DecimalString, right: DecimalString): number {
  const [leftInteger, leftFraction = ''] = left.split('.')
  const [rightInteger, rightFraction = ''] = right.split('.')
  const scale = Math.max(leftFraction.length, rightFraction.length)
  const leftScaled = BigInt(`${leftInteger}${leftFraction.padEnd(scale, '0')}`)
  const rightScaled = BigInt(`${rightInteger}${rightFraction.padEnd(scale, '0')}`)

  return leftScaled < rightScaled ? -1 : leftScaled > rightScaled ? 1 : 0
}

function toSummary(nft: NftDetails): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    collectionName: nft.collectionName,
    category: nft.category,
    network: nft.network,
    priceEth: nft.priceEth,
    previousPriceEth: nft.previousPriceEth,
    image: nft.image,
    availableQuantity: nft.availableQuantity,
    featured: nft.featured,
    rare: nft.rare,
    version: nft.version,
  }
}

function countBy<TValue extends string>(
  values: readonly TValue[],
  nfts: readonly NftDetails[],
  select: (nft: NftDetails) => TValue,
): Record<TValue, number> {
  return Object.fromEntries(
    values.map((value) => [value, nfts.filter((nft) => select(nft) === value).length]),
  ) as Record<TValue, number>
}

function createFacets(nfts: readonly NftDetails[]): NftListFacets {
  const prices = nfts.map((nft) => nft.priceEth)
  const sortedPrices = [...prices].sort(compareDecimals)

  return {
    categories: countBy<NftCategory>(
      categoryOptions.map((option) => option.value),
      nfts,
      (nft) => nft.category,
    ),
    networks: countBy<BlockchainNetwork>(
      networkOptions.map((option) => option.value),
      nfts,
      (nft) => nft.network,
    ),
    minPriceEth: sortedPrices[0] ?? '0',
    maxPriceEth: sortedPrices.at(-1) ?? '0',
  }
}

function invalidQueryResponse(message: string): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message,
        retryable: false,
      },
    },
    { status: 422 },
  )
}

export const nftHandlers = [
  http.get('*/api/nfts', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('nfts')
    if (scenarioResponse) return scenarioResponse

    const url = new URL(request.url)
    const search = normalizeSearch(url.searchParams.get('search') ?? '')
    const categories = url.searchParams.getAll('category')
    const networks = url.searchParams.getAll('network')
    const sort = url.searchParams.get('sort') ?? 'recent'
    const minPrice = url.searchParams.get('minPriceEth')
    const maxPrice = url.searchParams.get('maxPriceEth')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20')
    const validCategories = new Set(categoryOptions.map((option) => option.value))
    const validNetworks = new Set(networkOptions.map((option) => option.value))
    const validSorts = new Set(sortOptions.map((option) => option.value))

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !validSorts.has(sort as NftSort) ||
      categories.some((category) => !validCategories.has(category as NftCategory)) ||
      networks.some((network) => !validNetworks.has(network as BlockchainNetwork)) ||
      (minPrice !== null && !isDecimalString(minPrice)) ||
      (maxPrice !== null && !isDecimalString(maxPrice))
    ) {
      return invalidQueryResponse('Os filtros informados s\u00e3o inv\u00e1lidos.')
    }

    if (minPrice !== null && maxPrice !== null && compareDecimals(minPrice, maxPrice) > 0) {
      return invalidQueryResponse(
        'O pre\u00e7o m\u00ednimo n\u00e3o pode superar o pre\u00e7o m\u00e1ximo.',
      )
    }

    const state = mockDatabase.read()
    const sourceNfts = getActiveScenario().flags.emptyCatalog ? [] : state.nfts
    const filteredNfts = sourceNfts.filter((nft) => {
      const searchableText = normalizeSearch(`${nft.name} ${nft.tokenId} ${nft.collectionName}`)

      return (
        (!search || searchableText.includes(search)) &&
        (categories.length === 0 || categories.includes(nft.category)) &&
        (networks.length === 0 || networks.includes(nft.network)) &&
        (minPrice === null || compareDecimals(nft.priceEth, minPrice) >= 0) &&
        (maxPrice === null || compareDecimals(nft.priceEth, maxPrice) <= 0)
      )
    })

    const sortedNfts = [...filteredNfts].sort((left, right) => {
      if (sort === 'price-asc') return compareDecimals(left.priceEth, right.priceEth)
      if (sort === 'price-desc') return compareDecimals(right.priceEth, left.priceEth)
      if (sort === 'popular') {
        return (
          Number(right.featured) - Number(left.featured) ||
          right.reviewCount - left.reviewCount ||
          Number(right.rare) - Number(left.rare)
        )
      }

      return sourceNfts.indexOf(left) - sourceNfts.indexOf(right)
    })

    const totalItems = sortedNfts.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const response: NftListResponse = {
      items: sortedNfts.slice(startIndex, startIndex + pageSize).map(toSummary),
      page: { page, pageSize, totalItems, totalPages },
      facets: createFacets(sourceNfts),
    }

    return HttpResponse.json(response)
  }),
]
