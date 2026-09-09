import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthModalLayout } from '@/features/auth/components/auth-modal-layout'
import { AuthPanel } from '@/features/auth/components/auth-panel'
import { PasswordVisibilityButton } from '@/features/auth/components/password-visibility-button'
import { SocialAuthOptions } from '@/features/auth/components/social-auth-options'
import { useAuth } from '@/features/auth/session/use-auth'
import { ApiClientError } from '@/lib/api/error'
import { rememberReturnTo } from '@/lib/auth/navigation-context'

export function LoginPage() {
  const auth = useAuth()
  const search = useSearch({ from: '/_public/login' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (pending) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setError('Informe seu e-mail e senha.')
      return
    }

    if (search.redirect) rememberReturnTo(search.redirect)
    setPending(true)
    setError(null)

    void auth
      .login({ email: normalizedEmail, password })
      .catch((loginError: unknown) => {
        setError(
          loginError instanceof ApiClientError
            ? loginError.message
            : 'Não foi possível entrar. Tente novamente.',
        )
      })
      .finally(() => setPending(false))
  }

  return (
    <AuthModalLayout>
      <AuthPanel mode="login">
        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-8"
          aria-label="Entrar na Kurio"
          aria-busy={pending}
        >
          {search.reason === 'session-expired' && !error && (
            <div
              role="status"
              className="mb-4 rounded-control border border-primary/50 bg-primary/10 p-3 text-xs"
            >
              Sua sessão expirou. Entre novamente para continuar.
            </div>
          )}
          {error && (
            <div
              id="login-error"
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-control border border-destructive/70 p-3 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <label htmlFor="login-email" className="sr-only">
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
            value={email}
            disabled={pending}
            aria-invalid={Boolean(error && !email.trim())}
            aria-describedby={error ? 'login-error' : undefined}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
          />

          <div className="relative mt-3">
            <label htmlFor="login-password" className="sr-only">
              Senha
            </label>
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              disabled={pending}
              className="pr-20"
              aria-invalid={Boolean(error && !password)}
              aria-describedby={error ? 'login-error' : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
            />
            <PasswordVisibilityButton
              visible={showPassword}
              label="senha"
              onClick={() => setShowPassword((visible) => !visible)}
            />
          </div>

          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setError('A recuperação de senha será disponibilizada em breve.')}
            >
              Esqueceu a senha?
            </button>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
            {pending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <SocialAuthOptions />
        <p className="mt-10 text-center text-sm text-muted-foreground md:hidden">
          Novo na Kurio?{' '}
          <Link to="/sign-up" className="text-primary hover:underline">
            Crie uma conta
          </Link>
        </p>
      </AuthPanel>
    </AuthModalLayout>
  )
}
