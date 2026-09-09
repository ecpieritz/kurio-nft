import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { AuthProvider } from '@/features/auth/session/auth-provider'
import { SessionGate } from '@/features/auth/session/session-gate'
import { useAuth } from '@/features/auth/session/use-auth'
import { RealtimeProvider } from '@/features/realtime/realtime-provider'
import {
  consumeReturnTo,
  getCurrentNavigationPath,
  getRememberedReturnTo,
  rememberReturnTo,
} from '@/lib/auth/navigation-context'
import { queryClient } from '@/lib/query/query-client'
import { router } from '@/router'
import { paths } from '@/router/paths'

function RoutedApplication() {
  const auth = useAuth()

  const handledExpiration = useRef<number | null>(null)

  const handledLogin = useRef<number | null>(null)

  useEffect(() => {
    if (!auth.sessionExpiredAt || handledExpiration.current === auth.sessionExpiredAt) {
      return
    }

    handledExpiration.current = auth.sessionExpiredAt

    const returnTo =
      rememberReturnTo(getCurrentNavigationPath()) ?? getRememberedReturnTo() ?? paths.home

    void router.navigate({
      to: paths.login,

      search: {
        redirect: returnTo,

        reason: 'session-expired',
      },

      replace: true,
    })
  }, [auth.sessionExpiredAt])

  useEffect(() => {
    if (!auth.loginCompletedAt || handledLogin.current === auth.loginCompletedAt) {
      return
    }

    handledLogin.current = auth.loginCompletedAt

    router.history.replace(consumeReturnTo(paths.home))
  }, [auth.loginCompletedAt])

  if (auth.status === 'pending') {
    return (
      <SessionGate
        error={auth.sessionError}
        onRetry={() => {
          void auth.retrySession()
        }}
      />
    )
  }

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          status: auth.status,

          userId: auth.user?.id ?? null,
        },
      }}
    />
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        <AuthProvider>
          <RoutedApplication />
        </AuthProvider>
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
