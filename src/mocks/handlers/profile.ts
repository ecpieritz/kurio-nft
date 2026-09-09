import {
  http,
  HttpResponse,
} from 'msw'

import type {
  ApiErrorResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CollectorProfile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/lib/api/contracts'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { hashMockPassword } from '@/mocks/auth/password'
import { mockDatabase } from '@/mocks/database/database'
import { applyNetworkScenario } from '@/mocks/scenarios/network'

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const usernamePattern =
  /^[a-zA-Z0-9_]+$/

const avatarDataUrlPattern =
  /^data:image\/(?:png|jpeg|webp);base64,/i

const MAX_AVATAR_DATA_URL_LENGTH =
  3_000_000

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      'object' &&
    value !== null
  )
}

function parseUpdateProfileRequest(
  value: unknown,
):
  | UpdateProfileRequest
  | undefined {
  if (
    !isRecord(value) ||
    typeof value.displayName !==
      'string' ||
    typeof value.username !==
      'string' ||
    typeof value.email !==
      'string' ||
    typeof value.ensName !==
      'string' ||
    typeof value.walletNickname !==
      'string' ||
    typeof value.expectedVersion !==
      'number' ||
    !Number.isInteger(
      value.expectedVersion,
    )
  ) {
    return undefined
  }

  return {
    displayName:
      value.displayName.trim(),

    username:
      value.username.trim(),

    email:
      value.email
        .trim()
        .toLowerCase(),

    ensName:
      value.ensName.trim(),

    walletNickname:
      value.walletNickname.trim(),

    expectedVersion:
      value.expectedVersion,
  }
}

function parseUpdateAvatarRequest(
  value: unknown,
):
  | UpdateAvatarRequest
  | undefined {
  if (
    !isRecord(value) ||
    (
      value.avatarDataUrl !==
        null &&
      typeof value.avatarDataUrl !==
        'string'
    ) ||
    typeof value.expectedVersion !==
      'number' ||
    !Number.isInteger(
      value.expectedVersion,
    )
  ) {
    return undefined
  }

  return {
    avatarDataUrl:
      value.avatarDataUrl,

    expectedVersion:
      value.expectedVersion,
  }
}

function parseChangePasswordRequest(
  value: unknown,
):
  | ChangePasswordRequest
  | undefined {
  if (
    !isRecord(value) ||
    typeof value.currentPassword !==
      'string' ||
    typeof value.newPassword !==
      'string'
  ) {
    return undefined
  }

  return {
    currentPassword:
      value.currentPassword,

    newPassword:
      value.newPassword,
  }
}

function errorResponse(
  code:
    ApiErrorResponse['error']['code'],
  message: string,
  status: number,
  fieldErrors?:
    NonNullable<
      ApiErrorResponse['error']['fieldErrors']
    >,
  details?: Record<
    string,
    unknown
  >,
): HttpResponse<ApiErrorResponse> {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        retryable:
          false,

        fieldErrors,
        details,
      },
    },
    {
      status,
    },
  )
}

function validateProfileRequest(
  request:
    UpdateProfileRequest,
): HttpResponse<ApiErrorResponse> | null {
  const fieldErrors:
    NonNullable<
      ApiErrorResponse['error']['fieldErrors']
    > = []

  if (
    !request.displayName
  ) {
    fieldErrors.push({
      field:
        'displayName',

      code:
        'required',

      message:
        'Informe o nome de exibição.',
    })
  } else if (
    request.displayName.length >
    60
  ) {
    fieldErrors.push({
      field:
        'displayName',

      code:
        'too_long',

      message:
        'Use no máximo 60 caracteres.',
    })
  }

  if (
    !request.username
  ) {
    fieldErrors.push({
      field:
        'username',

      code:
        'required',

      message:
        'Informe o nome de usuário.',
    })
  } else if (
    request.username.length <
      3 ||
    request.username.length >
      24
  ) {
    fieldErrors.push({
      field:
        'username',

      code:
        'invalid_length',

      message:
        'Use entre 3 e 24 caracteres.',
    })
  } else if (
    !usernamePattern.test(
      request.username,
    )
  ) {
    fieldErrors.push({
      field:
        'username',

      code:
        'invalid_format',

      message:
        'Use apenas letras, números e sublinhado.',
    })
  }

  if (
    !request.email
  ) {
    fieldErrors.push({
      field:
        'email',

      code:
        'required',

      message:
        'Informe seu e-mail.',
    })
  } else if (
    !emailPattern.test(
      request.email,
    )
  ) {
    fieldErrors.push({
      field:
        'email',

      code:
        'invalid_format',

      message:
        'Digite um e-mail válido.',
    })
  }

  if (
    request.ensName &&
    !request.ensName
      .toLowerCase()
      .endsWith(
        '.eth',
      )
  ) {
    fieldErrors.push({
      field:
        'ensName',

      code:
        'invalid_format',

      message:
        'O nome ENS deve terminar em .eth.',
    })
  }

  if (
    !request.walletNickname
  ) {
    fieldErrors.push({
      field:
        'walletNickname',

      code:
        'required',

      message:
        'Informe o apelido da carteira.',
    })
  } else if (
    request.walletNickname
      .length > 40
  ) {
    fieldErrors.push({
      field:
        'walletNickname',

      code:
        'too_long',

      message:
        'Use no máximo 40 caracteres.',
    })
  }

  if (
    fieldErrors.length ===
    0
  ) {
    return null
  }

  return errorResponse(
    'VALIDATION_ERROR',
    'Revise os dados do perfil.',
    422,
    fieldErrors,
  )
}

