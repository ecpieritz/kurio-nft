import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  createQuote,
  fetchQuote,
} from '@/features/quote/quote-api'
import type {
  QuoteRequest,
  QuoteResponse,
} from '@/lib/api/contracts'

export const quoteQueryKeys = {
  all: ['quotes'] as const,

  details: () =>
    [
      ...quoteQueryKeys.all,
      'detail',
    ] as const,

  detail: (
    quoteId: string,
  ) =>
    [
      ...quoteQueryKeys.details(),
      quoteId,
    ] as const,
}

export function useQuoteQuery(
  quoteId: string | null,
): UseQueryResult<
  QuoteResponse,
  Error
> {
  return useQuery<
    QuoteResponse,
    Error
  >({
    queryKey:
      quoteQueryKeys.detail(
        quoteId ?? 'pending',
      ),

    queryFn: ({
      signal,
    }): Promise<QuoteResponse> => {
      if (!quoteId) {
        return Promise.reject(
          new Error(
            'Quote id is required.',
          ),
        )
      }

      return fetchQuote(
        quoteId,
        signal,
      )
    },

    enabled:
      Boolean(quoteId),

    staleTime: 15_000,
  })
}

export function useCreateQuoteMutation(): UseMutationResult<
  QuoteResponse,
  Error,
  QuoteRequest
> {
  const queryClient =
    useQueryClient()

  return useMutation<
    QuoteResponse,
    Error,
    QuoteRequest
  >({
    mutationFn:
      createQuote,

    onSuccess: (
      quote,
    ) => {
      queryClient.setQueryData<QuoteResponse>(
        quoteQueryKeys.detail(
          quote.id,
        ),
        quote,
      )
    },
  })
}