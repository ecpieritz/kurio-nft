import { Link, useLocation } from '@tanstack/react-router'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const itemClass =
  'grid size-12 place-items-center rounded-full transition-colors duration-(--duration-fast) hover:bg-accent'

export function MobileNavigation() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const marketplaceActive = pathname === '/marketplace' || pathname.startsWith('/nfts/')
  const cartActive = pathname === '/cart' || pathname === '/checkout'
  const accountActive =
    pathname === '/profile' || pathname === '/wallets' || pathname.startsWith('/orders/')

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-panel border-t border-border/70 bg-card px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link
          to="/"
          aria-label="Início"
          aria-current={pathname === '/' ? 'page' : undefined}
          className={cn(itemClass, pathname === '/' && 'bg-accent')}
        >
          <Icon name="homeBold" className="size-5" />
        </Link>
        <Link
          to="/favorites"
          aria-label="Lista de interesse"
          aria-current={pathname === '/favorites' ? 'page' : undefined}
          className={cn(itemClass, pathname === '/favorites' && 'bg-accent')}
        >
          <Icon name={pathname === '/favorites' ? 'heartBold' : 'heart'} className="size-5" />
        </Link>
        <Link
          to="/marketplace"
          aria-label="Explorar NFTs"
          aria-current={marketplaceActive ? 'page' : undefined}
          className="-mt-8 grid size-16 place-items-center rounded-full border-[0.375rem] border-card bg-primary shadow-card transition-transform hover:-translate-y-0.5"
        >
          <Icon name="search" className="size-6 brightness-0" />
        </Link>
        <Link
          to="/cart"
          aria-label="Carrinho"
          aria-current={cartActive ? 'page' : undefined}
          className={cn(itemClass, cartActive && 'bg-accent')}
        >
          <Icon name="cart" className="size-5" />
        </Link>
        <Link
          to="/profile"
          aria-label="Perfil"
          aria-current={accountActive ? 'page' : undefined}
          className={cn(itemClass, accountActive && 'bg-accent')}
        >
          <Icon name={accountActive ? 'userBold' : 'user'} className="size-5" />
        </Link>
      </div>
    </nav>
  )
}
