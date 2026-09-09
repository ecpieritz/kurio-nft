import { apiRequest } from '@/lib/api/client'
import type {
  QuoteRequest,
  QuoteResponse,
} from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'
import { getOrCreateVisitorId } from '@/lib/api/visitor-id'

function getQuoteHeaders(): Record<
  string,
  string
> {
  return {
    'X-Kurio-Visitor-Id':
      getOrCreateVisitorId(),
  }
}

export function createQuote(
  request: QuoteRequest,
): Promise<QuoteResponse> {
  return apiRequest<
    QuoteResponse,
    QuoteRequest
  >({
    method: 'POST',
    url: endpoints.quotes.create,
    headers:
      getQuoteHeaders(),
    data: request,
  })
}

export function fetchQuote(
  quoteId: string,
  signal?: AbortSignal,
): Promise<QuoteResponse> {
  return apiRequest<QuoteResponse>({
    method: 'GET',
    url:
      endpoints.quotes.details(
        quoteId,
      ),
    headers:
      getQuoteHeaders(),
    signal,
  })
}