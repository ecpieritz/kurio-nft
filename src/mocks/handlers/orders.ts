import {
  http,
  HttpResponse,
} from 'msw'

import type {
  ApiErrorResponse,
  BlockchainNetwork,
  CollectorCheckoutDetails,
  CreateOrderRequest,
  Order,
  OrderItemSnapshot,
  OrderReceipt,
} from '@/lib/api/contracts'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { mockDatabase } from '@/mocks/database/database'
import type {
  MockDatabaseState,
  MockOrderSnapshotRecord,
} from '@/mocks/database/types'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

const ORDER_CONFIRMATION_DELAY_MS =
  900

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

function parseCollector(
  value: unknown,
):
  | CollectorCheckoutDetails
  | undefined {
  if (
    !isRecord(value) ||
    typeof value.displayName !==
      'string' ||
    typeof value.username !==
      'string' ||
    typeof value.email !==
      'string' ||
    typeof value.profileName !==
      'string' ||
    typeof value.ensName !==
      'string'
  ) {
    return undefined
  }

  if (
    value.note !==
      undefined &&
    typeof value.note !==
      'string'
  ) {
    return undefined
  }

  return {
    displayName:
      value.displayName,

    username:
      value.username,

    email:
      value.email,

    profileName:
      value.profileName,

    ensName:
      value.ensName,

    note:
      value.note,
  }
}

