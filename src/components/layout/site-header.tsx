import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

const navigationLinkClass =
  'relative inline-flex h-full items-center px-2 text-sm font-medium text-foreground/80 transition-colors duration-(--duration-fast) after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:text-primary'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 hidden bg-background/95 backdrop-blur md:block">
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
          <Button asChild size="sm" className="ml-2">
            <Link to="/login">
              <Icon name="logout" className="size-4 brightness-0" />
              Entrar
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
