import { http, HttpResponse } from 'msw'

import { validateRegistration } from '@/features/auth/registration/registration-validation'
import type {
  ApiErrorResponse,
  RegisterRequest,
  RegisterResponse,
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
    state.revision += 1
    mockDatabase.write(state)

    const response: RegisterResponse = {
      user: toSessionUser(user),
      createdAt,
    }

    return HttpResponse.json(response, { status: 201 })
  }),
]
