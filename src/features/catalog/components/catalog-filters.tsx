import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { categoryOptions, networkOptions } from '@/features/catalog/catalog-config'
import type { BlockchainNetwork, NftCategory, NftListFacets } from '@/lib/api/contracts'

interface CatalogFiltersProps {
  idPrefix: string
  categories: NftCategory[]
  networks: BlockchainNetwork[]
  draftMinPrice: string
  draftMaxPrice: string
  facets?: NftListFacets
  onCategoryChange: (category: NftCategory) => void
  onNetworkChange: (network: BlockchainNetwork) => void
  onDraftMinPriceChange: (value: string) => void
  onDraftMaxPriceChange: (value: string) => void
  onApplyPrice: () => void
  onReset: () => void
}

const pricePattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/

export function CatalogFilters({
  idPrefix,
  categories,
  networks,
  draftMinPrice,
  draftMaxPrice,
  facets,
  onCategoryChange,
  onNetworkChange,
  onDraftMinPriceChange,
  onDraftMaxPriceChange,
  onApplyPrice,
  onReset,
}: CatalogFiltersProps) {
  const [priceError, setPriceError] = useState<string | null>(null)

  function handlePriceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hasInvalidValue = [draftMinPrice, draftMaxPrice].some(
      (value) => value && !pricePattern.test(value),
    )

    if (hasInvalidValue || (draftMinPrice && draftMaxPrice && +draftMinPrice > +draftMaxPrice)) {
      setPriceError('Informe uma faixa de pre\u00e7o v\u00e1lida.')
      return
    }

    setPriceError(null)
    onApplyPrice()
  }

  return (
    <div className="space-y-7 rounded-card bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <Typography as="h2" variant="subheading">
          Filtros
        </Typography>
        <button type="button" className="text-xs text-primary hover:underline" onClick={onReset}>
          Limpar
        </button>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          {'Cole\u00e7\u00f5es'}
        </legend>
        <div className="space-y-2.5">
          {categoryOptions.map((option) => {
            const inputId = `${idPrefix}-category-${option.value}`

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={categories.includes(option.value)}
                  onChange={() => onCategoryChange(option.value)}
                  className="size-4 accent-primary"
                />
                <span>{option.label}</span>
                <span className="ml-auto text-xs text-primary">
                  ({facets?.categories[option.value] ?? '\u2014'})
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <form onSubmit={handlePriceSubmit} noValidate>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-foreground">
            {'Faixa de pre\u00e7o'}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${idPrefix}-min-price`} className="sr-only">
                {'Pre\u00e7o m\u00ednimo em ETH'}
              </label>
              <Input
                id={`${idPrefix}-min-price`}
                inputMode="decimal"
                value={draftMinPrice}
                placeholder={facets?.minPriceEth ?? 'M\u00edn.'}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `${idPrefix}-price-error` : undefined}
                onChange={(event) => onDraftMinPriceChange(event.target.value.trim())}
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-max-price`} className="sr-only">
                {'Pre\u00e7o m\u00e1ximo em ETH'}
              </label>
              <Input
                id={`${idPrefix}-max-price`}
                inputMode="decimal"
                value={draftMaxPrice}
                placeholder={facets?.maxPriceEth ?? 'M\u00e1x.'}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `${idPrefix}-price-error` : undefined}
                onChange={(event) => onDraftMaxPriceChange(event.target.value.trim())}
              />
            </div>
          </div>
          {priceError && (
            <p
              id={`${idPrefix}-price-error`}
              role="alert"
              className="mt-2 text-xs text-destructive"
            >
              {priceError}
            </p>
          )}
          <Button type="submit" size="sm" className="mt-3">
            Aplicar
          </Button>
        </fieldset>
      </form>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">Rede</legend>
        <div className="space-y-2.5">
          {networkOptions.map((option) => {
            const inputId = `${idPrefix}-network-${option.value}`

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={networks.includes(option.value)}
                  onChange={() => onNetworkChange(option.value)}
                  className="size-4 accent-primary"
                />
                <span>{option.label}</span>
                <span className="ml-auto text-xs text-primary">
                  ({facets?.networks[option.value] ?? '\u2014'})
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
