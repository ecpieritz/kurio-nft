import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { NftCard } from '@/features/catalog/components/nft-card'
import {
  useCatalogQuery,
  useNftDetailsQuery,
} from '@/features/catalog/catalog-query'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import type {
  NftDetails,
  NftEdition,
  NftImage,
  NftSummary,
} from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'
import { cn } from '@/lib/utils'

function DetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando detalhes do NFT"
      className="grid gap-8 lg:grid-cols-2"
    >
      <div className="skeleton-shimmer aspect-square rounded-panel bg-card" />

      <div className="space-y-5 py-4">
        <div className="skeleton-shimmer h-9 w-3/4 rounded bg-card" />
        <div className="skeleton-shimmer h-6 w-1/3 rounded bg-card" />
        <div className="skeleton-shimmer h-24 rounded bg-card" />
        <div className="skeleton-shimmer h-12 rounded bg-card" />
      </div>
    </div>
  )
}

export function NftDetailsPage() {
  const { nftId } = useParams({
    from: '/_public/nfts/$nftId',
  })

  const nftQuery = useNftDetailsQuery(nftId)

  const relatedQuery = useCatalogQuery({
    sort: 'popular',
    page: 1,
    pageSize: 6,
  })

  const [galleryIndex, setGalleryIndex] = useState(0)
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (nftQuery.isPending) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
      >
        <DetailsSkeleton />
      </main>
    )
  }

  if (
    nftQuery.error instanceof ApiClientError &&
    nftQuery.error.status === 404
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[65svh] place-items-center px-(--page-gutter)"
      >
        <section className="max-w-xl rounded-panel border bg-card p-8 text-center">
          <Typography
            as="h1"
            variant="title"
          >
            NFT não encontrado
          </Typography>

          <Typography
            tone="muted"
            className="mt-3"
          >
            A obra pode ter sido removida ou o endereço informado está
            incorreto.
          </Typography>

          <Button
            asChild
            className="mt-6"
          >
            <Link to="/marketplace">
              Voltar ao mercado
            </Link>
          </Button>
        </section>
      </main>
    )
  }

  if (
    nftQuery.isError ||
    !nftQuery.data
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[65svh] place-items-center px-(--page-gutter)"
      >
        <section
          role="alert"
          className="max-w-xl rounded-panel border border-destructive/60 bg-card p-8 text-center"
        >
          <Typography
            as="h1"
            variant="heading"
          >
            Não foi possível carregar este NFT
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void nftQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  const nft: NftDetails = nftQuery.data

  const selectedEdition: NftEdition | undefined =
    nft.editions.find((edition) => edition.id === selectedEditionId) ??
    nft.editions.find(
      (edition) =>
        edition.label === '1/50' &&
        edition.purchasable,
    ) ??
    nft.editions.find((edition) => edition.purchasable) ??
    nft.editions[0]

  const selectedImage: NftImage =
    nft.gallery[galleryIndex] ??
    nft.image

  const maxQuantity =
    selectedEdition?.availableQuantity ?? 0

  const relatedNfts: NftSummary[] =
    relatedQuery.data?.items
      .filter((item) => item.id !== nft.id)
      .slice(0, 5) ?? []

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-(--content-max) px-(--page-gutter) py-6 md:py-10"
    >
      <nav
        aria-label="Breadcrumb"
        className="mb-5 hidden text-sm md:block"
      >
        <Link
          to="/"
          className="hover:text-primary"
        >
          Início
        </Link>

        <span aria-hidden="true">
          {' / '}
        </span>

        <Link
          to="/marketplace"
          className="hover:text-primary"
        >
          Mercado
        </Link>
      </nav>

      <div className="mb-5 flex items-center justify-between md:hidden">
        <Button
          asChild
          variant="outline"
          size="icon-sm"
        >
          <Link
            to="/marketplace"
            aria-label="Voltar ao mercado"
          >
            &lsaquo;
          </Link>
        </Button>

        <FavoriteButton nftId={nft.id} />
      </div>

      <section className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-10">
        <div className="grid gap-4 md:grid-cols-[4.5rem_minmax(0,1fr)]">
          <div
            className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col"
            aria-label="Galeria do NFT"
          >
            {nft.gallery.map((image: NftImage, index: number) => (
              <button
                key={`${image.url}:${index}`}
                type="button"
                aria-label={`Exibir imagem ${index + 1}`}
                aria-pressed={galleryIndex === index}
                className={cn(
                  'size-16 shrink-0 overflow-hidden rounded-control border-2 border-transparent md:size-[4.5rem]',
                  galleryIndex === index &&
                    'border-primary',
                )}
                onClick={() => {
                  setGalleryIndex(index)
                }}
              >
                <img
                  src={image.url}
                  alt=""
                  width={image.width}
                  height={image.height}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="order-1 overflow-hidden rounded-panel bg-card p-2 md:order-2">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              width={selectedImage.width}
              height={selectedImage.height}
              fetchPriority="high"
              className="aspect-square w-full rounded-[calc(var(--kurio-radius-panel)-0.35rem)] object-cover"
            />
          </div>
        </div>

        <div className="rounded-panel bg-card p-6 lg:bg-transparent lg:p-0">
          <div>
            <Typography
              as="h1"
              variant="title"
            >
              {nft.name}
            </Typography>

            <p className="mt-2 text-xl font-bold text-primary">
              {nft.priceEth} ETH
            </p>
          </div>

          <p
            className="mt-3 text-sm text-foreground"
            aria-label={`${nft.rating} de 5 estrelas, ${nft.reviewCount} avaliações`}
          >
            <span className="text-primary">
              ★★★★★
            </span>{' '}
            {nft.rating} ({nft.reviewCount})
          </p>

          <div className="mt-6 border-t border-border/70 pt-5">
            <Typography
              as="h2"
              variant="subheading"
            >
              Sobre este NFT:
            </Typography>

            <Typography
              tone="muted"
              className="mt-2"
            >
              {nft.description}
            </Typography>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">
              Edição:
            </legend>

            <div className="flex flex-wrap gap-2">
              {nft.editions.map((edition: NftEdition) => (
                <button
                  key={edition.id}
                  type="button"
                  disabled={!edition.purchasable}
                  aria-pressed={
                    selectedEdition?.id === edition.id
                  }
                  className={cn(
                    'rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40',
                    selectedEdition?.id === edition.id &&
                      'border-primary text-primary',
                  )}
                  onClick={() => {
                    setSelectedEditionId(edition.id)
                    setQuantity(1)
                  }}
                >
                  {edition.label}
                </button>
              ))}
            </div>
          </fieldset>

          <dl className="mt-5 space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <dt>ID do token:</dt>

              <dd>{nft.tokenId}</dd>
            </div>

            <div className="flex gap-2">
              <dt>Coleção:</dt>

              <dd>{nft.collectionName}</dd>
            </div>

            <div className="flex gap-2">
              <dt>Atributos:</dt>

              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border/70 pt-5">
            <span className="text-sm text-muted-foreground">
              Qtd.
            </span>

            <Button
              type="button"
              size="icon-sm"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => {
                setQuantity((current) =>
                  Math.max(
                    1,
                    current - 1,
                  ),
                )
              }}
            >
              −
            </Button>

            <output
              aria-live="polite"
              className="min-w-5 text-center"
            >
              {quantity}
            </output>

            <Button
              type="button"
              size="icon-sm"
              aria-label="Aumentar quantidade"
              disabled={quantity >= maxQuantity}
              onClick={() => {
                setQuantity((current) =>
                  Math.min(
                    maxQuantity,
                    current + 1,
                  ),
                )
              }}
            >
              +
            </Button>

            <span className="ml-auto text-xs text-muted-foreground">
              {maxQuantity} disponíveis
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled
              title="A compra será habilitada com a integração do carrinho"
            >
              Comprar NFT
            </Button>

            <FavoriteButton
              nftId={nft.id}
              showLabel
              className="hidden md:inline-flex"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 border-t border-border/70 pt-8 md:mt-16">
        <Typography
          as="h2"
          variant="heading"
          tone="accent"
        >
          Detalhes do NFT
        </Typography>

        <Typography
          tone="muted"
          className="mt-4 max-w-5xl whitespace-pre-line"
        >
          {nft.longDescription}
        </Typography>

        <dl className="mt-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <dt className="font-semibold text-foreground">
              Rede
            </dt>

            <dd className="mt-1 capitalize">
              {nft.network}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-foreground">
              Contrato
            </dt>

            <dd className="mt-1 break-all">
              {nft.contractAddress}
            </dd>
          </div>
        </dl>
      </section>

      {relatedNfts.length > 0 && (
        <section className="mt-12 border-t border-border/70 pt-8 md:mt-16">
          <Typography
            as="h2"
            variant="heading"
            tone="accent"
          >
            Mais desta coleção
          </Typography>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {relatedNfts.map((item: NftSummary) => (
              <NftCard
                key={item.id}
                nft={item}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}