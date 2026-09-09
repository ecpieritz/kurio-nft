import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { SignUpPage } from '@/features/auth/registration/sign-up-page'
import type { RouterContext } from '@/router/context'
import { anonymousAuthContext } from '@/router/context'
import { paths } from '@/router/paths'
import { HomeRoute, NotFoundRoute, RouteError, RoutePlaceholder } from '@/router/route-components'

interface LoginSearch {
  redirect?: string
}

function validateLoginSearch(search: Record<string, unknown>): LoginSearch {
  const redirectTarget = search.redirect

  return {
    redirect:
      typeof redirectTarget === 'string' && redirectTarget.startsWith('/')
        ? redirectTarget
        : undefined,
  }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
  errorComponent: RouteError,
  notFoundComponent: NotFoundRoute,
})

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: Outlet,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: ({ context, location }) => {
    if (context.auth.status !== 'authenticated') {
      // TanStack Router models redirects as throwable control-flow objects.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: paths.login,
        search: { redirect: location.href },
        replace: true,
      })
    }
  },
  component: Outlet,
})

const homeRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.home,
  component: HomeRoute,
})

const marketplaceRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.marketplace,
  component: () => (
    <RoutePlaceholder
      title="NFT marketplace"
      description="Catalog search, filters and pagination will be implemented in the catalog feature."
    />
  ),
})

const nftDetailsRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.nftDetails,
  component: () => (
    <RoutePlaceholder
      title="NFT details"
      description="Artwork, editions, availability and purchase actions will be loaded for this NFT."
    />
  ),
})

const cartRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.cart,
  component: () => (
    <RoutePlaceholder
      title="NFT cart"
      description="The cart remains public so visitor items can survive authentication."
    />
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.login,
  validateSearch: validateLoginSearch,
  component: () => (
    <RoutePlaceholder
      title="Sign in"
      description="Authentication will return the collector to the protected page they originally requested."
    />
  ),
})

const signUpRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: paths.signUp,
  component: SignUpPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: paths.checkout,
  component: () => (
    <RoutePlaceholder
      title="Checkout"
      description="Collector details, wallet selection and quote review require an authenticated session."
    />
  ),
})

const orderRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: paths.order,
  component: () => (
    <RoutePlaceholder
      title="Order status"
      description="Pending, confirmed and rejected orders are isolated to the active collector."
    />
  ),
})

const favoritesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: paths.favorites,
  component: () => (
    <RoutePlaceholder
      title="Favorites"
      description="Saved NFTs require an authenticated collector session."
    />
  ),
})

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: paths.profile,
  component: () => (
    <RoutePlaceholder
      title="Collector profile"
      description="Profile data, avatar and password settings are protected account resources."
    />
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: paths.wallets,
  component: () => (
    <RoutePlaceholder
      title="Wallets"
      description="Primary and secondary wallet settings require an authenticated session."
    />
  ),
})

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([
    homeRoute,
    marketplaceRoute,
    nftDetailsRoute,
    cartRoute,
    loginRoute,
    signUpRoute,
  ]),
  protectedRoute.addChildren([
    checkoutRoute,
    orderRoute,
    favoritesRoute,
    profileRoute,
    walletsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  context: { auth: anonymousAuthContext },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
