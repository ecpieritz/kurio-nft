import { categoryOptions, networkOptions, sortOptions } from '@/features/catalog/catalog-config'
import type { BlockchainNetwork, DecimalString, NftCategory, NftSort } from '@/lib/api/contracts'

export type CatalogView = 'all' | 'new' | 'popular'

export interface CatalogSearch {
  search?: string
  categories?: string
  networks?: string
  minPriceEth?: DecimalString
  maxPriceEth?: DecimalString
  sort?: NftSort
  view?: CatalogView
  page?: number
}

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/
const categoryValues = categoryOptions.map((option) => option.value)
const networkValues = networkOptions.map((option) => option.value)
const sortValues = new Set<NftSort>(sortOptions.map((option) => option.value))
const viewValues = new Set<CatalogView>(['all', 'new', 'popular'])

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined
}

function normalizeSelection<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
): string | undefined {
  const candidates = (Array.isArray(value) ? value : [value])
    .filter((candidate): candidate is string => typeof candidate === 'string')
    .flatMap((candidate) => candidate.split(','))
    .map((candidate) => candidate.trim())
  const selectedValues = new Set(candidates)
  const normalizedValues = allowedValues.filter((allowedValue) => selectedValues.has(allowedValue))

  return normalizedValues.length ? normalizedValues.join(',') : undefined
}

function getDecimal(value: unknown): DecimalString | undefined {
  const stringValue = getString(value)
  return stringValue && decimalPattern.test(stringValue)
    ? (stringValue as DecimalString)
    : undefined
}

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const searchTerm = getString(search.search)
  const sort = getString(search.sort)
  const view = getString(search.view)
  const page = Number(search.page)

  return {
    search: searchTerm?.slice(0, 120),
    categories: normalizeSelection(search.categories, categoryValues),
    networks: normalizeSelection(search.networks, networkValues),
    minPriceEth: getDecimal(search.minPriceEth),
    maxPriceEth: getDecimal(search.maxPriceEth),
    sort: sort && sortValues.has(sort as NftSort) ? (sort as NftSort) : undefined,
    view: view && viewValues.has(view as CatalogView) ? (view as CatalogView) : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}

export function decodeCategories(value?: string): NftCategory[] {
  if (!value) return []
  const selected = new Set(value.split(','))
  return categoryValues.filter((category) => selected.has(category))
}

export function decodeNetworks(value?: string): BlockchainNetwork[] {
  if (!value) return []
  const selected = new Set(value.split(','))
  return networkValues.filter((network) => selected.has(network))
}

export function encodeSelection(values: readonly string[]): string | undefined {
  return values.length ? values.join(',') : undefined
}
