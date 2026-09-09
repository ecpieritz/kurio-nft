import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { NftArtwork } from '@/components/media/nft-artwork'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { RegistrationForm } from '@/features/auth/registration/registration-form'

function MarketplaceBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 hidden overflow-hidden opacity-55 md:block">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 px-12 pt-44">
        {(
          [
            'goldenBeat',
            'ivoryBaron',
            'emeraldApe',
            'violetNomad',
            'goldenBeat',
            'ivoryBaron',
          ] as const
        ).map((artwork, index) => (
          <div key={`${artwork}-${index}`} className="bg-card p-3">
            <NftArtwork artwork={artwork} className="rounded-card" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SignUpPage() {
  const [registrationComplete, setRegistrationComplete] = useState(false)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate min-h-svh overflow-hidden rounded-[2.5rem] bg-card px-7 pb-8 pt-24 md:min-h-[calc(100svh-var(--header-height))] md:rounded-none md:bg-background md:px-6 md:py-20"
    >
      <MarketplaceBackdrop />
      <div aria-hidden="true" className="absolute inset-0 hidden bg-overlay/75 md:block" />

      <section className="relative z-10 mx-auto w-full max-w-[29rem] md:border md:border-border/70 md:bg-card md:px-[4.625rem] md:pb-14 md:pt-11 md:shadow-elevated">
        <Link
          to="/"
          aria-label="Fechar cadastro"
          className="absolute right-4 top-3 hidden size-10 place-items-center text-2xl text-primary hover:text-primary/80 md:grid"
        >
          ×
        </Link>

        <p className="text-center text-[2rem] font-bold tracking-[0.12em] text-foreground md:hidden">
          KURIO
        </p>

        <div className="mt-20 text-center md:mt-0">
          <Typography as="h1" variant="heading" className="md:hidden">
            Criar perfil de colecionador
          </Typography>
          <Typography as="h1" variant="heading" className="hidden md:block">
            <Link to="/login" className="font-normal text-foreground hover:text-primary">
              Entrar
            </Link>{' '}
            <span aria-hidden="true" className="text-primary">
              |
            </span>{' '}
            <span className="text-primary">Criar conta</span>
          </Typography>
          <Typography tone="muted" className="mx-auto mt-7 hidden max-w-xs text-xs md:block">
            Crie seu perfil de colecionador e conecte uma carteira quando quiser.
          </Typography>
        </div>

        <RegistrationForm onRegistered={() => setRegistrationComplete(true)} />

        {!registrationComplete && (
          <>
            <div className="my-7 flex items-center gap-3 text-xs text-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>Ou continue com</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full opacity-80"
                disabled
                title="Login social indisponível nesta simulação"
              >
                <span aria-hidden="true" className="text-base font-bold text-[#4285f4]">
                  G
                </span>
                Continuar com Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full opacity-80"
                disabled
                title="Login social indisponível nesta simulação"
              >
                <span aria-hidden="true" className="text-lg font-bold text-[#4267b2]">
                  f
                </span>
                Continuar com Facebook
              </Button>
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground md:hidden">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Entre
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
