import type { PropsWithChildren } from 'react'
import { Link } from '@tanstack/react-router'

import { Typography } from '@/components/ui/typography'

interface AuthPanelProps extends PropsWithChildren {
  mode: 'login' | 'register'
}

export function AuthPanel({ mode, children }: AuthPanelProps) {
  const isLogin = mode === 'login'

  return (
    <section className="relative flex min-h-svh w-full max-w-[29rem] flex-col rounded-[2.5rem] bg-card px-7 pb-10 pt-24 md:min-h-0 md:rounded-none md:border md:border-border/70 md:px-14 md:pb-14 md:pt-11 md:shadow-elevated">
      <Link
        to="/"
        aria-label={isLogin ? 'Fechar login' : 'Fechar cadastro'}
        className="absolute right-4 top-3 hidden size-10 place-items-center text-2xl text-primary hover:text-primary/80 md:grid"
      >
        ×
      </Link>
      <p className="text-center text-[2rem] font-bold tracking-[0.12em] text-foreground md:hidden">
        KURIO
      </p>
      <header className="mt-20 text-center md:mt-0">
        <Typography as="h1" variant="heading" className="md:hidden">
          {isLogin ? 'Entrar' : 'Criar perfil de colecionador'}
        </Typography>
        <Typography as="h1" variant="heading" className="hidden md:block">
          <Link
            to="/login"
            className={isLogin ? 'text-primary' : 'font-normal text-foreground hover:text-primary'}
          >
            Entrar
          </Link>{' '}
          <span aria-hidden="true" className="text-primary">
            |
          </span>{' '}
          <Link
            to="/sign-up"
            className={isLogin ? 'font-normal text-foreground hover:text-primary' : 'text-primary'}
          >
            Criar conta
          </Link>
        </Typography>
        <Typography tone="muted" className="mx-auto mt-7 hidden max-w-xs text-xs md:block">
          {isLogin
            ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
            : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
        </Typography>
      </header>
      {children}
    </section>
  )
}
