import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

interface SessionGateProps {
  error: Error | null
  onRetry: () => void
}

export function SessionGate({ error, onRetry }: SessionGateProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-center">
      <section role={error ? 'alert' : 'status'} aria-live="polite" className="max-w-md">
        <div className="mx-auto size-10 animate-pulse rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
        <Typography as="h1" variant="heading" className="mt-6">
          {error ? 'Não foi possível recuperar sua sessão' : 'Recuperando sua sessão'}
        </Typography>
        {error && (
          <>
            <Typography tone="muted" className="mt-3">
              Verifique sua conexão e tente novamente.
            </Typography>
            <Button type="button" variant="outline" className="mt-6" onClick={onRetry}>
              Tentar novamente
            </Button>
          </>
        )}
      </section>
    </main>
  )
}
