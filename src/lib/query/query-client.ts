import { QueryClient } from '@tanstack/react-query'

import { ApiClientError } from '@/lib/api/error'

function shouldRetry(failureCount: number, error: unknown): boolean {
  return error instanceof ApiClientError && error.retryable && failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
