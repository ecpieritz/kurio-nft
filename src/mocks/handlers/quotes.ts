import {
  http,
  HttpResponse,
} from 'msw'

import type {
  ApiErrorResponse,
  BlockchainNetwork,
  DecimalString,
  QuoteItem,
  QuoteItemRequest,
  QuoteRequest,
  QuoteResponse,
} from '@/lib/api/contracts'
import {
  addEth,
  multiplyEth,
  percentageOfEth,
  subtractEth,
  sumEth,
} from '@/lib/eth/amount'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { mockDatabase } from '@/mocks/database/database'
import type {
  MockCouponRecord,
  MockDatabaseState,
} from '@/mocks/database/types'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

const VISITOR_HEADER =
  'X-Kurio-Visitor-Id'

const QUOTE_DURATION_MS =
  5 * 60_000

const networkFees: Record<
  BlockchainNetwork,
  DecimalString
> = {
  ethereum: '0.016',
  polygon: '0.004',
  solana: '0.001',
}

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
    value === 'ethereum' ||
    value === 'polygon' ||
    value === 'solana'
  )
}

function parseQuoteItem(
  value: unknown,
): QuoteItemRequest | undefined {
  if (
    !isRecord(value) ||
    typeof value.cartItemId !==
      'string' ||
    typeof value.quantity !==
      'number' ||
    !Number.isInteger(
      value.quantity,
    ) ||
    value.quantity < 1 ||
    typeof value.expectedNftVersion !==
      'number' ||
    !Number.isInteger(
      value.expectedNftVersion,
    ) ||
    value.expectedNftVersion < 1
  ) {
    return undefined
  }

  return {
    cartItemId:
      value.cartItemId,

    quantity:
      value.quantity,

    expectedNftVersion:
      value.expectedNftVersion,
  }
}

