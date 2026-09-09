import {
  http,
  HttpResponse,
} from 'msw'

import type {
  AddCartItemRequest,
  ApiErrorResponse,
  Cart,
  CartItem,
  NftDetails,
  RemoveCartItemResponse,
  UpdateCartItemRequest,
} from '@/lib/api/contracts'
import { authorizeMockRequest } from '@/mocks/auth/authorize-request'
import { mockDatabase } from '@/mocks/database/database'
import type { MockDatabaseState } from '@/mocks/database/types'
import { applyNetworkScenario } from '@/mocks/scenarios/network'
import { getActiveScenario } from '@/mocks/scenarios/runtime'

const VISITOR_HEADER =
  'X-Kurio-Visitor-Id'

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

function parseAddRequest(
  value: unknown,
): AddCartItemRequest | undefined {
  if (
    !isRecord(value) ||
    typeof value.nftId !==
      'string' ||
    typeof value.editionId !==
      'string' ||
    typeof value.quantity !==
      'number' ||
    !Number.isInteger(
      value.quantity,
    )
  ) {
    return undefined
  }

  return {
    nftId: value.nftId,
    editionId:
      value.editionId,
    quantity:
      value.quantity,
  }
}

function parseUpdateRequest(
  value: unknown,
):
  | UpdateCartItemRequest
  | undefined {
  if (
    !isRecord(value) ||
    typeof value.quantity !==
      'number' ||
    !Number.isInteger(
      value.quantity,
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
    quantity:
      value.quantity,

    expectedVersion:
      value.expectedVersion,
  }
}

function errorResponse(
  code: ApiErrorResponse['error']['code'],
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
): string | undefined {
  return (
    request.headers
      .get(
        VISITOR_HEADER,
      )
      ?.trim() ||
    undefined
  )
}

interface CartOwner {
  userId: string | null
  visitorId: string | null
}

interface ResolvedOwnerSuccess {
  ok: true
  owner: CartOwner
  state: MockDatabaseState
}

interface ResolvedOwnerFailure {
  ok: false
  response: HttpResponse<ApiErrorResponse>
}

type ResolvedOwner =
  | ResolvedOwnerSuccess
  | ResolvedOwnerFailure

function resolveOwner(
  request: Request,
): ResolvedOwner {
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
        ok: false,
        response:
          authorization.response,
      }
    }

    return {
      ok: true,

      owner: {
        userId:
          authorization.userId,

        visitorId:
          getVisitorId(
            request,
          ) ?? null,
      },

      state:
        authorization.state,
    }
  }

  const visitorId =
    getVisitorId(
      request,
    )

  if (!visitorId) {
    return {
      ok: false,

      response:
        errorResponse(
          'VALIDATION_ERROR',
          'Não foi possível identificar o carrinho deste visitante.',
          422,
        ),
    }
  }

  return {
    ok: true,

    owner: {
      userId: null,
      visitorId,
    },

    state:
      mockDatabase.read(),
  }
}

function findCart(
  state: MockDatabaseState,
  owner: CartOwner,
): Cart | undefined {
  if (owner.userId) {
    return state.carts.find(
      (cart) =>
        cart.userId ===
        owner.userId,
    )
  }

  return state.carts.find(
    (cart) =>
      cart.visitorId ===
      owner.visitorId,
  )
}

interface CartLookup {
  cart: Cart
  created: boolean
}

function getOrCreateCart(
  state: MockDatabaseState,
  owner: CartOwner,
): CartLookup {
  const existingCart =
    findCart(
      state,
      owner,
    )

  if (existingCart) {
    return {
      cart: existingCart,
      created: false,
    }
  }

  const now =
    new Date().toISOString()

  const ownerId =
    owner.userId ??
    owner.visitorId ??
    `guest-${state.revision + 1}`

  const cart: Cart = {
    id: `cart-${ownerId}`,
    userId: owner.userId,

    visitorId:
      owner.userId
        ? null
        : owner.visitorId,

    items: [],
    version: 1,
    updatedAt: now,
  }

  state.carts.push(cart)

  return {
    cart,
    created: true,
  }
}

