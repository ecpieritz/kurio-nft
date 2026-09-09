import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AuthContext, type AuthContextValue } from '@/features/auth/session/auth-context'
import { authQueryKeys } from '@/features/auth/session/auth-query-keys'
import { fetchSession, loginAccount, logoutAccount } from '@/features/auth/session/auth-api'
import { registerAccount } from '@/features/auth/registration/register-api'
import { clearReturnTo } from '@/lib/auth/navigation-context'
import {
  isSessionInvalidationError,
  subscribeToSessionExpiration,
} from '@/lib/auth/session-expiration'
import { clearSessionToken, getSessionToken, setSessionToken } from '@/lib/auth/session-token'

const privateQueryScopes = new Set(['auth', 'profile', 'wallets', 'favorites', 'orders'])

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getSessionToken())
  const [sessionExpiredAt, setSessionExpiredAt] = useState<number | null>(null)
  const [loginCompletedAt, setLoginCompletedAt] = useState<number | null>(null)

  const clearPrivateQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => privateQueryScopes.has(String(query.queryKey[0])),
    })
  }, [queryClient])

  const expireSession = useCallback(() => {
    if (!getSessionToken()) return

    clearSessionToken()
    setToken(null)
    setSessionExpiredAt(Date.now())
    clearPrivateQueries()
  }, [clearPrivateQueries])

  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => {
      try {
        return await fetchSession()
      } catch (error) {
        if (isSessionInvalidationError(error)) expireSession()
        throw error
      }
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  })

  const loginMutation = useMutation({ mutationFn: loginAccount, retry: false })
  const registerMutation = useMutation({ mutationFn: registerAccount, retry: false })
  const logoutMutation = useMutation({ mutationFn: logoutAccount, retry: false })

  useEffect(() => subscribeToSessionExpiration(() => expireSession()), [expireSession])

  const context = useMemo<AuthContextValue>(() => {
    const hasRecoverableSessionError = Boolean(
      token && sessionQuery.error && !isSessionInvalidationError(sessionQuery.error),
    )
    const status = !token ? 'anonymous' : sessionQuery.data ? 'authenticated' : ('pending' as const)

    return {
      status,
      user: sessionQuery.data?.user ?? null,
      sessionExpiredAt,
      loginCompletedAt,
      sessionError: hasRecoverableSessionError
        ? sessionQuery.error instanceof Error
          ? sessionQuery.error
          : new Error('Não foi possível recuperar a sessão.')
        : null,
      login: async (request) => {
        const response = await loginMutation.mutateAsync(request)
        clearPrivateQueries()
        setSessionToken(response.sessionToken)
        setToken(response.sessionToken)
        setSessionExpiredAt(null)
        setLoginCompletedAt(Date.now())
        queryClient.setQueryData(authQueryKeys.session, {
          user: response.user,
          expiresAt: response.expiresAt,
        })
        return response.user
      },
      register: async (request) => {
        const response = await registerMutation.mutateAsync(request)
        clearPrivateQueries()
        setSessionToken(response.sessionToken)
        setToken(response.sessionToken)
        setSessionExpiredAt(null)
        setLoginCompletedAt(Date.now())
        queryClient.setQueryData(authQueryKeys.session, {
          user: response.user,
          expiresAt: response.expiresAt,
        })
        return response
      },
      logout: async () => {
        try {
          await logoutMutation.mutateAsync()
        } finally {
          clearSessionToken()
          setToken(null)
          setSessionExpiredAt(null)
          setLoginCompletedAt(null)
          clearReturnTo()
          clearPrivateQueries()
        }
      },
      retrySession: async () => {
        await sessionQuery.refetch()
      },
    }
  }, [
    clearPrivateQueries,
    loginMutation,
    loginCompletedAt,
    logoutMutation,
    queryClient,
    registerMutation,
    sessionExpiredAt,
    sessionQuery,
    token,
  ])

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}
