import { Outlet, useLocation } from '@tanstack/react-router'

import { MobileNavigation } from '@/components/layout/mobile-navigation'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export function AppShell() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const hasMobileNavigation =
    pathname === '/' ||
    pathname === '/marketplace' ||
    pathname === '/favorites' ||
    pathname === '/profile'

  return (
    <div className={hasMobileNavigation ? 'pb-20 md:pb-0' : undefined}>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-control bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <MobileNavigation />
    </div>
  )
}