function validateNewPassword(
  newPassword: string,
): string | null {
  if (
    newPassword.length <
    8
  ) {
    return 'A nova senha deve ter pelo menos 8 caracteres.'
  }

  if (
    !/[a-z]/.test(
      newPassword,
    ) ||
    !/[A-Z]/.test(
      newPassword,
    ) ||
    !/\d/.test(
      newPassword,
    ) ||
    !/[^a-zA-Z0-9]/.test(
      newPassword,
    )
  ) {
    return 'A nova senha deve incluir letra maiúscula, minúscula, número e símbolo.'
  }

  return null
}

function findProfile(
  profilesByUser:
    Record<
      string,
      CollectorProfile
    >,
  userId: string,
): CollectorProfile | undefined {
  return profilesByUser[
    userId
  ]
}

export const profileHandlers = [
  http.get(
    '*/api/profile',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'profile',
        )

      if (
        scenarioResponse
      ) {
        return scenarioResponse
      }

      const authorization =
        authorizeMockRequest(
          request,
        )

      if (
        !authorization.authorized
      ) {
        return authorization.response
      }

      const profile =
        findProfile(
          authorization
            .state
            .profilesByUser,

          authorization
            .userId,
        )

      if (!profile) {
        return errorResponse(
          'NOT_FOUND',
          'Perfil não encontrado.',
          404,
        )
      }

      return HttpResponse.json(
        structuredClone(
          profile,
        ),
      )
    },
  ),

  http.patch(
    '*/api/profile',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'profile',
        )

      if (
        scenarioResponse
      ) {
        return scenarioResponse
      }

      const authorization =
        authorizeMockRequest(
          request,
        )

      if (
        !authorization.authorized
      ) {
        return authorization.response
      }

      const body:
        unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseUpdateProfileRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados do perfil são inválidos.',
          422,
        )
      }

      const validationResponse =
        validateProfileRequest(
          payload,
        )

      if (
        validationResponse
      ) {
        return validationResponse
      }

      const state =
        authorization.state

      const profile =
        findProfile(
          state.profilesByUser,
          authorization.userId,
        )

      const user =
        state.users.find(
          (
            candidate,
          ) =>
            candidate.id ===
            authorization.userId,
        )

      if (
        !profile ||
        !user
      ) {
        return errorResponse(
          'NOT_FOUND',
          'Perfil não encontrado.',
          404,
        )
      }

      if (
        payload.expectedVersion !==
        profile.version
      ) {
        return errorResponse(
          'CONFLICT',
          'O perfil foi atualizado por outra operação.',
          409,
          undefined,
          {
            expectedVersion:
              payload.expectedVersion,

            currentVersion:
              profile.version,
          },
        )
      }

      const conflictingFields:
        NonNullable<
          ApiErrorResponse['error']['fieldErrors']
        > = []

      if (
        state.users.some(
          (
            candidate,
          ) =>
            candidate.id !==
              user.id &&
            candidate.normalizedEmail ===
              payload.email,
        )
      ) {
        conflictingFields.push({
          field:
            'email',

          code:
            'email_already_exists',

          message:
            'Este e-mail já está cadastrado.',
        })
      }

      if (
        state.users.some(
          (
            candidate,
          ) =>
            candidate.id !==
              user.id &&
            candidate.username.toLowerCase() ===
              payload.username.toLowerCase(),
        )
      ) {
        conflictingFields.push({
          field:
            'username',

          code:
            'username_already_exists',

          message:
            'Este nome de usuário já está em uso.',
        })
      }

      if (
        conflictingFields.length >
        0
      ) {
        return errorResponse(
          'CONFLICT',
          'Não foi possível atualizar o perfil com esses dados.',
          409,
          conflictingFields,
        )
      }

      const updatedAt =
        new Date().toISOString()

      profile.displayName =
        payload.displayName

      profile.username =
        payload.username

      profile.email =
        payload.email

      profile.ensName =
        payload.ensName

      profile.walletNickname =
        payload.walletNickname

      profile.version +=
        1

      profile.updatedAt =
        updatedAt

      user.displayName =
        payload.displayName

      user.username =
        payload.username

      user.email =
        payload.email

      user.normalizedEmail =
        payload.email

      const primaryWallet =
        state.walletsByUser[
          authorization.userId
        ]?.find(
          (
            wallet,
          ) =>
            wallet.primary,
        )

      if (
        primaryWallet &&
        primaryWallet.nickname !==
          payload.walletNickname
      ) {
        primaryWallet.nickname =
          payload.walletNickname

        primaryWallet.version +=
          1

        primaryWallet.updatedAt =
          updatedAt
      }

      state.revision +=
        1

      mockDatabase.write(
        state,
      )

      return HttpResponse.json(
        structuredClone(
          profile,
        ),
      )
    },
  ),

  http.patch(
    '*/api/profile/avatar',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'profile',
        )

      if (
        scenarioResponse
      ) {
        return scenarioResponse
      }

      const authorization =
        authorizeMockRequest(
          request,
        )

      if (
        !authorization.authorized
      ) {
        return authorization.response
      }

      const body:
        unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseUpdateAvatarRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados do avatar são inválidos.',
          422,
        )
      }

      if (
        payload.avatarDataUrl !==
          null &&
        (
          !avatarDataUrlPattern.test(
            payload.avatarDataUrl,
          ) ||
          payload.avatarDataUrl.length >
            MAX_AVATAR_DATA_URL_LENGTH
        )
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Use uma imagem PNG, JPEG ou WebP de até 2 MB.',
          422,
          [
            {
              field:
                'avatarDataUrl',

              code:
                'invalid_avatar',

              message:
                'Use uma imagem PNG, JPEG ou WebP de até 2 MB.',
            },
          ],
        )
      }

      const state =
        authorization.state

      const profile =
        findProfile(
          state.profilesByUser,
          authorization.userId,
        )

      const user =
        state.users.find(
          (
            candidate,
          ) =>
            candidate.id ===
            authorization.userId,
        )

      if (
        !profile ||
        !user
      ) {
        return errorResponse(
          'NOT_FOUND',
          'Perfil não encontrado.',
          404,
        )
      }

      if (
        payload.expectedVersion !==
        profile.version
      ) {
        return errorResponse(
          'CONFLICT',
          'O perfil foi atualizado por outra operação.',
          409,
          undefined,
          {
            expectedVersion:
              payload.expectedVersion,

            currentVersion:
              profile.version,
          },
        )
      }

      const updatedAt =
        new Date().toISOString()

      profile.avatarUrl =
        payload.avatarDataUrl

      profile.version +=
        1

      profile.updatedAt =
        updatedAt

      user.avatarUrl =
        payload.avatarDataUrl

      state.revision +=
        1

      mockDatabase.write(
        state,
      )

      return HttpResponse.json(
        structuredClone(
          profile,
        ),
      )
    },
  ),

  http.patch(
    '*/api/profile/password',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'profile',
        )

      if (
        scenarioResponse
      ) {
        return scenarioResponse
      }

      const authorization =
        authorizeMockRequest(
          request,
        )

      if (
        !authorization.authorized
      ) {
        return authorization.response
      }

      const body:
        unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseChangePasswordRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados da senha são inválidos.',
          422,
        )
      }

      const passwordValidation =
        validateNewPassword(
          payload.newPassword,
        )

      if (
        passwordValidation
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          passwordValidation,
          422,
          [
            {
              field:
                'newPassword',

              code:
                'invalid_password',

              message:
                passwordValidation,
            },
          ],
        )
      }

      if (
        payload.currentPassword ===
        payload.newPassword
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A nova senha deve ser diferente da senha atual.',
          422,
          [
            {
              field:
                'newPassword',

              code:
                'same_password',

              message:
                'A nova senha deve ser diferente da senha atual.',
            },
          ],
        )
      }

      const state =
        authorization.state

      const user =
        state.users.find(
          (
            candidate,
          ) =>
            candidate.id ===
            authorization.userId,
        )

      if (!user) {
        return errorResponse(
          'NOT_FOUND',
          'Usuário não encontrado.',
          404,
        )
      }

      const currentPasswordDigest =
        await hashMockPassword(
          payload.currentPassword,
        )

      if (
        currentPasswordDigest !==
        user.passwordDigest
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A senha atual está incorreta.',
          422,
          [
            {
              field:
                'currentPassword',

              code:
                'incorrect_password',

              message:
                'A senha atual está incorreta.',
            },
          ],
        )
      }

      user.passwordDigest =
        await hashMockPassword(
          payload.newPassword,
        )

      const changedAt =
        new Date().toISOString()

      state.revision +=
        1

      mockDatabase.write(
        state,
      )

      const response:
        ChangePasswordResponse = {
          changedAt,
        }

      return HttpResponse.json(
        response,
      )
    },
  ),
]