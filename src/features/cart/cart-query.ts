import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useAuth } from '@/features/auth/session/use-auth'
import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/cart-api'
import type {
  AddCartItemRequest,
  Cart,
  RemoveCartItemResponse,
  UpdateCartItemRequest,
} from '@/lib/api/contracts'

export const cartQueryKeys = {
  all: ['cart'] as const,

  current: (ownerKey: string) =>
    [
      ...cartQueryKeys.all,
      ownerKey,
    ] as const,
}

interface CartOwnerState {
  ownerKey: string
  ready: boolean
}

function useCartOwnerState(): CartOwnerState {
  const auth = useAuth()

  if (auth.status === 'pending') {
    return {
      ownerKey: 'pending-session',
      ready: false,
    }
  }

  return {
    ownerKey: auth.user?.id ?? 'visitor',
    ready: true,
  }
}

export function useCartQuery(): UseQueryResult<
  Cart,
  Error
> {
  const {
    ownerKey,
    ready,
  } = useCartOwnerState()

  return useQuery<
    Cart,
    Error
  >({
    queryKey:
      cartQueryKeys.current(
        ownerKey,
      ),

    queryFn: ({
      signal,
    }): Promise<Cart> =>
      fetchCart(signal),

    enabled: ready,
    staleTime: 0,
  })
}

export function useAddCartItemMutation(): UseMutationResult<
  Cart,
  Error,
  AddCartItemRequest
> {
  const queryClient = useQueryClient()
  const { ownerKey } =
    useCartOwnerState()

  const queryKey =
    cartQueryKeys.current(
      ownerKey,
    )

  return useMutation<
    Cart,
    Error,
    AddCartItemRequest
  >({
    mutationFn: addCartItem,

    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(
        queryKey,
        cart,
      )
    },
  })
}

interface UpdateCartItemVariables
  extends UpdateCartItemRequest {
  itemId: string
}

export function useUpdateCartItemMutation(): UseMutationResult<
  Cart,
  Error,
  UpdateCartItemVariables
> {
  const queryClient = useQueryClient()
  const { ownerKey } =
    useCartOwnerState()

  const queryKey =
    cartQueryKeys.current(
      ownerKey,
    )

  return useMutation<
    Cart,
    Error,
    UpdateCartItemVariables
  >({
    mutationFn: ({
      itemId,
      ...request
    }) =>
      updateCartItem(
        itemId,
        request,
      ),

    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(
        queryKey,
        cart,
      )
    },

    onError: () => {
      void queryClient.invalidateQueries({
        queryKey,
      })
    },
  })
}

export function useRemoveCartItemMutation(): UseMutationResult<
  RemoveCartItemResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()
  const { ownerKey } =
    useCartOwnerState()

  const queryKey =
    cartQueryKeys.current(
      ownerKey,
    )

  return useMutation<
    RemoveCartItemResponse,
    Error,
    string
  >({
    mutationFn: removeCartItem,

    onSuccess: ({
      cart,
    }) => {
      queryClient.setQueryData<Cart>(
        queryKey,
        cart,
      )
    },
  })
}