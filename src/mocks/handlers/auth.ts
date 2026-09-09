import { http, HttpResponse } from 'msw'

import { validateRegistration } from '@/features/auth/registration/registration-validation'
import type {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
  SessionUser,
} from '@/lib/api/contracts'
import { hashMockPassword } from '@/mocks/auth/password'
import { mockDatabase } from '@/mocks/database/database'
import type { MockUserRecord } from '@/mocks/database/types'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseRegisterRequest(value: unknown): RegisterRequest | undefined {
  if (
    !isRecord(value) ||
    typeof value.username !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.password !== 'string'
  ) {
    return undefined
  }

  return {
    username: value.username.trim(),
    email: value.email.trim().toLowerCase(),
    password: value.password,
  }
}

function parseLoginRequest(value: unknown): LoginRequest | undefined {
  if (!isRecord(value) || typeof value.email !== 'string' || typeof value.password !== 'string') {
    return undefined
  }

  return {
    email: value.email.trim().toLowerCase(),
    password: value.password,
  }
}

function getBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return undefined

  const token = authorization.slice('Bearer '.length).trim()
  return token || undefined
}

function validationErrorResponse(
  fieldErrors: NonNullable<ApiErrorResponse['error']['fieldErrors']>,
): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revise os dados informados.',
        retryable: false,
        fieldErrors,
      },
    },
    { status: 422 },
  )
}

function conflictResponse(fields: Array<'email' | 'username'>): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code: 'CONFLICT',
        message: 'Não foi possível criar a conta com esses dados.',
        retryable: false,
        fieldErrors: fields.map((field) => ({
          field,
          code: `${field}_already_exists`,
          message:
            field === 'email'
              ? 'Este e-mail já está cadastrado.'
              : 'Este nome de usuário já está em uso.',
        })),
      },
    },
    { status: 409 },
  )
}

function toSessionUser(user: MockUserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }
}