function parseCreateOrderRequest(
  value: unknown,
):
  | CreateOrderRequest
  | undefined {
  if (
    !isRecord(value) ||
    typeof value.quoteId !==
      'string' ||
    typeof value.walletId !==
      'string' ||
    !isNetwork(
      value.network,
    )
  ) {
    return undefined
  }

  const collector =
    parseCollector(
      value.collector,
    )

  if (!collector) {
    return undefined
  }

  return {
    quoteId:
      value.quoteId,

    walletId:
      value.walletId,

    network:
      value.network,

    collector,
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

function validateCollector(
  collector:
    CollectorCheckoutDetails,
): HttpResponse<ApiErrorResponse> | null {
  if (
    !collector.displayName.trim() ||
    !collector.username.trim() ||
    !collector.email.trim() ||
    !collector.profileName.trim()
  ) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Preencha os dados obrigatórios do colecionador.',
      422,
    )
  }

  if (
    !collector.email.includes(
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

function requestFingerprint(
  request:
    CreateOrderRequest,
): string {
  return JSON.stringify({
    quoteId:
      request.quoteId,

    walletId:
      request.walletId,

    network:
      request.network,

    collector: {
      displayName:
        request.collector.displayName.trim(),

      username:
        request.collector.username.trim(),

      email:
        request.collector.email
          .trim()
          .toLowerCase(),

      profileName:
        request.collector.profileName.trim(),

      ensName:
        request.collector.ensName.trim(),

      note:
        request.collector.note
          ?.trim() ??
        '',
    },
  })
}

function validateQuoteSnapshot(
  state:
    MockDatabaseState,
  quoteId: string,
  userId: string,
): HttpResponse<ApiErrorResponse> | null {
  const quote =
    state.quotes.find(
      (
        candidate,
      ) =>
        candidate.id ===
        quoteId,
    )

  if (!quote) {
    return errorResponse(
      'NOT_FOUND',
      'Cotação não encontrada.',
      404,
    )
  }

  if (
    Date.parse(
      quote.expiresAt,
    ) <= Date.now()
  ) {
    return errorResponse(
      'CONFLICT',
      'A cotação expirou. Atualize os valores antes de confirmar a compra.',
      409,
      {
        reason:
          'QUOTE_EXPIRED',
      },
    )
  }

  const cart =
    state.carts.find(
      (
        candidate,
      ) =>
        candidate.id ===
        quote.cartId,
    )

  if (
    !cart ||
    cart.userId !==
      userId
  ) {
    return errorResponse(
      'FORBIDDEN',
      'A cotação não pertence ao colecionador atual.',
      403,
    )
  }

  if (
    cart.version !==
      quote.cartVersion
  ) {
    return errorResponse(
      'CONFLICT',
      'O carrinho mudou depois da cotação. Revise a compra antes de confirmar.',
      409,
      {
        reason:
          'CART_CHANGED',

        quotedVersion:
          quote.cartVersion,

        currentVersion:
          cart.version,
      },
    )
  }

  for (
    const quoteItem
    of quote.items
  ) {
    const cartItem =
      cart.items.find(
        (
          candidate,
        ) =>
          candidate.id ===
          quoteItem.cartItemId,
      )

    if (
      !cartItem ||
      cartItem.quantity !==
        quoteItem.quantity
    ) {
      return errorResponse(
        'CONFLICT',
        'Os itens do carrinho mudaram depois da cotação.',
        409,
        {
          reason:
            'CART_ITEM_CHANGED',

          cartItemId:
            quoteItem.cartItemId,
        },
      )
    }

    const nft =
      state.nfts.find(
        (
          candidate,
        ) =>
          candidate.id ===
          quoteItem.nftId,
      )

    const edition =
      nft?.editions.find(
        (
          candidate,
        ) =>
          candidate.id ===
          quoteItem.editionId,
      )

    if (
      !nft ||
      !edition
    ) {
      return errorResponse(
        'AVAILABILITY_CONFLICT',
        'Um NFT da cotação não está mais disponível.',
        409,
        {
          reason:
            'NFT_UNAVAILABLE',

          nftId:
            quoteItem.nftId,
        },
      )
    }

    if (
      nft.version !==
        quoteItem.nftVersion ||
      nft.priceEth !==
        quoteItem.unitPriceEth
    ) {
      return errorResponse(
        'AVAILABILITY_CONFLICT',
        'O preço de um NFT foi atualizado. Gere uma nova cotação antes de confirmar.',
        409,
        {
          reason:
            'NFT_CHANGED',

          nftId:
            nft.id,

          quotedVersion:
            quoteItem.nftVersion,

          currentVersion:
            nft.version,
        },
      )
    }

    if (
      !edition.purchasable ||
      quoteItem.quantity >
        edition.availableQuantity
    ) {
      return errorResponse(
        'AVAILABILITY_CONFLICT',
        'A disponibilidade de uma edição mudou. Gere uma nova cotação antes de confirmar.',
        409,
        {
          reason:
            'EDITION_CHANGED',

          nftId:
            nft.id,

          editionId:
            edition.id,

          requestedQuantity:
            quoteItem.quantity,

          availableQuantity:
            edition.availableQuantity,
        },
      )
    }
  }

  return null
}

function createOrderSnapshot(
  state:
    MockDatabaseState,
  orderId: string,
  quoteId: string,
  walletId: string,
): MockOrderSnapshotRecord | null {
  const quote =
    state.quotes.find(
      (
        candidate,
      ) =>
        candidate.id ===
        quoteId,
    )

  if (!quote) {
    return null
  }

  const cart =
    state.carts.find(
      (
        candidate,
      ) =>
        candidate.id ===
        quote.cartId,
    )

  if (!cart) {
    return null
  }

  const wallet =
    Object.values(
      state.walletsByUser,
    )
      .flat()
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          walletId,
      )

  if (!wallet) {
    return null
  }

  const items:
    OrderItemSnapshot[] =
    []

  for (
    const quoteItem
    of quote.items
  ) {
    const cartItem =
      cart.items.find(
        (
          candidate,
        ) =>
          candidate.id ===
          quoteItem.cartItemId,
      )

    if (!cartItem) {
      return null
    }

    items.push({
      nftId:
        quoteItem.nftId,

      editionId:
        quoteItem.editionId,

      tokenId:
        cartItem.tokenId,

      name:
        cartItem.name,

      image:
        structuredClone(
          cartItem.image,
        ),

      quantity:
        quoteItem.quantity,

      unitPriceEth:
        quoteItem.unitPriceEth,

      subtotalEth:
        quoteItem.subtotalEth,
    })
  }

  return {
    orderId,

    cartId:
      cart.id,

    network:
      quote.network,

    walletAddress:
      wallet.address,

    walletProvider:
      wallet.provider,

    items,

    subtotalEth:
      quote.subtotalEth,

    discountEth:
      quote.discountEth,

    networkFeeEth:
      quote.networkFeeEth,

    totalEth:
      quote.totalEth,
  }
}

function createTransactionReference(
  orderId: string,
): `0x${string}` {
  let hash =
    2_166_136_261

  for (
    const character
    of orderId
  ) {
    hash ^=
      character.charCodeAt(
        0,
      )

    hash =
      Math.imul(
        hash,
        16_777_619,
      )
  }

  const segment =
    (hash >>> 0)
      .toString(16)
      .padStart(
        8,
        '0',
      )

  return `0x${segment.repeat(
    8,
  )}`
}

function createExplorerUrl(
  network:
    BlockchainNetwork,
  transactionReference:
    string,
): string {
  if (
    network ===
    'polygon'
  ) {
    return `https://polygonscan.com/tx/${encodeURIComponent(
      transactionReference,
    )}`
  }

  if (
    network ===
    'solana'
  ) {
    return `https://solscan.io/tx/${encodeURIComponent(
      transactionReference,
    )}`
  }

  return `https://etherscan.io/tx/${encodeURIComponent(
    transactionReference,
  )}`
}

function consumePurchasedItems(
  state:
    MockDatabaseState,
  snapshot:
    MockOrderSnapshotRecord,
): void {
  for (
    const item
    of snapshot.items
  ) {
    const nft =
      state.nfts.find(
        (
          candidate,
        ) =>
          candidate.id ===
          item.nftId,
      )

    const edition =
      nft?.editions.find(
        (
          candidate,
        ) =>
          candidate.id ===
          item.editionId,
      )

    if (
      !nft ||
      !edition
    ) {
      continue
    }

    edition.availableQuantity =
      Math.max(
        0,

        edition.availableQuantity -
          item.quantity,
      )

    const nextMinted =
      edition.minted +
      item.quantity

    edition.minted =
      edition.supply === null
        ? nextMinted
        : Math.min(
            edition.supply,
            nextMinted,
          )

    edition.purchasable =
      edition.availableQuantity >
      0

    nft.availableQuantity =
      nft.editions.reduce(
        (
          highest,
          candidate,
        ) =>
          Math.max(
            highest,

            candidate.availableQuantity,
          ),

        0,
      )

    nft.version += 1
  }

  const cart =
    state.carts.find(
      (
        candidate,
      ) =>
        candidate.id ===
        snapshot.cartId,
    )

  if (cart) {
    cart.items = []

    cart.version +=
      1

    cart.updatedAt =
      new Date().toISOString()
  }
}

function confirmOrder(
  state:
    MockDatabaseState,
  order: Order,
  snapshot:
    MockOrderSnapshotRecord,
): void {
  if (
    order.status !==
      'pending' ||
    order.receipt
  ) {
    return
  }

  const confirmedAt =
    new Date().toISOString()

  const transactionReference =
    createTransactionReference(
      order.id,
    )

  const receipt:
    OrderReceipt = {
      transactionReference,

      explorerUrl:
        createExplorerUrl(
          snapshot.network,
          transactionReference,
        ),

      walletAddress:
        snapshot.walletAddress,

      walletProvider:
        snapshot.walletProvider,

      confirmedAt,

      items:
        structuredClone(
          snapshot.items,
        ),

      subtotalEth:
        snapshot.subtotalEth,

      discountEth:
        snapshot.discountEth,

      networkFeeEth:
        snapshot.networkFeeEth,

      totalEth:
        snapshot.totalEth,
    }

  consumePurchasedItems(
    state,
    snapshot,
  )

  order.status =
    'confirmed'

  order.receipt =
    receipt

  order.declineReason =
    undefined

  order.version += 1

  order.updatedAt =
    confirmedAt
}

function declineOrder(
  order: Order,
): void {
  if (
    order.status !==
    'pending'
  ) {
    return
  }

  const declinedAt =
    new Date().toISOString()

  order.status =
    'declined'

  order.receipt =
    null

  order.declineReason =
    'A carteira simulada recusou a confirmação da compra.'

  order.version += 1

  order.updatedAt =
    declinedAt
}

function maybeFinalizeOrder(
  state:
    MockDatabaseState,
  order: Order,
): boolean {
  if (
    order.status !==
    'pending'
  ) {
    return false
  }

  const createdAtMs =
    Date.parse(
      order.createdAt,
    )

  if (
    Number.isFinite(
      createdAtMs,
    ) &&
    Date.now() -
      createdAtMs <
      ORDER_CONFIRMATION_DELAY_MS
  ) {
    return false
  }

  const outcome =
    getActiveScenario()
      .flags
      .paymentOutcome ??
    'confirmed'

  if (
    outcome ===
    'declined'
  ) {
    declineOrder(
      order,
    )

    return true
  }

  const snapshot =
    state.idempotencyRecords.find(
      (
        candidate,
      ) =>
        candidate.orderId ===
        order.id,
    )?.orderSnapshot

  if (!snapshot) {
    declineOrder(
      order,
    )

    order.declineReason =
      'Não foi possível recuperar o snapshot imutável desta compra.'

    return true
  }

  confirmOrder(
    state,
    order,
    snapshot,
  )

  return true
}

function persistIfChanged(
  state:
    MockDatabaseState,
  changed: boolean,
): void {
  if (!changed) {
    return
  }

  state.revision +=
    1

  mockDatabase.write(
    state,
  )
}

export const orderHandlers = [
  http.post(
    '*/api/orders',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'orders',
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

      const idempotencyKey =
        request.headers
          .get(
            'Idempotency-Key',
          )
          ?.trim()

      if (!idempotencyKey) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A confirmação da compra precisa de uma chave de idempotência.',
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
        parseCreateOrderRequest(
          body,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados da compra são inválidos.',
          422,
        )
      }

      const collectorValidation =
        validateCollector(
          payload.collector,
        )

      if (
        collectorValidation
      ) {
        return collectorValidation
      }

      const fingerprint =
        requestFingerprint(
          payload,
        )

      const previousIdempotencyRecord =
        authorization
          .state
          .idempotencyRecords
          .find(
            (
              record,
            ) =>
              record.userId ===
                authorization.userId &&
              record.key ===
                idempotencyKey,
          )

      if (
        previousIdempotencyRecord
      ) {
        if (
          previousIdempotencyRecord
            .requestFingerprint !==
          fingerprint
        ) {
          return errorResponse(
            'IDEMPOTENCY_CONFLICT',
            'Esta tentativa de compra já foi usada com outros dados.',
            409,
          )
        }

        const existingOrder =
          authorization
            .state
            .orders
            .find(
              (
                order,
              ) =>
                order.id ===
                previousIdempotencyRecord
                  .orderId,
            )

        if (
          !existingOrder
        ) {
          return errorResponse(
            'INTERNAL_ERROR',
            'A tentativa idempotente existe, mas o pedido não pôde ser recuperado.',
            500,
          )
        }

        const finalized =
          maybeFinalizeOrder(
            authorization.state,
            existingOrder,
          )

        persistIfChanged(
          authorization.state,
          finalized,
        )

        return HttpResponse.json(
          structuredClone(
            existingOrder,
          ),
        )
      }

      const quote =
        authorization
          .state
          .quotes
          .find(
            (
              candidate,
            ) =>
              candidate.id ===
              payload.quoteId,
          )

      if (!quote) {
        return errorResponse(
          'NOT_FOUND',
          'Cotação não encontrada.',
          404,
        )
      }

      const wallet =
        (
          authorization
            .state
            .walletsByUser[
            authorization
              .userId
          ] ?? []
        ).find(
          (
            candidate,
          ) =>
            candidate.id ===
            payload.walletId,
        )

      if (!wallet) {
        return errorResponse(
          'NOT_FOUND',
          'Carteira não encontrada.',
          404,
        )
      }

      if (
        wallet.network !==
          payload.network ||
        quote.network !==
          payload.network
      ) {
        return errorResponse(
          'CONFLICT',
          'A rede da carteira não corresponde à rede usada na cotação.',
          409,
          {
            reason:
              'NETWORK_CHANGED',
          },
        )
      }

      const quoteValidation =
        validateQuoteSnapshot(
          authorization.state,
          quote.id,
          authorization.userId,
        )

      if (
        quoteValidation
      ) {
        return quoteValidation
      }

      const now =
        new Date().toISOString()

      const order:
        Order = {
          id: `order-${authorization.userId}-${authorization.state.revision + 1}`,

          userId:
            authorization
              .userId,

          status:
            'pending',

          version: 1,

          createdAt:
            now,

          updatedAt:
            now,

          receipt:
            null,
        }

      const snapshot =
        createOrderSnapshot(
          authorization.state,
          order.id,
          payload.quoteId,
          payload.walletId,
        )

      if (!snapshot) {
        return errorResponse(
          'INTERNAL_ERROR',
          'Não foi possível criar o snapshot imutável da compra.',
          500,
        )
      }

      authorization
        .state
        .orders
        .push(
          order,
        )

      authorization
        .state
        .idempotencyRecords
        .push({
          key:
            idempotencyKey,

          userId:
            authorization
              .userId,

          requestFingerprint:
            fingerprint,

          orderId:
            order.id,

          orderSnapshot:
            snapshot,
        })

      authorization
        .state
        .revision += 1

      mockDatabase.write(
        authorization.state,
      )

      if (
        getActiveScenario()
          .flags
          .timeoutAfterOrderCreation
      ) {
        await new Promise<never>(
          () => undefined,
        )
      }

      return HttpResponse.json(
        structuredClone(
          order,
        ),
        {
          status: 201,
        },
      )
    },
  ),

  http.get(
    '*/api/orders/recovery/:idempotencyKey',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'orders',
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

      const idempotencyKey =
        typeof params.idempotencyKey ===
        'string'
          ? params.idempotencyKey
          : undefined

      if (!idempotencyKey) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A chave de recuperação é inválida.',
          422,
        )
      }

      const record =
        authorization
          .state
          .idempotencyRecords
          .find(
            (
              candidate,
            ) =>
              candidate.userId ===
                authorization.userId &&
              candidate.key ===
                idempotencyKey,
          )

      if (!record) {
        return errorResponse(
          'NOT_FOUND',
          'Nenhum pedido pendente foi encontrado.',
          404,
        )
      }

      const order =
        authorization
          .state
          .orders
          .find(
            (
              candidate,
            ) =>
              candidate.id ===
              record.orderId,
          )

      if (!order) {
        return errorResponse(
          'NOT_FOUND',
          'O pedido associado não foi encontrado.',
          404,
        )
      }

      const finalized =
        maybeFinalizeOrder(
          authorization.state,
          order,
        )

      persistIfChanged(
        authorization.state,
        finalized,
      )

      return HttpResponse.json(
        structuredClone(
          order,
        ),
      )
    },
  ),

  http.get(
    '*/api/orders/:orderId',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'orders',
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

      const orderId =
        typeof params.orderId ===
        'string'
          ? params.orderId
          : undefined

      if (!orderId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'O pedido informado é inválido.',
          422,
        )
      }

      const order =
        authorization
          .state
          .orders
          .find(
            (
              candidate,
            ) =>
              candidate.id ===
                orderId &&
              candidate.userId ===
                authorization.userId,
          )

      if (!order) {
        return errorResponse(
          'NOT_FOUND',
          'Pedido não encontrado.',
          404,
        )
      }

      const finalized =
        maybeFinalizeOrder(
          authorization.state,
          order,
        )

      persistIfChanged(
        authorization.state,
        finalized,
      )

      return HttpResponse.json(
        structuredClone(
          order,
        ),
      )
    },
  ),
]