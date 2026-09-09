import {
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useSearch,
} from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { AuthModalLayout } from '@/features/auth/components/auth-modal-layout'
import { PasswordVisibilityButton } from '@/features/auth/components/password-visibility-button'
import { useAuth } from '@/features/auth/session/use-auth'
import { rememberReturnTo } from '@/lib/auth/navigation-context'
import { ApiClientError } from '@/lib/api/error'

export function LoginPage() {
  const auth =
    useAuth()

  const search =
    useSearch({
      from:
        '/_public/login',
    })

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    pending,
    setPending,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    if (pending) {
      return
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        'Informe seu e-mail e senha.',
      )

      return
    }

    if (
      search.redirect
    ) {
      rememberReturnTo(
        search.redirect,
      )
    }

    setPending(
      true,
    )

    setError(
      null,
    )

    void auth
      .login({
        email:
          normalizedEmail,

        password,
      })
      .catch(
        (
          loginError:
            unknown,
        ) => {
          setError(
            loginError instanceof
              ApiClientError
              ? loginError.message
              : 'Não foi possível entrar. Tente novamente.',
          )
        },
      )
      .finally(
        () => {
          setPending(
            false,
          )
        },
      )
  }

  return (
    <AuthModalLayout>
      <section className="relative w-full max-w-[29rem] rounded-[2.5rem] bg-card px-7 pb-12 pt-16 md:max-w-[23rem] md:rounded-none md:border md:border-border/70 md:px-[3.625rem] md:pb-14 md:pt-11 md:shadow-elevated">
        <Link
          to="/"
          aria-label="Fechar login"
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
            Entrar
          </Typography>

          <Typography
            as="h1"
            variant="heading"
            className="hidden md:block"
          >
            <span className="text-primary">
              Entrar
            </span>{' '}

            <span
              aria-hidden="true"
              className="text-primary"
            >
              |
            </span>{' '}

            <Link
              to="/sign-up"
              className="font-normal text-foreground hover:text-primary"
            >
              Criar conta
            </Link>
          </Typography>

          <Typography
            tone="muted"
            className="mx-auto mt-7 hidden max-w-xs text-xs md:block"
          >
            Entre para gerenciar sua carteira, coleção e perfil de
            criador.
          </Typography>
        </div>

        <form
          noValidate
          onSubmit={
            handleSubmit
          }
          className="mt-8"
          aria-label="Entrar na Kurio"
        >
          {search.reason ===
            'session-expired' &&
            !error && (
              <div
                role="status"
                className="mb-4 rounded-control border border-primary/50 bg-primary/10 p-3 text-xs"
              >
                Sua sessão expirou. Entre novamente para continuar.
              </div>
            )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-control border border-destructive/70 p-3 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <label
            htmlFor="login-email"
            className="sr-only"
          >
            E-mail
          </label>

          <Input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            spellCheck={false}
            placeholder="contato@email.com"
            value={
              email
            }
            disabled={
              pending
            }
            onChange={(
              event,
            ) => {
              setEmail(
                event.target.value,
              )

              setError(
                null,
              )
            }}
          />

          <div className="relative mt-3">
            <label
              htmlFor="login-password"
              className="sr-only"
            >
              Senha
            </label>

            <Input
              id="login-password"
              name="password"
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              autoComplete="current-password"
              placeholder="Senha"
              value={
                password
              }
              disabled={
                pending
              }
              className="pr-20"
              onChange={(
                event,
              ) => {
                setPassword(
                  event.target.value,
                )

                setError(
                  null,
                )
              }}
            />

            <PasswordVisibilityButton
              visible={
                showPassword
              }
              label="senha"
              onClick={() => {
                setShowPassword(
                  (
                    visible,
                  ) => !visible,
                )
              }}
            />
          </div>

          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                setError(
                  'A recuperação de senha será disponibilizada em breve.',
                )
              }}
            >
              Esqueceu a senha?
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={
              pending
            }
          >
            {pending
              ? 'Entrando...'
              : 'Entrar'}
          </Button>
        </form>

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
          Novo na Kurio?{' '}

          <Link
            to="/sign-up"
            className="text-primary hover:underline"
          >
            Crie uma conta
          </Link>
        </p>
      </section>
    </AuthModalLayout>
  )
}