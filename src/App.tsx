import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export function App() {
  return (
    <main className="grid min-h-svh place-content-center bg-background px-(--page-gutter) py-(--section-space) text-center">
      <section className="w-full max-w-2xl rounded-panel border bg-card p-8 shadow-elevated sm:p-12">
        <Typography as="p" variant="eyebrow" tone="accent">
          Welcome to Kurio
        </Typography>
        <Typography as="h1" variant="title" className="mt-4 uppercase">
          Own the future of digital art
        </Typography>
        <Typography tone="muted" className="mx-auto mt-5 max-w-xl">
          The Kurio design system is ready for accessible, responsive marketplace experiences.
        </Typography>
        <Button type="button" size="lg" className="mt-8">
          Explore marketplace
        </Button>
      </section>
    </main>
  )
}
