import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { SignUpPage } from '@/features/auth/registration/sign-up-page'
import { CartPage } from '@/features/cart/cart-page'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { validateCatalogSearch } from '@/features/catalog/catalog-search'
import { CheckoutPage } from '@/features/checkout/checkout-page'
import { FavoritesPage } from '@/features/favorites/favorites-page'
import { NftDetailsPage } from '@/features/nft/nft-details-page'
import { OrderPage } from '@/features/orders/order-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { WalletsPage } from '@/features/wallets/wallets-page'
import {
  rememberReturnTo,
  sanitizeReturnTo,
} from '@/lib/auth/navigation-context'
import type { RouterContext } from '@/router/context'
import { anonymousAuthContext } from '@/router/context'
import { paths } from '@/router/paths'
import {
  HomeRoute,
  NotFoundRoute,
  RouteError,
  RoutePlaceholder,
} from '@/router/route-components'

interface LoginSearch {
  redirect?: string
  reason?: 'session-expired'
}

function validateLoginSearch(
  search: Record<
    string,
    unknown
  >,
): LoginSearch {
  return {
    redirect:
      sanitizeReturnTo(
        search.redirect,
      ) ?? undefined,

    reason:
      search.reason ===
      'session-expired'
        ? 'session-expired'
        : undefined,
  }
}

const rootRoute =
  createRootRouteWithContext<RouterContext>()(
    {
      component:
        AppShell,

      errorComponent:
        RouteError,

      notFoundComponent:
        NotFoundRoute,
    },
  )

const publicRoute =
  createRoute({
    getParentRoute: () =>
      rootRoute,

    id:
      '_public',

    component:
      Outlet,
  })

const protectedRoute =
  createRoute({
    getParentRoute: () =>
      rootRoute,

    id:
      '_authenticated',

    beforeLoad: ({
      context,
      location,
    }) => {
      if (
        context.auth.status !==
        'authenticated'
      ) {
        const returnTo =
          rememberReturnTo(
            location.href,
          ) ??
          paths.home

        // TanStack Router models redirects as throwable control-flow objects.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({
          to:
            paths.login,

          search: {
            redirect:
              returnTo,
          },

          replace:
            true,
        })
      }
    },

    component:
      Outlet,
  })

const homeRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.home,

    component:
      HomeRoute,
  })

const marketplaceRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.marketplace,

    validateSearch:
      validateCatalogSearch,

    component:
      CatalogPage,
  })

const nftDetailsRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.nftDetails,

    component:
      NftDetailsPage,
  })

const cartRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.cart,

    component:
      CartPage,
  })

const loginRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.login,

    validateSearch:
      validateLoginSearch,

    component: () => (
      <RoutePlaceholder
        title="Sign in"
        description="Authentication will return the collector to the protected page they originally requested."
      />
    ),
  })

const signUpRoute =
  createRoute({
    getParentRoute: () =>
      publicRoute,

    path:
      paths.signUp,

    component:
      SignUpPage,
  })

const checkoutRoute =
  createRoute({
    getParentRoute: () =>
      protectedRoute,

    path:
      paths.checkout,

    component:
      CheckoutPage,
  })

const orderRoute =
  createRoute({
    getParentRoute: () =>
      protectedRoute,

    path:
      paths.order,

    component:
      OrderPage,
  })

const favoritesRoute =
  createRoute({
    getParentRoute: () =>
      protectedRoute,

    path:
      paths.favorites,

    component:
      FavoritesPage,
  })

const profileRoute =
  createRoute({
    getParentRoute: () =>
      protectedRoute,

    path:
      paths.profile,

    component:
      ProfilePage,
  })

const walletsRoute =
  createRoute({
    getParentRoute: () =>
      protectedRoute,

    path:
      paths.wallets,

    component:
      WalletsPage,
  })

const routeTree =
  rootRoute.addChildren([
    publicRoute.addChildren(
      [
        homeRoute,
        marketplaceRoute,
        nftDetailsRoute,
        cartRoute,
        loginRoute,
        signUpRoute,
      ],
    ),

    protectedRoute.addChildren(
      [
        checkoutRoute,
        orderRoute,
        favoritesRoute,
        profileRoute,
        walletsRoute,
      ],
    ),
  ])

export const router =
  createRouter({
    routeTree,

    context: {
      auth:
        anonymousAuthContext,
    },

    defaultPreload:
      'intent',

    defaultPreloadStaleTime:
      0,

    scrollRestoration:
      true,
  })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}