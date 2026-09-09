import { Link } from '@tanstack/react-router'

import { NftArtwork } from '@/components/media/nft-artwork'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useCatalogQuery } from '@/features/catalog/catalog-query'
import { MobileHomeHero } from '@/features/home/components/mobile-home-hero'
import type { NftSummary } from '@/lib/api/contracts'

const categories = [
  ['Arte digital', 33],
  ['Fotografia', 12],
  ['Música', 65],
  ['Arte 3D', 39],
  ['Colecionáveis', 23],
  ['Generativa', 17],
  ['Jogos', 19],
  ['Assinaturas', 13],
  ['Utilidade', 18],
] as const

const networks = [
  ['Ethereum', 119],
  ['Polygon', 78],
  ['Solana', 86],
] as const

const diaryEntries = [
  {
    artwork: 'ivoryBaron',
    date: '12 de setembro',
    readTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    artwork: 'emeraldApe',
    date: '13 de setembro',
    readTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    artwork: 'violetNomad',
    date: '15 de setembro',
    readTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    artwork: 'goldenBeat',
    date: '15 de setembro',
    readTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
] as const

interface HomeNftCardProps {
  nft: NftSummary
  priority?: boolean
}

function HomeNftCard({ nft, priority = false }: HomeNftCardProps) {
  return (
    <article className="min-w-0">
      <Link
        to="/nfts/$nftId"
        params={{
          nftId: nft.id,
        }}
        className="block overflow-hidden bg-card p-1.5 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 motion-reduce:transform-none"
      >
        <div className="relative">
          {nft.rare && (
            <span className="absolute left-0 top-3 z-10 bg-primary px-3 py-1.5 text-[0.65rem] font-bold text-primary-foreground">
              RARO
            </span>
          )}

          <img
            src={nft.image.url}
            alt={nft.image.alt}
            width={nft.image.width}
            height={nft.image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="aspect-square w-full object-cover"
          />
        </div>
      </Link>

      <div className="px-1 pt-3">
        <Link
          to="/nfts/$nftId"
          params={{
            nftId: nft.id,
          }}
          className="block truncate text-sm text-foreground hover:text-primary"
        >
          {nft.name}
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-primary">{nft.priceEth} ETH</span>

          {nft.previousPriceEth && (
            <span className="text-muted-foreground line-through">{nft.previousPriceEth} ETH</span>
          )}
        </div>
      </div>
    </article>
  )
}

function HomeCatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3">
      {Array.from(
        {
          length: 9,
        },
        (_, index) => (
          <div key={index} className="space-y-3">
            <div className="skeleton-shimmer aspect-square bg-card" />

            <div className="skeleton-shimmer h-4 w-3/4 rounded bg-card" />

            <div className="skeleton-shimmer h-4 w-24 rounded bg-card" />
          </div>
        ),
      )}
    </div>
  )
}

