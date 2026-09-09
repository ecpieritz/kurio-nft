import { http, HttpResponse } from 'msw'

import type { ApiErrorResponse } from '@/lib/api/contracts'
import { mockDatabase } from '@/mocks/database/database'
import { isMockScenarioId, mockScenarios, type MockScenarioId } from '@/mocks/scenarios/definitions'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import {
  getActiveScenario,
  resetActiveScenario,
  setActiveScenario,
} from '@/mocks/scenarios/runtime'

const controlPath = '*/api/__mock'

interface SelectScenarioRequest {
  scenarioId: MockScenarioId
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function invalidScenarioResponse(): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Unknown mock scenario.',
        retryable: false,
        fieldErrors: [
          {
            field: 'scenarioId',
            code: 'unknown_scenario',
            message: 'Select one of the scenarios returned by the control endpoint.',
          },
        ],
      },
    },
    { status: 422 },
  )
}

export const controlHandlers = [
  http.get(`${controlPath}/scenario`, () =>
    HttpResponse.json({
      active: getActiveScenario(),
      available: Object.values(mockScenarios),
    }),
  ),

  http.put(`${controlPath}/scenario`, async ({ request }) => {
    const requestBody: unknown = await request.json().catch(() => undefined)

    if (!isRecord(requestBody) || !isMockScenarioId(requestBody.scenarioId)) {
      return invalidScenarioResponse()
    }

    const body: SelectScenarioRequest = { scenarioId: requestBody.scenarioId }
    return HttpResponse.json({ active: setActiveScenario(body.scenarioId) })
  }),

  http.post(`${controlPath}/reset`, () => {
    const state = mockDatabase.reset()
    const scenario = resetActiveScenario()

    return HttpResponse.json({
      reset: true,
      revision: state.revision,
      active: scenario,
    })
  }),

  http.get(`${controlPath}/state`, () => {
    const state = mockDatabase.read()

    return HttpResponse.json({
      schemaVersion: state.schemaVersion,
      revision: state.revision,
      counts: {
        users: state.users.length,
        nfts: state.nfts.length,
        carts: state.carts.length,
        orders: state.orders.length,
      },
    })
  }),

  http.get(`${controlPath}/probe`, async () => {
    const scenarioResponse = await applyNetworkScenario('probe')
    if (scenarioResponse) return scenarioResponse

    return HttpResponse.json({
      ok: true,
      scenario: getActiveScenario().id,
    })
  }),
]