function getEditionAvailability(
  nft: NftDetails,
  editionId: string,
): number | undefined {
  const edition =
    nft.editions.find(
      (candidate) =>
        candidate.id ===
        editionId,
    )

  if (!edition) {
    return undefined
  }

  if (
    getActiveScenario()
      .flags
      .editionSoldOut
  ) {
    return 0
  }

  return edition.availableQuantity
}

function refreshCartItem(
  state: MockDatabaseState,
  item: CartItem,
): boolean {
  const nft =
    state.nfts.find(
      (candidate) =>
        candidate.id ===
        item.nftId,
    )

  const nextAvailableQuantity =
    nft
      ? getEditionAvailability(
          nft,
          item.editionId,
        ) ?? 0
      : 0

  const nextAvailabilityChanged =
    nextAvailableQuantity !==
      item.availableQuantity ||
    item.quantity >
      nextAvailableQuantity

  const nextPriceChanged =
    !nft ||
    item.unitPriceEth !==
      nft.priceEth ||
    getActiveScenario()
      .flags
      .priceChanged ===
      true

  const changed =
    item.availableQuantity !==
      nextAvailableQuantity ||
    item.availabilityChanged !==
      nextAvailabilityChanged ||
    item.priceChanged !==
      nextPriceChanged

  item.availableQuantity =
    nextAvailableQuantity

  item.availabilityChanged =
    nextAvailabilityChanged

  item.priceChanged =
    nextPriceChanged

  return changed
}

function refreshCart(
  state: MockDatabaseState,
  cart: Cart,
): boolean {
  return cart.items.reduce(
    (
      changed,
      item,
    ) =>
      refreshCartItem(
        state,
        item,
      ) ||
      changed,
    false,
  )
}

function mergeVisitorCartIntoUserCart(
  state: MockDatabaseState,
  userCart: Cart,
  visitorId: string | null,
): boolean {
  if (!visitorId) {
    return false
  }

  const visitorCart =
    state.carts.find(
      (cart) =>
        cart.userId ===
          null &&
        cart.visitorId ===
          visitorId,
    )

  if (
    !visitorCart ||
    visitorCart.items.length ===
      0
  ) {
    return false
  }

  const now =
    new Date().toISOString()

  visitorCart.items.forEach(
    (visitorItem) => {
      const nft =
        state.nfts.find(
          (candidate) =>
            candidate.id ===
            visitorItem.nftId,
        )

      const availableQuantity =
        nft
          ? getEditionAvailability(
              nft,
              visitorItem.editionId,
            ) ?? 0
          : 0

      if (
        !nft ||
        availableQuantity <=
          0
      ) {
        return
      }

      const existingItem =
        userCart.items.find(
          (item) =>
            item.nftId ===
              visitorItem.nftId &&
            item.editionId ===
              visitorItem.editionId,
        )

      if (existingItem) {
        existingItem.quantity =
          Math.min(
            availableQuantity,

            existingItem.quantity +
              visitorItem.quantity,
          )

        existingItem.unitPriceEth =
          nft.priceEth

        existingItem.availableQuantity =
          availableQuantity

        existingItem.priceChanged =
          false

        existingItem.availabilityChanged =
          false

        existingItem.version +=
          1

        return
      }

      userCart.items.push({
        ...structuredClone(
          visitorItem,
        ),

        id: `cart-item-${state.revision + 1}-${userCart.items.length + 1}`,

        unitPriceEth:
          nft.priceEth,

        quantity:
          Math.min(
            visitorItem.quantity,
            availableQuantity,
          ),

        availableQuantity,

        priceChanged:
          false,

        availabilityChanged:
          false,

        version: 1,
      })
    },
  )

  visitorCart.items = []

  visitorCart.version += 1
  visitorCart.updatedAt =
    now

  userCart.version += 1
  userCart.updatedAt = now

  return true
}

