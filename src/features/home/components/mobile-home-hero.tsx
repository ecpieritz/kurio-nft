import { Link } from '@tanstack/react-router'

import { NftArtwork } from '@/components/media/nft-artwork'
import { Icon } from '@/components/ui/icon'

export function MobileHomeHero() {
  return (
    <section
      className="px-(--page-gutter) pb-5 pt-6 md:hidden"
      aria-label="Apresentação do marketplace"
    >
      <div className="flex gap-2">
        <Link
          to="/marketplace"
          className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-control bg-card px-4 text-sm font-semibold text-muted-foreground"
        >
          <Icon name="search" className="size-5 shrink-0 text-primary" />
          <span className="truncate">Explorar coleções</span>
        </Link>
        <Link
          to="/marketplace"
          aria-label="Abrir filtros do catálogo"
          className="grid size-12 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="size-5"
          >
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </svg>
        </Link>
      </div>

      <div className="relative mt-4 min-h-44 overflow-hidden rounded-panel bg-[radial-gradient(circle_at_35%_45%,rgba(220,141,72,0.28),transparent_55%),linear-gradient(115deg,#6a4329,#2b1813)] p-4">
        <div className="relative z-10 w-[58%]">
          <p className="text-xs text-foreground">Bem-vindo à Kurio</p>
          <h1 className="mt-2 text-xl font-bold uppercase leading-8">
            Seja dono da cultura digital
          </h1>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <Link
            to="/marketplace"
            className="mt-1 inline-flex text-xs font-bold text-primary hover:underline"
          >
            EXPLORAR →
          </Link>
        </div>
        <NftArtwork
          artwork="emeraldApe"
          fetchPriority="high"
          className="absolute right-4 top-3 aspect-square w-[38%] rounded-card object-cover"
        />
        <NftArtwork
          artwork="violetNomad"
          className="absolute right-[28%] top-[48%] aspect-square w-[22%] rounded-control border-2 border-card object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
        >
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  )
}
