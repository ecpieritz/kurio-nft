import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AuthContext, type AuthContextValue } from '@/features/auth/session/auth-context'
import {
  fetchSession,
  loginAccount,
  logoutAccount,
} from '@/features/auth/session/auth-api'
import { clearSessionToken, getSessionToken, setSessionToken } from '@/lib/auth/session-token'
import { ApiClientError } from '@/lib/api/error'

const privateQueryScopes = new Set(['auth', 'profile', 'wallets', 'favorites', 'orders'])

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
}

function isInvalidSession(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.status === 401 || error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHORIZED')
  )
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getSessionToken())

  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: fetchSession,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  })

  const loginMutation = useMutation({ mutationFn: loginAccount, retry: false })
  const logoutMutation = useMutation({ mutationFn: logoutAccount, retry: false })

  useEffect(() => {
    if (!token || !sessionQuery.error || !isInvalidSession(sessionQuery.error)) return

    clearSessionToken()
    setToken(null)
    queryClient.removeQueries({ queryKey: authQueryKeys.all })
  }, [queryClient, sessionQuery.error, token])

  const context = useMemo<AuthContextValue>(() => {
    const hasRecoverableSessionError = Boolean(
      token && sessionQuery.error && !isInvalidSession(sessionQuery.error),
    )
    const status = !token
      ? 'anonymous'
      : sessionQuery.data
        ? 'authenticated'
        : ('pending' as const)

    return {
      status,
      user: sessionQuery.data?.user ?? null,
      sessionError: hasRecoverableSessionError
        ? sessionQuery.error instanceof Error
          ? sessionQuery.error
          : new Error('Não foi possível recuperar a sessão.')
        : null,
      login: async (request) => {
        const response = await loginMutation.mutateAsync(request)
        queryClient.removeQueries({
          predicate: (query) => privateQueryScopes.has(String(query.queryKey[0])),
        })
        setSessionToken(response.sessionToken)
        setToken(response.sessionToken)
        queryClient.setQueryData(authQueryKeys.session, {
          user: response.user,
          expiresAt: response.expiresAt,
        })
        return response.user
      },
      logout: async () => {
        try {
          await logoutMutation.mutateAsync()
        } finally {
          clearSessionToken()
          setToken(null)
          queryClient.removeQueries({
            predicate: (query) => privateQueryScopes.has(String(query.queryKey[0])),
          })
        }
      },
      retrySession: async () => {
        await sessionQuery.refetch()
      },
    }
  }, [loginMutation, logoutMutation, queryClient, sessionQuery, token])

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}