function persistState(
  state: MockDatabaseState,
): void {
  state.revision += 1

  mockDatabase.write(
    state,
  )
}

export const cartHandlers = [
  http.get(
    '*/api/cart',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'cart',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const resolved =
        resolveOwner(
          request,
        )

      if (!resolved.ok) {
        return resolved.response
      }

      const {
        owner,
        state,
      } = resolved

      const {
        cart,
        created,
      } =
        getOrCreateCart(
          state,
          owner,
        )

      const merged =
        owner.userId
          ? mergeVisitorCartIntoUserCart(
              state,
              cart,
              owner.visitorId,
            )
          : false

      const refreshed =
        refreshCart(
          state,
          cart,
        )

      if (
        created ||
        merged ||
        refreshed
      ) {
        persistState(
          state,
        )
      }

      return HttpResponse.json(
        structuredClone(
          cart,
        ),
      )
    },
  ),

  http.post(
    '*/api/cart/items',

    async ({
      request,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'cart',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const resolved =
        resolveOwner(
          request,
        )

      if (!resolved.ok) {
        return resolved.response
      }

      const requestBody: unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseAddRequest(
          requestBody,
        )

      if (
        !payload ||
        payload.quantity < 1
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Informe um NFT, uma edição e uma quantidade válida.',
          422,
        )
      }

      const {
        owner,
        state,
      } = resolved

      const { cart } =
        getOrCreateCart(
          state,
          owner,
        )

      if (owner.userId) {
        mergeVisitorCartIntoUserCart(
          state,
          cart,
          owner.visitorId,
        )
      }

      const nft =
        state.nfts.find(
          (candidate) =>
            candidate.id ===
            payload.nftId,
        )

      const edition =
        nft?.editions.find(
          (candidate) =>
            candidate.id ===
            payload.editionId,
        )

      if (
        !nft ||
        !edition
      ) {
        return errorResponse(
          'NOT_FOUND',
          'NFT ou edição não encontrada.',
          404,
        )
      }

      const availableQuantity =
        getEditionAvailability(
          nft,
          edition.id,
        ) ?? 0

      const existingItem =
        cart.items.find(
          (item) =>
            item.nftId ===
              nft.id &&
            item.editionId ===
              edition.id,
        )

      const requestedQuantity =
        (existingItem
          ?.quantity ??
          0) +
        payload.quantity

      if (
        !edition.purchasable ||
        requestedQuantity >
          availableQuantity
      ) {
        return errorResponse(
          'AVAILABILITY_CONFLICT',
          'A quantidade solicitada não está mais disponível.',
          409,
          {
            nftId:
              nft.id,

            editionId:
              edition.id,

            requestedQuantity,

            availableQuantity,
          },
        )
      }

      if (existingItem) {
        existingItem.quantity =
          requestedQuantity

        existingItem.unitPriceEth =
          nft.priceEth

        existingItem.availableQuantity =
          availableQuantity

        existingItem.priceChanged =
          false

        existingItem.availabilityChanged =
          false

        existingItem.version +=
          1
      } else {
        cart.items.push({
          id: `cart-item-${state.revision + 1}-${cart.items.length + 1}`,

          nftId:
            nft.id,

          editionId:
            edition.id,

          tokenId:
            nft.tokenId,

          name:
            nft.name,

          image:
            nft.image,

          unitPriceEth:
            nft.priceEth,

          quantity:
            payload.quantity,

          availableQuantity,

          priceChanged:
            false,

          availabilityChanged:
            false,

          version: 1,
        })
      }

      cart.version += 1

      cart.updatedAt =
        new Date().toISOString()

      persistState(
        state,
      )

      return HttpResponse.json(
        structuredClone(
          cart,
        ),
        {
          status: 201,
        },
      )
    },
  ),

  http.patch(
    '*/api/cart/items/:itemId',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'cart',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const resolved =
        resolveOwner(
          request,
        )

      if (!resolved.ok) {
        return resolved.response
      }

      const requestBody: unknown =
        await request
          .json()
          .catch(
            () =>
              undefined,
          )

      const payload =
        parseUpdateRequest(
          requestBody,
        )

      const itemId =
        typeof params.itemId ===
        'string'
          ? params.itemId
          : undefined

      if (
        !payload ||
        payload.quantity < 1 ||
        !itemId
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'A quantidade informada é inválida.',
          422,
        )
      }

      const {
        owner,
        state,
      } = resolved

      const { cart } =
        getOrCreateCart(
          state,
          owner,
        )

      const item =
        cart.items.find(
          (candidate) =>
            candidate.id ===
            itemId,
        )

      if (!item) {
        return errorResponse(
          'NOT_FOUND',
          'Item do carrinho não encontrado.',
          404,
        )
      }

      if (
        item.version !==
        payload.expectedVersion
      ) {
        return errorResponse(
          'CONFLICT',
          'Este item foi atualizado por outra operação.',
          409,
          {
            expectedVersion:
              payload.expectedVersion,

            currentVersion:
              item.version,
          },
        )
      }

      const nft =
        state.nfts.find(
          (candidate) =>
            candidate.id ===
            item.nftId,
        )

      const availableQuantity =
        nft
          ? getEditionAvailability(
              nft,
              item.editionId,
            ) ?? 0
          : 0

      if (
        !nft ||
        payload.quantity >
          availableQuantity
      ) {
        item.availableQuantity =
          availableQuantity

        item.availabilityChanged =
          true

        cart.version += 1

        cart.updatedAt =
          new Date().toISOString()

        persistState(
          state,
        )

        return errorResponse(
          'AVAILABILITY_CONFLICT',
          'A quantidade solicitada não está mais disponível.',
          409,
          {
            nftId:
              item.nftId,

            editionId:
              item.editionId,

            requestedQuantity:
              payload.quantity,

            availableQuantity,
          },
        )
      }

      item.quantity =
        payload.quantity

      item.unitPriceEth =
        nft.priceEth

      item.availableQuantity =
        availableQuantity

      item.priceChanged =
        false

      item.availabilityChanged =
        false

      item.version += 1

      cart.version += 1

      cart.updatedAt =
        new Date().toISOString()

      persistState(
        state,
      )

      return HttpResponse.json(
        structuredClone(
          cart,
        ),
      )
    },
  ),

  http.delete(
    '*/api/cart/items/:itemId',

    async ({
      request,
      params,
    }) => {
      const scenarioResponse =
        await applyNetworkScenario(
          'cart',
        )

      if (scenarioResponse) {
        return scenarioResponse
      }

      const resolved =
        resolveOwner(
          request,
        )

      if (!resolved.ok) {
        return resolved.response
      }

      const itemId =
        typeof params.itemId ===
        'string'
          ? params.itemId
          : undefined

      if (!itemId) {
        return errorResponse(
          'VALIDATION_ERROR',
          'O item do carrinho é inválido.',
          422,
        )
      }

      const {
        owner,
        state,
      } = resolved

      const { cart } =
        getOrCreateCart(
          state,
          owner,
        )

      const itemIndex =
        cart.items.findIndex(
          (candidate) =>
            candidate.id ===
            itemId,
        )

      if (
        itemIndex < 0
      ) {
        return errorResponse(
          'NOT_FOUND',
          'Item do carrinho não encontrado.',
          404,
        )
      }

      cart.items.splice(
        itemIndex,
        1,
      )

      cart.version += 1

      cart.updatedAt =
        new Date().toISOString()

      persistState(
        state,
      )

      const response: RemoveCartItemResponse =
        {
          removedItemId:
            itemId,

          cart:
            structuredClone(
              cart,
            ),
        }

      return HttpResponse.json(
        response,
      )
    },
  ),
]