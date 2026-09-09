import { HttpResponse } from 'msw'

import type { ApiErrorResponse } from '@/lib/api/contracts'
import { mockDatabase } from '@/mocks/database/database'
import type { MockDatabaseState } from '@/mocks/database/types'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

interface AuthorizedRequest {
  authorized: true
  state: MockDatabaseState
  userId: string
}

interface RejectedRequest {
  authorized: false
  response: HttpResponse<ApiErrorResponse>
}

export type MockAuthorizationResult = AuthorizedRequest | RejectedRequest

function getBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return undefined
  return authorization.slice('Bearer '.length).trim() || undefined
}

function reject(code: 'UNAUTHORIZED' | 'SESSION_EXPIRED', message: string): RejectedRequest {
  return {
    authorized: false,
    response: HttpResponse.json({ error: { code, message, retryable: false } }, { status: 401 }),
  }
}

export function authorizeMockRequest(request: Request): MockAuthorizationResult {
  const state = mockDatabase.read()
  const token = getBearerToken(request)
  const session = state.sessions.find((candidate) => candidate.id === token)

  if (!session) {
    return reject('UNAUTHORIZED', 'Autentica\u00e7\u00e3o necess\u00e1ria.')
  }

  const expired =
    getActiveScenario().flags.sessionExpired || Date.parse(session.expiresAt) <= Date.now()

  if (expired) {
    state.sessions = state.sessions.filter((candidate) => candidate.id !== session.id)
    state.revision += 1
    mockDatabase.write(state)
    return reject('SESSION_EXPIRED', 'Sua sess\u00e3o expirou.')
  }

  if (!state.users.some((user) => user.id === session.userId)) {
    return reject('UNAUTHORIZED', 'A sess\u00e3o n\u00e3o pertence a um usu\u00e1rio v\u00e1lido.')
  }

  return { authorized: true, state, userId: session.userId }
}
