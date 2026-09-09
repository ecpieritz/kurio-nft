import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useAuth } from '@/features/auth/session/use-auth'
import { CatalogSkeleton } from '@/features/catalog/components/catalog-skeleton'
import { NftCard } from '@/features/catalog/components/nft-card'
import { useCatalogQuery } from '@/features/catalog/catalog-query'
import { useFavoritesQuery } from '@/features/favorites/favorites-query'

export function FavoritesPage() {
  const auth = useAuth()
  const favoritesQuery = useFavoritesQuery(auth.user?.id ?? null)
  const catalogQuery = useCatalogQuery({ sort: 'recent', page: 1, pageSize: 100 })
  const isPending = favoritesQuery.isPending || catalogQuery.isPending
  const isError = favoritesQuery.isError || catalogQuery.isError
  const nftById = new Map(catalogQuery.data?.items.map((nft) => [nft.id, nft]))
  const favoriteNfts =
    favoritesQuery.data?.nftIds.flatMap((nftId) => {
      const nft = nftById.get(nftId)
      return nft ? [nft] : []
    }) ?? []

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
    >
      <Typography as="p" variant="eyebrow" tone="accent">
        Meu perfil
      </Typography>
      <Typography as="h1" variant="title" className="mt-2">
        Lista de interesse
      </Typography>
      <Typography tone="muted" className="mb-8 mt-3 max-w-2xl">
        Seus NFTs favoritos ficam sincronizados com a conta ativa e permanecem ap\u00f3s o refresh.
      </Typography>

      {isPending ? (
        <CatalogSkeleton />
      ) : isError ? (
        <section
          role="alert"
          className="rounded-card border border-destructive/60 bg-card p-8 text-center"
        >
          <Typography as="h2" variant="heading">
            {'N\u00e3o foi poss\u00edvel carregar seus favoritos'}
          </Typography>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => {
              void favoritesQuery.refetch()
              void catalogQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      ) : favoriteNfts.length === 0 ? (
        <section className="rounded-card border bg-card p-8 text-center">
          <Typography as="h2" variant="heading">
            Sua lista est\u00e1 vazia
          </Typography>
          <Typography tone="muted" className="mt-3">
            Favorite uma obra no cat\u00e1logo ou nos detalhes do NFT para encontr\u00e1-la aqui.
          </Typography>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {favoriteNfts.map((nft, index) => (
            <NftCard key={nft.id} nft={nft} priority={index < 2} />
          ))}
        </div>
      )}
    </main>
  )
}
