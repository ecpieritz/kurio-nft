import {
  useMutation,
  type UseMutationResult,
} from '@tanstack/react-query'

import { createOrder } from '@/features/orders/orders-api'
import type {
  CreateOrderRequest,
  Order,
} from '@/lib/api/contracts'

interface CreateOrderVariables {
  request: CreateOrderRequest
  idempotencyKey: string
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
    mutationFn: ({
      request,
      idempotencyKey,
    }) =>
      createOrder(
        request,
        idempotencyKey,
      ),
  })
}