function parseQuoteRequest(
  value: unknown,
): QuoteRequest | undefined {
  if (
    !isRecord(value) ||
    typeof value.cartId !==
      'string' ||
    typeof value.expectedCartVersion !==
      'number' ||
    !Number.isInteger(
      value.expectedCartVersion,
    ) ||
    value.expectedCartVersion < 1 ||
    !isNetwork(
      value.network,
    ) ||
    !Array.isArray(
      value.items,
    )
  ) {
    return undefined
  }

  const items =
    value.items.map(
      parseQuoteItem,
    )

  if (
    items.some(
      (
        item,
      ) =>
        item === undefined,
    )
  ) {
    return undefined
  }

  if (
    value.couponCode !==
      undefined &&
    typeof value.couponCode !==
      'string'
  ) {
    return undefined
  }

  return {
    cartId:
      value.cartId,

    expectedCartVersion:
      value.expectedCartVersion,

    network:
      value.network,

    couponCode:
      value.couponCode,

    items:
      items.filter(
        (
          item,
        ): item is QuoteItemRequest =>
          item !== undefined,
      ),
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

function getVisitorId(
  request: Request,
): string | null {
  return (
    request.headers
      .get(
        VISITOR_HEADER,
      )
      ?.trim() ||
    null
  )
}

function canAccessCart(
  request: Request,
  state: MockDatabaseState,
  cartId: string,
):
  | {
      authorized: true
      cart: MockDatabaseState['carts'][number]
    }
  | {
      authorized: false
      response: HttpResponse<ApiErrorResponse>
    } {
  const cart =
    state.carts.find(
      (
        candidate,
      ) =>
        candidate.id ===
        cartId,
    )

  if (!cart) {
    return {
      authorized: false,

      response:
        errorResponse(
          'NOT_FOUND',
          'Carrinho não encontrado.',
          404,
        ),
    }
  }

  if (
    request.headers.has(
      'Authorization',
    )
  ) {
    const authorization =
      authorizeMockRequest(
        request,
      )

    if (
      !authorization.authorized
    ) {
      return {
        authorized: false,
        response:
          authorization.response,
      }
    }

    if (
      cart.userId !==
      authorization.userId
    ) {
      return {
        authorized: false,

        response:
          errorResponse(
            'FORBIDDEN',
            'Este carrinho pertence a outro colecionador.',
            403,
          ),
      }
    }

    return {
      authorized: true,
      cart,
    }
  }

  const visitorId =
    getVisitorId(
      request,
    )

  if (
    !visitorId ||
    cart.userId !== null ||
    cart.visitorId !==
      visitorId
  ) {
    return {
      authorized: false,

      response:
        errorResponse(
          'FORBIDDEN',
          'Este carrinho não pertence ao visitante atual.',
          403,
        ),
    }
  }

  return {
    authorized: true,
    cart,
  }
}

function findCoupon(
  state: MockDatabaseState,
  couponCode: string,
): MockCouponRecord | undefined {
  const normalizedCode =
    couponCode
      .trim()
      .toUpperCase()

  return state.coupons.find(
    (
      coupon,
    ) =>
      coupon.code.toUpperCase() ===
      normalizedCode,
  )
}

function getCouponResult(
  state: MockDatabaseState,
  couponCode:
    | string
    | undefined,
):
  | {
      code: null
      status: 'not-applied'
      discountPercent: 0
    }
  | {
      code: string
      status:
        | 'applied'
        | 'invalid'
        | 'expired'
      discountPercent: number
    } {
  const normalizedCode =
    couponCode
      ?.trim()
      .toUpperCase()

  if (!normalizedCode) {
    return {
      code: null,
      status:
        'not-applied',
      discountPercent: 0,
    }
  }

  const scenario =
    getActiveScenario()

  if (
    scenario.flags
      .invalidCoupon
  ) {
    return {
      code:
        normalizedCode,
      status: 'invalid',
      discountPercent: 0,
    }
  }

  const coupon =
    findCoupon(
      state,
      normalizedCode,
    )

  if (
    !coupon ||
    !coupon.enabled
  ) {
    return {
      code:
        normalizedCode,
      status: 'invalid',
      discountPercent: 0,
    }
  }

  if (
    scenario.flags
      .expiredCoupon ||
    new Date(
      coupon.expiresAt,
    ).getTime() <=
      Date.now()
  ) {
    return {
      code:
        normalizedCode,
      status: 'expired',
      discountPercent: 0,
    }
  }

  return {
    code:
      normalizedCode,

    status:
      'applied',

    discountPercent:
      coupon.discountPercent,
  }
}

function createQuoteItems(
  state: MockDatabaseState,
  cart:
    MockDatabaseState['carts'][number],
  request: QuoteRequest,
):
  | {
      ok: true
      items: QuoteItem[]
    }
  | {
      ok: false
      response: HttpResponse<ApiErrorResponse>
    } {
  if (
    request.items.length !==
    cart.items.length
  ) {
    return {
      ok: false,

      response:
        errorResponse(
          'CONFLICT',
          'O conteúdo do carrinho mudou. Gere uma nova cotação.',
          409,
        ),
    }
  }

  const items:
    QuoteItem[] = []

  for (
    const requestedItem
    of request.items
  ) {
    const cartItem =
      cart.items.find(
        (
          item,
        ) =>
          item.id ===
          requestedItem.cartItemId,
      )

    if (!cartItem) {
      return {
        ok: false,

        response:
          errorResponse(
            'CONFLICT',
            'Um item não existe mais no carrinho.',
            409,
            {
              cartItemId:
                requestedItem.cartItemId,
            },
          ),
      }
    }

    if (
      cartItem.quantity !==
      requestedItem.quantity
    ) {
      return {
        ok: false,

        response:
          errorResponse(
            'CONFLICT',
            'A quantidade de um item do carrinho mudou.',
            409,
            {
              cartItemId:
                cartItem.id,

              cartQuantity:
                cartItem.quantity,

              requestedQuantity:
                requestedItem.quantity,
            },
          ),
      }
    }

    const nft =
      state.nfts.find(
        (
          candidate,
        ) =>
          candidate.id ===
          cartItem.nftId,
      )

    if (!nft) {
      return {
        ok: false,

        response:
          errorResponse(
            'NOT_FOUND',
            'Um NFT do carrinho não está mais disponível.',
            404,
          ),
      }
    }

    if (
      nft.version !==
      requestedItem.expectedNftVersion
    ) {
      return {
        ok: false,

        response:
          errorResponse(
            'AVAILABILITY_CONFLICT',
            'O NFT foi atualizado desde a última consulta.',
            409,
            {
              nftId:
                nft.id,

              expectedVersion:
                requestedItem.expectedNftVersion,

              currentVersion:
                nft.version,
            },
          ),
      }
    }

    const edition =
      nft.editions.find(
        (
          candidate,
        ) =>
          candidate.id ===
          cartItem.editionId,
      )

    if (
      !edition ||
      !edition.purchasable ||
      requestedItem.quantity >
        edition.availableQuantity
    ) {
      return {
        ok: false,

        response:
          errorResponse(
            'AVAILABILITY_CONFLICT',
            'A quantidade solicitada não está mais disponível.',
            409,
            {
              nftId:
                nft.id,

              editionId:
                cartItem.editionId,

              requestedQuantity:
                requestedItem.quantity,

              availableQuantity:
                edition
                  ?.availableQuantity ??
                0,
            },
          ),
      }
    }

    const subtotalEth =
      multiplyEth(
        nft.priceEth,
        requestedItem.quantity,
      )

    items.push({
      cartItemId:
        cartItem.id,

      nftId:
        nft.id,

      editionId:
        cartItem.editionId,

      quantity:
        requestedItem.quantity,

      unitPriceEth:
        nft.priceEth,

      subtotalEth,

      nftVersion:
        nft.version,
    })
  }

  return {
    ok: true,
    items,
  }
}

export const quoteHandlers = [
  http.post(
    '*/api/quotes',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'quote',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const requestBody: unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseQuoteRequest(
          requestBody,
        )

      if (!payload) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Os dados da cotação são inválidos.',
          422,
        )
      }

      const state =
        mockDatabase.read()

      const cartAccess =
        canAccessCart(
          request,
          state,
          payload.cartId,
        )

      if (
        !cartAccess.authorized
      ) {
        return cartAccess.response
      }

      const cart =
        cartAccess.cart

      if (
        cart.version !==
        payload.expectedCartVersion
      ) {
        return errorResponse(
          'CONFLICT',
          'O carrinho mudou. Gere uma nova cotação.',
          409,
          {
            expectedVersion:
              payload.expectedCartVersion,

            currentVersion:
              cart.version,
          },
        )
      }

      const quoteItems =
        createQuoteItems(
          state,
          cart,
          payload,
        )

      if (!quoteItems.ok) {
        return quoteItems.response
      }

      const subtotalEth =
        sumEth(
          quoteItems.items.map(
            (
              item,
            ) =>
              item.subtotalEth,
          ),
        )

      const coupon =
        getCouponResult(
          state,
          payload.couponCode,
        )

      const discountEth =
        coupon.status ===
        'applied'
          ? percentageOfEth(
              subtotalEth,
              coupon.discountPercent,
            )
          : '0'

      const networkFeeEth =
        networkFees[
          payload.network
        ]

      const discountedSubtotal =
        subtractEth(
          subtotalEth,
          discountEth,
        )

      const totalEth =
        addEth(
          discountedSubtotal,
          networkFeeEth,
        )

      const now =
        Date.now()

      const quote: QuoteResponse =
        {
          id: `quote-${state.revision + 1}`,

          cartId:
            cart.id,

          cartVersion:
            cart.version,

          network:
            payload.network,

          items:
            quoteItems.items,

          coupon: {
            code:
              coupon.code,

            status:
              coupon.status,
          },

          subtotalEth,

          discountEth,

          networkFeeEth,

          totalEth,

          expiresAt:
            new Date(
              now +
                QUOTE_DURATION_MS,
            ).toISOString(),
        }

      state.quotes.push(
        quote,
      )

      state.revision += 1

      mockDatabase.write(
        state,
      )

      return HttpResponse.json(
        structuredClone(
          quote,
        ),
        {
          status: 201,
        },
      )
    },
  ),

  http.get(
    '*/api/quotes/:quoteId',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'quote',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const quoteId =
        typeof params.quoteId ===
        'string'
          ? params.quoteId
          : undefined

      if (!quoteId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'O identificador da cotação é inválido.',
          422,
        )
      }

      const state =
        mockDatabase.read()

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

      const cartAccess =
        canAccessCart(
          request,
          state,
          quote.cartId,
        )

      if (
        !cartAccess.authorized
      ) {
        return cartAccess.response
      }

      return HttpResponse.json(
        structuredClone(
          quote,
        ),
      )
    },
  ),
]