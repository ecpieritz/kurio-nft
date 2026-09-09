import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  createOrder,
  fetchOrder,
  recoverOrder,
} from '@/features/orders/orders-api'
import type {
  CreateOrderRequest,
  Order,
} from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'

interface CreateOrderVariables {
  request: CreateOrderRequest
  idempotencyKey: string
}

export const orderQueryKeys = {
  all: [
    'orders',
  ] as const,

  details: () =>
    [
      ...orderQueryKeys.all,
      'detail',
    ] as const,

  detail: (
    orderId: string,
  ) =>
    [
      ...orderQueryKeys.details(),
      orderId,
    ] as const,

  recovery: (
    idempotencyKey: string,
  ) =>
    [
      ...orderQueryKeys.all,
      'recovery',
      idempotencyKey,
    ] as const,
}

export function useCreateOrderMutation(): UseMutationResult<
  Order,
  Error,
  CreateOrderVariables
> {
  return useMutation<
    Order,
    Error,
    CreateOrderVariables
  >({
    mutationKey: [
      ...orderQueryKeys.all,
      'create',
    ],

    mutationFn: ({
      request,
      idempotencyKey,
    }) =>
      createOrder(
        request,
        idempotencyKey,
      ),

    retry: false,
  })
}

export function useOrderQuery(
  orderId: string,
): UseQueryResult<
  Order,
  Error
> {
  return useQuery<
    Order,
    Error
  >({
    queryKey:
      orderQueryKeys.detail(
        orderId,
      ),

    queryFn: ({
      signal,
    }): Promise<Order> =>
      fetchOrder(
        orderId,
        signal,
      ),

    staleTime: 0,

    refetchOnReconnect:
      true,

    refetchOnWindowFocus:
      true,

    refetchInterval: (
      query,
    ) =>
      query.state.data
        ?.status ===
      'pending'
        ? 1_000
        : false,
  })
}

export function usePendingOrderRecoveryQuery(
  idempotencyKey:
    | string
    | null,
): UseQueryResult<
  Order,
  Error
> {
  return useQuery<
    Order,
    Error
  >({
    queryKey:
      orderQueryKeys.recovery(
        idempotencyKey ??
          'none',
      ),

    queryFn: ({
      signal,
    }): Promise<Order> => {
      if (!idempotencyKey) {
        return Promise.reject(
          new Error(
            'Idempotency key is required.',
          ),
        )
      }

      return recoverOrder(
        idempotencyKey,
        signal,
      )
    },

    enabled:
      Boolean(
        idempotencyKey,
      ),

    staleTime: 0,

    refetchOnReconnect:
      true,

    refetchOnWindowFocus:
      true,

    retry: (
      failureCount,
      error,
    ) => {
      if (
        error instanceof
          ApiClientError &&
        error.code ===
          'NOT_FOUND'
      ) {
        return false
      }

      return (
        failureCount <
        2
      )
    },
  })
}