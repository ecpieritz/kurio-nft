import { apiRequest } from '@/lib/api/client'
import type {
  CreateOrderRequest,
  Order,
} from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'

export function createOrder(
  request: CreateOrderRequest,
  idempotencyKey: string,
): Promise<Order> {
  return apiRequest<
    Order,
    CreateOrderRequest
  >({
    method: 'POST',

    url:
      endpoints.orders.create,

    headers: {
      'Idempotency-Key':
        idempotencyKey,
    },

    data:
      request,
  })
}