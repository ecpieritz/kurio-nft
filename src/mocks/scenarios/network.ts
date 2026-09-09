import { delay, HttpResponse } from 'msw'

import type { ApiErrorResponse } from '@/lib/api/contracts'
import type { MockOperation } from '@/mocks/scenarios/definitions'
import { getActiveScenario, nextRequestSequence } from '@/mocks/scenarios/runtime'

function appliesToOperation(
  configuredOperations: readonly MockOperation[] | 'all',
  operation: MockOperation,
): boolean {
  return configuredOperations === 'all' || configuredOperations.includes(operation)
}

function createHttpError(status: number): HttpResponse<ApiErrorResponse> {
  const retryable = status >= 500

  return HttpResponse.json(
    {
      error: {
        code: retryable ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
        message: retryable
          ? 'The simulated API is temporarily unavailable.'
          : 'The simulated API rejected the request.',
        retryable,
        requestId: `mock-http-${status}`,
      },
    },
    { status },
  )
}

export async function applyNetworkScenario(
  operation: MockOperation,
): Promise<HttpResponse<ApiErrorResponse> | undefined> {
  const scenario = getActiveScenario()
  const effect = scenario.network

  if (effect.type === 'none') return undefined

  if (effect.type === 'latency') {
    const sequenceIndex = nextRequestSequence() % effect.sequenceMs.length
    await delay(effect.sequenceMs[sequenceIndex])
    return undefined
  }

  if (!appliesToOperation(effect.operations, operation)) return undefined

  if (effect.type === 'network-error') {
    return HttpResponse.error()
  }

  if (effect.type === 'timeout') {
    await delay('infinite')
    return undefined
  }

  return createHttpError(effect.status)
}
