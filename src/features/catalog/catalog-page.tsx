import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { sortOptions } from '@/features/catalog/catalog-config'
import type { CatalogSearch, CatalogView } from '@/features/catalog/catalog-search'
import {
  decodeCategories,
  decodeNetworks,
  encodeSelection,
} from '@/features/catalog/catalog-search'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogSkeleton } from '@/features/catalog/components/catalog-skeleton'
import { NftCard } from '@/features/catalog/components/nft-card'
import { useCatalogQuery } from '@/features/catalog/catalog-query'
import type { DecimalString, NftListRequest, NftSort } from '@/lib/api/contracts'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 350

const catalogViews = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lan\u00e7amentos' },
  { value: 'popular', label: 'Em alta' },
] as const satisfies ReadonlyArray<{ value: CatalogView; label: string }>

interface CatalogSearchInputProps {
  initialValue: string
  onCommit: (value: string) => void
}

function CatalogSearchInput({ initialValue, onCommit }: CatalogSearchInputProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    const normalizedValue = value.trim()
    if (normalizedValue === initialValue) return

    const timeoutId = window.setTimeout(() => onCommit(normalizedValue), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [initialValue, onCommit, value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCommit(value.trim())
  }

  return (
    <form className="relative mt-6 max-w-2xl" role="search" onSubmit={handleSubmit}>
      <label htmlFor="catalog-search" className="sr-only">
        Buscar NFTs
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2"
      />
      <Input
        id="catalog-search"
        type="search"
        value={value}
        placeholder={'Explorar cole\u00e7\u00f5es'}
        className="h-14 bg-card pl-12"
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  )
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const visibleCount = Math.min(5, totalPages)
  const firstPage = Math.min(
    Math.max(1, currentPage - Math.floor(visibleCount / 2)),
    Math.max(1, totalPages - visibleCount + 1),
  )

  return Array.from({ length: visibleCount }, (_, index) => firstPage + index)
}

export function CatalogPage() {
  const searchState = useSearch({ from: '/_public/marketplace' })
  const navigate = useNavigate()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const searchTerm = searchState.search ?? ''
  const deferredSearch = useDeferredValue(searchTerm)
  const categories = useMemo(
    () => decodeCategories(searchState.categories),
    [searchState.categories],
  )
  const networks = useMemo(() => decodeNetworks(searchState.networks), [searchState.networks])
  const sort = searchState.sort ?? 'recent'
  const view = searchState.view ?? 'all'
  const page = searchState.page ?? 1
  const effectiveSort = view === 'popular' ? 'popular' : view === 'new' ? 'recent' : sort

  const updateSearch = useCallback(
    (changes: Partial<CatalogSearch>, replace = false) => {
      void navigate({
        to: '/marketplace',
        search: (previous) => ({ ...previous, ...changes }),
        replace,
        resetScroll: false,
      })
    },
    [navigate],
  )

  const request = useMemo<NftListRequest>(
    () => ({
      search: deferredSearch || undefined,
      categories: categories.length ? categories : undefined,
      networks: networks.length ? networks : undefined,
      minPriceEth: searchState.minPriceEth,
      maxPriceEth: searchState.maxPriceEth,
      sort: effectiveSort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [categories, deferredSearch, effectiveSort, networks, page, searchState],
  )
  const catalogQuery = useCatalogQuery(request)
  const totalPages = catalogQuery.data?.page.totalPages ?? 0
  const activeFilterCount =
    categories.length +
    networks.length +
    Number(Boolean(searchState.minPriceEth)) +
    Number(Boolean(searchState.maxPriceEth))

  useEffect(() => {
    if (catalogQuery.isPlaceholderData || !catalogQuery.data) return

    const lastAvailablePage = Math.max(1, catalogQuery.data.page.totalPages)
    if (page > lastAvailablePage) {
      updateSearch({ page: lastAvailablePage > 1 ? lastAvailablePage : undefined }, true)
    }
  }, [catalogQuery.data, catalogQuery.isPlaceholderData, page, updateSearch])

  const commitSearch = useCallback(
    (value: string) => {
      if (value === searchTerm) return
      updateSearch({ search: value || undefined, page: undefined })
    },
    [searchTerm, updateSearch],
  )

  function toggleCategory(category: (typeof categories)[number]) {
    const selection = categories.includes(category)
      ? categories.filter((selectedCategory) => selectedCategory !== category)
      : [...categories, category]
    updateSearch({ categories: encodeSelection(selection), page: undefined })
  }

  function toggleNetwork(network: (typeof networks)[number]) {
    const selection = networks.includes(network)
      ? networks.filter((selectedNetwork) => selectedNetwork !== network)
      : [...networks, network]
    updateSearch({ networks: encodeSelection(selection), page: undefined })
  }

  function resetFilters(includeSearch = false) {
    updateSearch({
      search: includeSearch ? undefined : searchState.search,
      categories: undefined,
      networks: undefined,
      minPriceEth: undefined,
      maxPriceEth: undefined,
      sort: undefined,
      view: undefined,
      page: undefined,
    })
  }

  function selectSort(nextSort: NftSort) {
    updateSearch({
      sort: nextSort === 'recent' ? undefined : nextSort,
      view: undefined,
      page: undefined,
    })
  }

  function selectView(nextView: CatalogView) {
    if (nextView === view) return
    updateSearch({ view: nextView === 'all' ? undefined : nextView, page: undefined })
  }

  function selectPage(nextPage: number) {
    if (nextPage === page) return
    updateSearch({ page: nextPage > 1 ? nextPage : undefined })
  }

  const sharedFilterProps = {
    categories,
    networks,
    minPrice: searchState.minPriceEth ?? '',
    maxPrice: searchState.maxPriceEth ?? '',
    facets: catalogQuery.data?.facets,
    onCategoryChange: toggleCategory,
    onNetworkChange: toggleNetwork,
    onApplyPrice: (minPrice: string, maxPrice: string) =>
      updateSearch({
        minPriceEth: minPrice ? (minPrice as DecimalString) : undefined,
        maxPriceEth: maxPrice ? (maxPrice as DecimalString) : undefined,
        page: undefined,
      }),
    onReset: () => resetFilters(),
  }
  const priceFilterKey = `${searchState.minPriceEth ?? ''}:${searchState.maxPriceEth ?? ''}`

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
    >
      <header className="mb-8 md:mb-10">
        <Typography as="p" variant="eyebrow" tone="accent">
          Kurio Marketplace
        </Typography>
        <Typography as="h1" variant="title" className="mt-2">
          Explore NFTs selecionados
        </Typography>
        <Typography tone="muted" className="mt-3 max-w-2xl">
          {
            'Encontre arte digital verificada por nome, cole\u00e7\u00e3o, faixa de pre\u00e7o e rede.'
          }
        </Typography>
        <CatalogSearchInput key={searchTerm} initialValue={searchTerm} onCommit={commitSearch} />
      </header>

      <div className="mb-6 flex items-center justify-between gap-4 md:hidden">
        <Button
          type="button"
          variant="outline"
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-catalog-filters"
          onClick={() => setMobileFiltersOpen((open) => !open)}
        >
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
        <label className="sr-only" htmlFor="mobile-catalog-sort">
          Ordenar NFTs
        </label>
        <select
          id="mobile-catalog-sort"
          value={effectiveSort}
          className="h-11 min-w-0 rounded-control border border-input bg-background px-3 text-xs text-foreground"
          onChange={(event) => selectSort(event.target.value as NftSort)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {mobileFiltersOpen && (
        <section id="mobile-catalog-filters" className="mb-7 md:hidden">
          <CatalogFilters
            key={`mobile:${priceFilterKey}`}
            idPrefix="mobile"
            {...sharedFilterProps}
          />
        </section>
      )}

      <div className="grid gap-7 md:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        <aside aria-label={'Filtros do cat\u00e1logo'} className="hidden md:block">
          <CatalogFilters
            key={`desktop:${priceFilterKey}`}
            idPrefix="desktop"
            {...sharedFilterProps}
          />
        </aside>

        <section aria-labelledby="catalog-results-title" className="min-w-0">
          <div className="mb-6 border-b border-border/70 md:flex md:items-end md:justify-between md:gap-6">
            <div
              className="flex gap-5 overflow-x-auto"
              role="group"
              aria-label={'Vis\u00f5es do cat\u00e1logo'}
            >
              {catalogViews.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={view === option.value}
                  className={cn(
                    'shrink-0 border-b-2 border-transparent pb-3 text-sm text-foreground transition-colors hover:text-primary',
                    view === option.value && 'border-primary font-semibold text-primary',
                  )}
                  onClick={() => selectView(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-2 pb-3 md:flex">
              <label htmlFor="desktop-catalog-sort" className="text-xs text-muted-foreground">
                Ordenar por:
              </label>
              <select
                id="desktop-catalog-sort"
                value={effectiveSort}
                className="rounded-control border-0 bg-transparent text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => selectSort(event.target.value as NftSort)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-background">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5 flex min-h-5 items-center justify-between gap-3" aria-live="polite">
            <p id="catalog-results-title" className="text-xs text-muted-foreground">
              {catalogQuery.data
                ? `${catalogQuery.data.page.totalItems} NFT${catalogQuery.data.page.totalItems === 1 ? '' : 's'} encontrado${catalogQuery.data.page.totalItems === 1 ? '' : 's'}`
                : 'Consultando cat\u00e1logo'}
            </p>
            {catalogQuery.isFetching && !catalogQuery.isPending && (
              <span className="text-xs text-primary">{'Atualizando\u2026'}</span>
            )}
          </div>

          {catalogQuery.isError && catalogQuery.data && (
            <p
              role="alert"
              className="mb-5 rounded-control border border-destructive/60 p-3 text-xs text-destructive"
            >
              {
                'N\u00e3o foi poss\u00edvel atualizar os resultados. Os dados anteriores foram mantidos.'
              }
            </p>
          )}

          {catalogQuery.isPending ? (
            <CatalogSkeleton />
          ) : catalogQuery.isError && !catalogQuery.data ? (
            <div
              role="alert"
              className="rounded-card border border-destructive/60 bg-card p-8 text-center"
            >
              <Typography as="h2" variant="heading">
                {'N\u00e3o foi poss\u00edvel carregar os NFTs'}
              </Typography>
              <Typography tone="muted" className="mt-3">
                {'Verifique sua conex\u00e3o e tente novamente.'}
              </Typography>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => void catalogQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : catalogQuery.data?.items.length === 0 ? (
            <div className="rounded-card border bg-card p-8 text-center">
              <Typography as="h2" variant="heading">
                Nenhum NFT encontrado
              </Typography>
              <Typography tone="muted" className="mt-3">
                Ajuste sua busca ou remova alguns filtros para ampliar os resultados.
              </Typography>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => resetFilters(true)}
              >
                Limpar busca e filtros
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'grid grid-cols-2 gap-x-4 gap-y-7 transition-opacity lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10',
                  catalogQuery.isPlaceholderData && 'opacity-60',
                )}
              >
                {catalogQuery.data?.items.map((nft, index) => (
                  <NftCard key={nft.id} nft={nft} priority={index < 2} />
                ))}
              </div>

              {totalPages > 1 && !catalogQuery.isPlaceholderData && (
                <nav
                  aria-label={'P\u00e1ginas do cat\u00e1logo'}
                  className="mt-10 flex justify-center gap-2 md:justify-end"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={'P\u00e1gina anterior'}
                    disabled={page <= 1}
                    onClick={() => selectPage(page - 1)}
                  >
                    <span aria-hidden="true">&lsaquo;</span>
                  </Button>
                  {getVisiblePages(page, totalPages).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === page ? 'default' : 'outline'}
                      size="icon-sm"
                      aria-label={`P\u00e1gina ${pageNumber}`}
                      aria-current={pageNumber === page ? 'page' : undefined}
                      onClick={() => selectPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={'Pr\u00f3xima p\u00e1gina'}
                    disabled={page >= totalPages}
                    onClick={() => selectPage(page + 1)}
                  >
                    <span aria-hidden="true">&rsaquo;</span>
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
