import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AuthModalLayout } from '@/features/auth/components/auth-modal-layout'
import { RegistrationForm } from '@/features/auth/registration/registration-form'

export function SignUpPage() {
  const [
    registrationComplete,
    setRegistrationComplete,
  ] =
    useState(
      false,
    )

  return (
    <AuthModalLayout>
      <section className="relative w-full max-w-[29rem] rounded-[2.5rem] bg-card px-7 pb-12 pt-16 md:max-w-[23rem] md:rounded-none md:border md:border-border/70 md:px-[3.625rem] md:pb-14 md:pt-11 md:shadow-elevated">
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
          <Typography
            as="h1"
            variant="heading"
            className="md:hidden"
          >
            Criar perfil de colecionador
          </Typography>

          <Typography
            as="h1"
            variant="heading"
            className="hidden md:block"
          >
            <Link
              to="/login"
              className="font-normal text-foreground hover:text-primary"
            >
              Entrar
            </Link>{' '}

            <span
              aria-hidden="true"
              className="text-primary"
            >
              |
            </span>{' '}

            <span className="text-primary">
              Criar conta
            </span>
          </Typography>

          <Typography
            tone="muted"
            className="mx-auto mt-7 hidden max-w-xs text-xs md:block"
          >
            Crie seu perfil de colecionador e conecte uma carteira
            quando quiser.
          </Typography>
        </div>

        <RegistrationForm
          onRegistered={() => {
            setRegistrationComplete(
              true,
            )
          }}
        />

        {!registrationComplete && (
          <>
            <div className="my-7 flex items-center gap-3 text-xs text-foreground">
              <span className="h-px flex-1 bg-border" />

              <span>
                Ou continue com
              </span>

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
                <span
                  aria-hidden="true"
                  className="text-base font-bold text-[#4285f4]"
                >
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
                <span
                  aria-hidden="true"
                  className="text-lg font-bold text-[#4267b2]"
                >
                  f
                </span>

                Continuar com Facebook
              </Button>
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground md:hidden">
              Já tem uma conta?{' '}

              <Link
                to="/login"
                className="text-primary hover:underline"
              >
                Entre
              </Link>
            </p>
          </>
        )}
      </section>
    </AuthModalLayout>
  )
}