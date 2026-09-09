import { useDeferredValue, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { sortOptions } from '@/features/catalog/catalog-config'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogSkeleton } from '@/features/catalog/components/catalog-skeleton'
import { NftCard } from '@/features/catalog/components/nft-card'
import { useCatalogQuery } from '@/features/catalog/catalog-query'
import type {
  BlockchainNetwork,
  DecimalString,
  NftCategory,
  NftListRequest,
  NftSort,
} from '@/lib/api/contracts'
import { cn } from '@/lib/utils'

type CatalogView = 'all' | 'new' | 'popular'

const catalogViews = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lan\u00e7amentos' },
  { value: 'popular', label: 'Em alta' },
] as const satisfies ReadonlyArray<{ value: CatalogView; label: string }>

function toggleSelection<TValue>(selection: TValue[], value: TValue): TValue[] {
  return selection.includes(value)
    ? selection.filter((selectedValue) => selectedValue !== value)
    : [...selection, value]
}

export function CatalogPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [categories, setCategories] = useState<NftCategory[]>([])
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([])
  const [draftMinPrice, setDraftMinPrice] = useState('')
  const [draftMaxPrice, setDraftMaxPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<NftSort>('recent')
  const [view, setView] = useState<CatalogView>('all')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const request = useMemo<NftListRequest>(
    () => ({
      search: deferredSearch || undefined,
      categories: categories.length ? categories : undefined,
      networks: networks.length ? networks : undefined,
      minPriceEth: minPrice ? (minPrice as DecimalString) : undefined,
      maxPriceEth: maxPrice ? (maxPrice as DecimalString) : undefined,
      sort: view === 'popular' ? 'popular' : view === 'new' ? 'recent' : sort,
      page: 1,
      pageSize: 50,
    }),
    [categories, deferredSearch, maxPrice, minPrice, networks, sort, view],
  )
  const catalogQuery = useCatalogQuery(request)
  const activeFilterCount =
    categories.length + networks.length + Number(Boolean(minPrice)) + Number(Boolean(maxPrice))

  function resetFilters(includeSearch = false) {
    setCategories([])
    setNetworks([])
    setDraftMinPrice('')
    setDraftMaxPrice('')
    setMinPrice('')
    setMaxPrice('')
    setView('all')
    setSort('recent')
    if (includeSearch) setSearch('')
  }

  const sharedFilterProps = {
    categories,
    networks,
    draftMinPrice,
    draftMaxPrice,
    facets: catalogQuery.data?.facets,
    onCategoryChange: (category: NftCategory) =>
      setCategories((current) => toggleSelection(current, category)),
    onNetworkChange: (network: BlockchainNetwork) =>
      setNetworks((current) => toggleSelection(current, network)),
    onDraftMinPriceChange: setDraftMinPrice,
    onDraftMaxPriceChange: setDraftMaxPrice,
    onApplyPrice: () => {
      setMinPrice(draftMinPrice)
      setMaxPrice(draftMaxPrice)
    },
    onReset: () => resetFilters(),
  }

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

        <div className="relative mt-6 max-w-2xl">
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
            value={search}
            placeholder={'Explorar cole\u00e7\u00f5es'}
            className="h-14 bg-card pl-12"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
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
          value={sort}
          className="h-11 min-w-0 rounded-control border border-input bg-background px-3 text-xs text-foreground"
          onChange={(event) => {
            setView('all')
            setSort(event.target.value as NftSort)
          }}
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
          <CatalogFilters idPrefix="mobile" {...sharedFilterProps} />
        </section>
      )}

      <div className="grid gap-7 md:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        <aside aria-label={'Filtros do cat\u00e1logo'} className="hidden md:block">
          <CatalogFilters idPrefix="desktop" {...sharedFilterProps} />
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
                  onClick={() => setView(option.value)}
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
                value={sort}
                className="rounded-control border-0 bg-transparent text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  setView('all')
                  setSort(event.target.value as NftSort)
                }}
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
          )}
        </section>
      </div>
    </main>
  )
}
