import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/features/auth/session/use-auth'

const navigationLinkClass =
  'relative inline-flex h-full items-center px-2 text-sm font-medium text-foreground/80 transition-colors duration-(--duration-fast) after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:text-primary'

export function SiteHeader() {
  const auth = useAuth()
  const navigate = useNavigate()
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const greetingName = auth.user?.displayName.trim().split(/\s+/)[0] || auth.user?.username

  useEffect(() => {
    if (!accountMenuOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target

      if (!(target instanceof Node) || !accountMenuRef.current) {
        return
      }

      if (!accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  async function handleLogout(): Promise<void> {
    if (logoutPending) return

    setLogoutPending(true)
    setLogoutError(null)

    try {
      await auth.logout()
    } catch {
      setLogoutError('A sessão local foi encerrada, mas a API não confirmou o logout.')
    } finally {
      setLogoutDialogOpen(false)
      setLogoutPending(false)
      await navigate({ to: '/' })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 hidden bg-background/95 backdrop-blur lg:block">
        <div className="mx-auto flex h-(--header-height) max-w-(--content-max) items-center gap-8 border-b border-border/70 px-1">
          <Link
            to="/"
            aria-label="Kurio — página inicial"
            className="mr-auto text-sm font-bold tracking-[0.14em] text-foreground"
          >
            KURIO
          </Link>

          <nav aria-label="Navegação principal" className="flex h-full items-center gap-6">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className={navigationLinkClass}
              activeProps={{ className: 'text-primary after:scale-x-100' }}
            >
              Início
            </Link>
            <Link
              to="/marketplace"
              className={navigationLinkClass}
              activeProps={{ className: 'text-primary after:scale-x-100' }}
            >
              Mercado
            </Link>
            <span aria-disabled="true" className="px-2 text-sm text-foreground/55" title="Em breve">
              Criadores
            </span>
            <span aria-disabled="true" className="px-2 text-sm text-foreground/55" title="Em breve">
              Aprenda
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="text-foreground">
              <Link to="/marketplace" aria-label="Buscar NFTs">
                <Icon name="search" className="size-5" />
              </Link>
            </Button>

            <Button asChild variant="ghost" size="icon" className="relative text-foreground">
              <Link to="/cart" aria-label="Abrir carrinho">
                <Icon name="cart" className="size-5" />
              </Link>
            </Button>

            {auth.status === 'authenticated' ? (
              <div ref={accountMenuRef} className="relative ml-2">
                <Button
                  type="button"
                  size="sm"
                  className="max-w-56"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-controls="account-menu"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                >
                  <Icon name="user" className="size-4 brightness-0" />
                  <span className="truncate">Olá, {greetingName}!</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`size-3.5 shrink-0 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </Button>

                {accountMenuOpen && (
                  <div
                    id="account-menu"
                    role="menu"
                    aria-label="Menu da conta"
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-control border border-border bg-card py-2 shadow-elevated"
                  >
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-background hover:text-primary focus-visible:bg-background"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <Icon name="user" className="size-4 text-primary" color="#dc8d48" />
                      Meu perfil
                    </Link>

                    <Link
                      to="/favorites"
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-background hover:text-primary focus-visible:bg-background"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <Icon name="heart" className="size-4 text-primary" color="#dc8d48" />
                      Favoritos
                    </Link>

                    <div className="my-1 border-t border-border/70" />

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-background hover:text-primary focus-visible:bg-background"
                      onClick={() => {
                        setAccountMenuOpen(false)
                        setLogoutError(null)
                        setLogoutDialogOpen(true)
                      }}
                    >
                      <Icon name="logout" className="size-4 text-primary" color="#dc8d48" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : auth.status === 'pending' ? (
              <Button type="button" size="sm" className="ml-2" disabled aria-label="Recuperando sessão">
                <Icon name="user" className="size-4 brightness-0" />
                <span>Carregando...</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="ml-2">
                <Link to="/login">
                  <Icon name="logout" className="size-4 brightness-0" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <ConfirmationDialog
        open={logoutDialogOpen}
        title="Sair da sua conta?"
        description="Você precisará entrar novamente para acessar seus favoritos, carteiras, perfil e pedidos."
        confirmLabel="Sim, sair"
        pending={logoutPending}
        onOpenChange={(open) => {
          if (!logoutPending) {
            setLogoutDialogOpen(open)
            if (open) setLogoutError(null)
          }
        }}
        onConfirm={() => void handleLogout()}
      />

      {logoutError && (
        <p
          role="alert"
          className="fixed right-4 top-20 z-50 max-w-sm rounded-control border border-destructive bg-card px-4 py-3 text-sm text-destructive shadow-elevated"
        >
          {logoutError}
        </p>
      )}
    </>
  )
}
