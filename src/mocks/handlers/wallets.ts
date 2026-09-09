import {
  http,
  HttpResponse,
} from 'msw'

import type {
  ApiErrorResponse,
  BlockchainNetwork,
  CollectorWallet,
  SaveWalletRequest,
  WalletCollection,
  WalletProvider,
} from '@/lib/api/contracts'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { mockDatabase } from '@/mocks/database/database'
import { applyNetworkScenario } from '@/mocks/scenarios/network'

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

function isNetwork(
  value: unknown,
): value is BlockchainNetwork {
  return (
    value ===
      'ethereum' ||
    value ===
      'polygon' ||
    value ===
      'solana'
  )
}

function isProvider(
  value: unknown,
): value is WalletProvider {
  return (
    value ===
      'metamask' ||
    value ===
      'walletconnect' ||
    value ===
      'coinbase'
  )
}

function parseSaveWalletRequest(
  value: unknown,
): SaveWalletRequest | undefined {
  if (
    !isRecord(value) ||
    typeof value.displayName !==
      'string' ||
    typeof value.nickname !==
      'string' ||
    typeof value.profileName !==
      'string' ||
    typeof value.email !==
      'string' ||
    typeof value.address !==
      'string' ||
    typeof value.referralCode !==
      'string' ||
    !isNetwork(
      value.network,
    ) ||
    !isProvider(
      value.provider,
    ) ||
    typeof value.primary !==
      'boolean'
  ) {
    return undefined
  }

  if (
    value.ensName !==
      undefined &&
    typeof value.ensName !==
      'string'
  ) {
    return undefined
  }

  if (
    value.expectedVersion !==
      undefined &&
    (
      typeof value.expectedVersion !==
        'number' ||
      !Number.isInteger(
        value.expectedVersion,
      )
    )
  ) {
    return undefined
  }

  return {
    displayName:
      value.displayName,

    nickname:
      value.nickname,

    profileName:
      value.profileName,

    email:
      value.email,

    address:
      value.address,

    ensName:
      value.ensName,

    referralCode:
      value.referralCode,

    network:
      value.network,

    provider:
      value.provider,

    primary:
      value.primary,

    expectedVersion:
      value.expectedVersion,
  }
}

function errorResponse(
  code:
    ApiErrorResponse['error']['code'],
  message: string,
  status: number,
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
        retryable: false,
        details,
      },
    },

    {
      status,
    },
  )
}

function validateWalletRequest(
  request: SaveWalletRequest,
): HttpResponse<ApiErrorResponse> | null {
  if (
    !request.displayName.trim() ||
    !request.nickname.trim() ||
    !request.profileName.trim() ||
    !request.email.trim() ||
    !request.address.trim()
  ) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Preencha os campos obrigatórios da carteira.',
      422,
    )
  }

  if (
    !request.email.includes(
      '@',
    )
  ) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Informe um e-mail válido.',
      422,
    )
  }

  return null
}

function applyPrimarySelection(
  wallets: CollectorWallet[],
  selectedWalletId: string,
  requestedPrimary: boolean,
): boolean {
  const hasAnotherPrimary =
    wallets.some(
      (
        wallet,
      ) =>
        wallet.id !==
          selectedWalletId &&
        wallet.primary,
    )

  const shouldBePrimary =
    requestedPrimary ||
    !hasAnotherPrimary

  if (
    shouldBePrimary
  ) {
    wallets.forEach(
      (
        wallet,
      ) => {
        wallet.primary =
          wallet.id ===
          selectedWalletId
      },
    )
  }

  return shouldBePrimary
}

export const walletHandlers = [
  http.get(
    '*/api/wallets',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'wallets',
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

      const response: WalletCollection =
        {
          items:
            structuredClone(
              authorization
                .state
                .walletsByUser[
                authorization
                  .userId
              ] ?? [],
            ),
        }

      return HttpResponse.json(
        response,
      )
    },
  ),

  http.post(
    '*/api/wallets',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'wallets',
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

      const body: unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseSaveWalletRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados da carteira são inválidos.',
          422,
        )
      }

      const validationResponse =
        validateWalletRequest(
          payload,
        )

      if (
        validationResponse
      ) {
        return validationResponse
      }

      const wallets =
        authorization
          .state
          .walletsByUser[
          authorization
            .userId
        ] ?? []

      const now =
        new Date().toISOString()

      const wallet:
        CollectorWallet =
        {
          id: `wallet-${authorization.userId}-${authorization.state.revision + 1}`,

          userId:
            authorization
              .userId,

          displayName:
            payload.displayName.trim(),

          nickname:
            payload.nickname.trim(),

          profileName:
            payload.profileName.trim(),

          email:
            payload.email.trim(),

          address:
            payload.address.trim(),

          ensName:
            payload.ensName
              ?.trim() ||
            null,

          referralCode:
            payload.referralCode.trim(),

          network:
            payload.network,

          provider:
            payload.provider,

          primary: false,

          version: 1,

          updatedAt:
            now,
        }

      wallets.push(
        wallet,
      )

      wallet.primary =
        applyPrimarySelection(
          wallets,
          wallet.id,
          payload.primary ||
            wallets.length ===
              1,
        )

      authorization
        .state
        .walletsByUser[
        authorization.userId
      ] = wallets

      authorization
        .state
        .revision += 1

      mockDatabase.write(
        authorization.state,
      )

      return HttpResponse.json(
        structuredClone(
          wallet,
        ),
        {
          status: 201,
        },
      )
    },
  ),

  http.patch(
    '*/api/wallets/:walletId',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'wallets',
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

      const walletId =
        typeof params.walletId ===
        'string'
          ? params.walletId
          : undefined

      if (!walletId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A carteira informada é inválida.',
          422,
        )
      }

      const body: unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseSaveWalletRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados da carteira são inválidos.',
          422,
        )
      }

      const validationResponse =
        validateWalletRequest(
          payload,
        )

      if (
        validationResponse
      ) {
        return validationResponse
      }

      const wallets =
        authorization
          .state
          .walletsByUser[
          authorization
            .userId
        ] ?? []

      const wallet =
        wallets.find(
          (
            candidate,
          ) =>
            candidate.id ===
            walletId,
        )

      if (!wallet) {
        return errorResponse(
          'NOT_FOUND',
          'Carteira não encontrada.',
          404,
        )
      }

      if (
        payload.expectedVersion !==
          undefined &&
        payload.expectedVersion !==
          wallet.version
      ) {
        return errorResponse(
          'CONFLICT',
          'A carteira foi atualizada por outra operação.',
          409,
          {
            expectedVersion:
              payload.expectedVersion,

            currentVersion:
              wallet.version,
          },
        )
      }

      wallet.displayName =
        payload.displayName.trim()

      wallet.nickname =
        payload.nickname.trim()

      wallet.profileName =
        payload.profileName.trim()

      wallet.email =
        payload.email.trim()

      wallet.address =
        payload.address.trim()

      wallet.ensName =
        payload.ensName
          ?.trim() ||
        null

      wallet.referralCode =
        payload.referralCode.trim()

      wallet.network =
        payload.network

      wallet.provider =
        payload.provider

      wallet.primary =
        applyPrimarySelection(
          wallets,
          wallet.id,
          payload.primary,
        )

      wallet.version +=
        1

      wallet.updatedAt =
        new Date().toISOString()

      authorization
        .state
        .walletsByUser[
        authorization.userId
      ] = wallets

      authorization
        .state
        .revision += 1

      mockDatabase.write(
        authorization.state,
      )

      return HttpResponse.json(
        structuredClone(
          wallet,
        ),
      )
    },
  ),
]