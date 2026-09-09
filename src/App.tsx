import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { AuthProvider } from '@/features/auth/session/auth-provider'
import { SessionGate } from '@/features/auth/session/session-gate'
import { useAuth } from '@/features/auth/session/use-auth'
import { queryClient } from '@/lib/query/query-client'
import { router } from '@/router'

function RoutedApplication() {
  const auth = useAuth()

  if (auth.status === 'pending') {
    return <SessionGate error={auth.sessionError} onRetry={() => void auth.retrySession()} />
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
      <AuthProvider>
        <RoutedApplication />
      </AuthProvider>
    </QueryClientProvider>
  )
}
