import { Link } from '@tanstack/react-router'

import type { NftSummary } from '@/lib/api/contracts'
import { cn } from '@/lib/utils'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
  className?: string
}

export function NftCard({ nft, priority = false, className }: NftCardProps) {
  return (
    <article className={cn('group min-w-0', className)}>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver detalhes de ${nft.name}`}
        className="block rounded-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
      >
        <div className="relative overflow-hidden rounded-card bg-card p-1.5 shadow-card transition-transform duration-(--duration-normal) group-hover:-translate-y-1 motion-reduce:transform-none">
          {nft.rare && (
            <span className="absolute left-0 top-4 z-10 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
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
            className="aspect-square w-full rounded-[calc(var(--kurio-radius-card)-0.2rem)] object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
          />
        </div>
        <div className="px-2 pb-2 pt-3">
          <h2 className="truncate text-sm font-medium text-foreground md:text-base">{nft.name}</h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-bold text-primary">{nft.priceEth} ETH</span>
            {nft.previousPriceEth && (
              <span className="text-xs text-muted-foreground line-through">
                {nft.previousPriceEth} ETH
              </span>
            )}
          </div>
          {nft.availableQuantity === 0 && (
            <span className="mt-2 inline-block text-xs font-semibold text-destructive">
              Esgotado
            </span>
          )}
        </div>
      </Link>
    </article>
  )
}
