import { apiRequest } from '@/lib/api/client'
import type {
  AddCartItemRequest,
  Cart,
  RemoveCartItemResponse,
  UpdateCartItemRequest,
} from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'
import { getOrCreateVisitorId } from '@/lib/api/visitor-id'

function getCartHeaders(): Record<string, string> {
  return {
    'X-Kurio-Visitor-Id': getOrCreateVisitorId(),
  }
}

export function fetchCart(signal?: AbortSignal): Promise<Cart> {
  return apiRequest<Cart>({
    method: 'GET',
    url: endpoints.cart.current,
    headers: getCartHeaders(),
    signal,
  })
}

export function addCartItem(request: AddCartItemRequest): Promise<Cart> {
  return apiRequest<Cart, AddCartItemRequest>({
    method: 'POST',
    url: endpoints.cart.items,
    headers: getCartHeaders(),
    data: request,
  })
}

export function updateCartItem(itemId: string, request: UpdateCartItemRequest): Promise<Cart> {
  return apiRequest<Cart, UpdateCartItemRequest>({
    method: 'PATCH',
    url: endpoints.cart.item(itemId),
    headers: getCartHeaders(),
    data: request,
  })
}

export function removeCartItem(itemId: string): Promise<RemoveCartItemResponse> {
  return apiRequest<RemoveCartItemResponse>({
    method: 'DELETE',
    url: endpoints.cart.item(itemId),
    headers: getCartHeaders(),
  })
}
