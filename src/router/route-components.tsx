import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { NftArtwork } from '@/components/media/nft-artwork'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Typography } from '@/components/ui/typography'

interface RoutePlaceholderProps {
  title: string
  description: string
}

export function HomeRoute() {
  return (
    <main className="grid min-h-svh place-items-center px-(--page-gutter) py-(--section-space)">
      <section className="grid w-full max-w-(--content-max) items-center gap-10 rounded-panel border bg-card p-7 shadow-elevated md:grid-cols-[1fr_0.8fr] md:p-12">
        <div>
          <Typography as="p" variant="eyebrow" tone="accent">
            Welcome to Kurio
          </Typography>
          <Typography as="h1" variant="title" className="mt-4 uppercase">
            Own the future of digital art
          </Typography>
          <Typography tone="muted" className="mt-5 max-w-2xl">
            Discover selected NFTs from emerging creators and explore verified digital art.
          </Typography>
          <Button asChild size="lg" className="mt-8">
            <Link to="/marketplace">
              <Icon name="search" aria-hidden className="brightness-0" />
              Explore marketplace
            </Link>
          </Button>
        </div>

        <NftArtwork artwork="emeraldApe" fetchPriority="high" className="w-full rounded-panel" />
      </section>
    </main>
  )
}

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <main className="grid min-h-svh place-items-center px-(--page-gutter) py-(--section-space)">
      <section className="w-full max-w-2xl rounded-panel border bg-card p-8 text-center shadow-elevated">
        <Typography as="h1" variant="heading">
          {title}
        </Typography>
        <Typography tone="muted" className="mx-auto mt-4 max-w-xl">
          {description}
        </Typography>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/">Return home</Link>
        </Button>
      </section>
    </main>
  )
}

export function NotFoundRoute() {
  return (
    <RoutePlaceholder
      title="Page not found"
      description="The address does not match any page available in the Kurio marketplace."
    />
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : 'An unexpected navigation error occurred.'

  return (
    <main className="grid min-h-svh place-items-center px-(--page-gutter) py-(--section-space)">
      <section
        role="alert"
        className="w-full max-w-2xl rounded-panel border border-destructive bg-card p-8 text-center"
      >
        <Typography as="h1" variant="heading" tone="destructive">
          We could not open this page
        </Typography>
        <Typography tone="muted" className="mt-4">
          {message}
        </Typography>
        <Button type="button" variant="outline" className="mt-8" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  )
}