export const authHandlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('auth')
    if (scenarioResponse) return scenarioResponse

    const requestBody: unknown = await request.json().catch(() => undefined)
    const credentials = parseLoginRequest(requestBody)

    if (!credentials) {
      return validationErrorResponse([
        { field: 'email', code: 'invalid_credentials', message: 'Informe e-mail e senha.' },
      ])
    }

    const passwordDigest = await hashMockPassword(credentials.password)
    const state = mockDatabase.read()
    const user = state.users.find(
      (candidate) =>
        candidate.normalizedEmail === credentials.email &&
        candidate.passwordDigest === passwordDigest,
    )

    if (!user) {
      return HttpResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'E-mail ou senha incorretos.',
            retryable: false,
          },
        },
        { status: 401 },
      )
    }

    const expiresAt = '9999-12-31T23:59:59.999Z'
    const sessionToken = `mock-session-${user.id}-${state.revision + 1}`
    state.sessions.push({ id: sessionToken, userId: user.id, expiresAt })
    state.revision += 1
    mockDatabase.write(state)

    const response: LoginResponse = {
      user: toSessionUser(user),
      sessionToken,
      expiresAt,
    }

    return HttpResponse.json(response)
  }),

  http.get('*/api/auth/session', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('auth')
    if (scenarioResponse) return scenarioResponse

    const sessionToken = getBearerToken(request)
    const state = mockDatabase.read()
    const session = state.sessions.find((candidate) => candidate.id === sessionToken)
    const expiredByScenario = getActiveScenario().flags.sessionExpired
    const expiredByTime = session ? Date.parse(session.expiresAt) <= Date.now() : false

    if (!session || expiredByScenario || expiredByTime) {
      if (session) {
        state.sessions = state.sessions.filter((candidate) => candidate.id !== session.id)
        state.revision += 1
        mockDatabase.write(state)
      }

      return HttpResponse.json<ApiErrorResponse>(
        {
          error: {
            code: session ? 'SESSION_EXPIRED' : 'UNAUTHORIZED',
            message: session ? 'Sua sessão expirou.' : 'Autenticação necessária.',
            retryable: false,
          },
        },
        { status: 401 },
      )
    }

    const user = state.users.find((candidate) => candidate.id === session.userId)

    if (!user) {
      return HttpResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'A sessão não pertence a um usuário válido.',
            retryable: false,
          },
        },
        { status: 401 },
      )
    }

    const response: SessionResponse = {
      user: toSessionUser(user),
      expiresAt: session.expiresAt,
    }

    return HttpResponse.json(response)
  }),

  http.post('*/api/auth/logout', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('auth')
    if (scenarioResponse) return scenarioResponse

    const sessionToken = getBearerToken(request)
    const state = mockDatabase.read()
    const nextSessions = state.sessions.filter((session) => session.id !== sessionToken)

    if (nextSessions.length !== state.sessions.length) {
      state.sessions = nextSessions
      state.revision += 1
      mockDatabase.write(state)
    }

    const response: LogoutResponse = { success: true }
    return HttpResponse.json(response)
  }),

  http.post('*/api/auth/register', async ({ request }) => {
    const scenarioResponse = await applyNetworkScenario('auth')
    if (scenarioResponse) return scenarioResponse

    const requestBody: unknown = await request.json().catch(() => undefined)
    const registration = parseRegisterRequest(requestBody)

    if (!registration) {
      return validationErrorResponse([
        {
          field: 'form',
          code: 'invalid_payload',
          message: 'O corpo da requisição é inválido.',
        },
      ])
    }

    const validationErrors = validateRegistration({
      ...registration,
      confirmPassword: registration.password,
    })

    if (Object.keys(validationErrors).length > 0) {
      return validationErrorResponse(
        Object.entries(validationErrors).map(([field, message]) => ({
          field,
          code: 'invalid_value',
          message,
        })),
      )
    }

    if (getActiveScenario().flags.registrationConflict) {
      return conflictResponse(['email', 'username'])
    }

    const passwordDigest = await hashMockPassword(registration.password)
    const state = mockDatabase.read()
    const conflictingFields: Array<'email' | 'username'> = []

    if (state.users.some((user) => user.normalizedEmail === registration.email)) {
      conflictingFields.push('email')
    }

    if (
      state.users.some(
        (user) => user.username.toLowerCase() === registration.username.toLowerCase(),
      )
    ) {
      conflictingFields.push('username')
    }

    if (conflictingFields.length > 0) {
      return conflictResponse(conflictingFields)
    }

    const createdAt = new Date().toISOString()
    const userId = `user-collector-${String(state.users.length + 1).padStart(2, '0')}`
    const user: MockUserRecord = {
      id: userId,
      username: registration.username,
      displayName: registration.username,
      email: registration.email,
      normalizedEmail: registration.email,
      avatarUrl: null,
      passwordDigest,
      createdAt,
    }

    state.users.push(user)
    state.profilesByUser[userId] = {
      userId,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: '',
      walletNickname: '',
      avatarUrl: null,
      version: 1,
      updatedAt: createdAt,
    }
    state.walletsByUser[userId] = []
    state.favoritesByUser[userId] = { nftIds: [], version: 1 }
    state.carts.push({
      id: `cart-${userId}`,
      userId,
      visitorId: null,
      items: [],
      version: 1,
      updatedAt: createdAt,
    })
    const expiresAt = '9999-12-31T23:59:59.999Z'
    const sessionToken = `mock-session-${user.id}-${state.revision + 1}`
    state.sessions.push({ id: sessionToken, userId: user.id, expiresAt })
    state.revision += 1
    mockDatabase.write(state)

    const response: RegisterResponse = {
      user: toSessionUser(user),
      createdAt,
      sessionToken,
      expiresAt,
    }

    return HttpResponse.json(response, { status: 201 })
  }),
]