export function HomeContent() {
  const catalogQuery = useCatalogQuery({
    sort: 'recent',
    page: 1,
    pageSize: 9,
  })

  const items = catalogQuery.data?.items ?? []

  const featuredNft = items[1] ?? items[0]

  return (
    <>
      <MobileHomeHero />

      <section className="mx-auto hidden w-full max-w-(--content-max) items-center gap-8 px-(--page-gutter) pb-14 pt-9 md:grid md:grid-cols-[minmax(0,1fr)_24rem] md:px-0 md:pb-16 md:pt-8 lg:grid-cols-[minmax(0,1fr)_27rem]">
        <div className="max-w-2xl">
          <p className="text-xs tracking-wide text-foreground">Bem-vindo à Kurio</p>

          <h1 className="mt-5 text-[clamp(2rem,4vw,3.6rem)] font-bold uppercase leading-[1.18] tracking-heading text-foreground">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>

          <Button asChild className="mt-7">
            <Link to="/marketplace">EXPLORAR</Link>
          </Button>
        </div>

        <div className="relative hidden md:block">
          <NftArtwork
            artwork="emeraldApe"
            fetchPriority="high"
            className="aspect-square w-full rounded-panel object-cover"
          />

          <div className="absolute bottom-6 left-6 w-24 overflow-hidden rounded-control border-4 border-background shadow-card">
            <NftArtwork artwork="violetNomad" className="aspect-square w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-(--content-max) gap-7 px-(--page-gutter) pb-16 md:grid-cols-[13.5rem_minmax(0,1fr)] md:px-0 lg:gap-10">
        <aside className="hidden space-y-5 md:block">
          <section className="bg-card px-5 py-6">
            <Typography as="h2" variant="subheading">
              Coleções
            </Typography>

            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {categories.map(([label, count], index) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className={index === 0 ? 'text-primary' : undefined}>{label}</span>

                  <span className={index === 0 ? 'font-bold text-primary' : undefined}>
                    ({count})
                  </span>
                </li>
              ))}
            </ul>

            <Typography as="h3" variant="subheading" className="mt-8">
              Faixa de preço
            </Typography>

            <div className="mt-4">
              <div className="relative h-1 rounded-full bg-primary/70">
                <span className="absolute -top-1.5 left-0 size-4 rounded-full border-2 border-background bg-primary" />

                <span className="absolute -top-1.5 left-[58%] size-4 rounded-full border-2 border-background bg-primary" />
              </div>

              <p className="mt-4 text-xs text-muted-foreground">Preço: 0.02 - 12.30 ETH</p>

              <Button asChild size="sm" className="mt-3">
                <Link to="/marketplace">Aplicar</Link>
              </Button>
            </div>

            <Typography as="h3" variant="subheading" className="mt-8">
              Rede
            </Typography>

            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {networks.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span>{label}</span>

                  <span>({count})</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-card p-4 text-center">
            <p className="font-bold uppercase text-primary">NFT em destaque</p>

            <p className="mt-3 font-semibold">Oferta limitada</p>

            {featuredNft ? (
              <Link
                to="/nfts/$nftId"
                params={{
                  nftId: featuredNft.id,
                }}
                className="mt-4 block"
              >
                <img
                  src={featuredNft.image.url}
                  alt={featuredNft.image.alt}
                  width={featuredNft.image.width}
                  height={featuredNft.image.height}
                  className="aspect-square w-full object-cover"
                />
              </Link>
            ) : (
              <div className="skeleton-shimmer mt-4 aspect-square bg-background" />
            )}
          </section>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/70">
            <div className="flex max-w-full gap-5 overflow-x-auto whitespace-nowrap text-sm">
              <Link
                to="/marketplace"
                className="border-b-2 border-primary pb-3 font-semibold text-primary"
              >
                Todos os NFTs
              </Link>

              <Link to="/marketplace" className="pb-3 text-foreground hover:text-primary">
                Novos lançamentos
              </Link>

              <Link to="/marketplace" className="pb-3 text-foreground hover:text-primary">
                Em alta
              </Link>
            </div>

            <span className="hidden pb-3 text-xs text-muted-foreground md:inline">
              Ordenar por: Listados recentemente
            </span>
          </div>

          {catalogQuery.isPending ? (
            <HomeCatalogSkeleton />
          ) : catalogQuery.isError ? (
            <div className="rounded-card border border-destructive/60 bg-card p-8 text-center">
              <Typography as="h2" variant="heading">
                Não foi possível carregar os NFTs
              </Typography>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => {
                  void catalogQuery.refetch()
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
              {items.map((nft, index) => (
                <HomeNftCard key={nft.id} nft={nft} priority={index < 3} />
              ))}
            </div>
          )}

          <nav aria-label="Prévia da paginação" className="mt-10 flex justify-end gap-2">
            {[1, 2, 3, 4].map((page) => (
              <Button
                key={page}
                asChild
                variant={page === 1 ? 'default' : 'outline'}
                size="icon-sm"
              >
                <Link to="/marketplace">{page}</Link>
              </Button>
            ))}

            <Button asChild variant="outline" size="icon-sm">
              <Link to="/marketplace" aria-label="Próxima página">
                &gt;
              </Link>
            </Button>
          </nav>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-(--content-max) gap-5 px-(--page-gutter) pb-14 md:grid-cols-2 md:px-0">
        <article className="grid overflow-hidden bg-card md:grid-cols-[10rem_minmax(0,1fr)]">
          <NftArtwork artwork="emeraldApe" className="h-full min-h-40 w-full object-cover" />

          <div className="grid place-items-center p-6 text-center">
            <div>
              <Typography as="h2" variant="subheading">
                Lançamentos gênesis
                <br />
                de edição limitada
              </Typography>

              <Typography tone="muted" className="mt-2 text-xs">
                Colecione edições escassas diretamente dos criadores antes da revelação pública.
              </Typography>

              <Button asChild size="sm" className="mt-4">
                <Link to="/marketplace">Explorar →</Link>
              </Button>
            </div>
          </div>
        </article>

        <article className="grid overflow-hidden bg-card md:grid-cols-[10rem_minmax(0,1fr)]">
          <NftArtwork artwork="ivoryBaron" className="h-full min-h-40 w-full object-cover" />

          <div className="grid place-items-center p-6 text-center">
            <div>
              <Typography as="h2" variant="subheading">
                Arte digital selecionada
                <br />e muito mais
              </Typography>

              <Typography tone="muted" className="mt-2 text-xs">
                Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
              </Typography>

              <Button asChild size="sm" className="mt-4">
                <Link to="/marketplace">Explorar →</Link>
              </Button>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-(--content-max) px-(--page-gutter) pb-16 md:px-0">
        <div className="text-center">
          <Typography as="h2" variant="heading">
            Diário da Cunhagem
          </Typography>

          <Typography tone="muted" className="mt-2 text-xs">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </Typography>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {diaryEntries.map((entry) => (
            <article key={entry.title} className="overflow-hidden bg-card">
              <NftArtwork artwork={entry.artwork} className="aspect-[1.2/1] w-full object-cover" />

              <div className="p-4">
                <p className="text-[0.65rem] text-muted-foreground">
                  {entry.date}
                  {' | '}
                  {entry.readTime}
                </p>

                <Typography as="h3" variant="subheading" className="mt-3 text-sm">
                  {entry.title}
                </Typography>

                <Typography tone="muted" className="mt-2 text-xs leading-relaxed">
                  {entry.description}
                </Typography>

                <Link
                  to="/marketplace"
                  className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
                >
                  Ler mais →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
