import { apiRequest } from '@/lib/api/client'
import type {
  CollectorWallet,
  SaveWalletRequest,
  WalletCollection,
} from '@/lib/api/contracts'
import { endpoints } from '@/lib/api/endpoints'

export function fetchWallets(
  signal?: AbortSignal,
): Promise<WalletCollection> {
  return apiRequest<WalletCollection>({
    method: 'GET',
    url: endpoints.wallets.list,
    signal,
  })
}

export function createWallet(
  request: SaveWalletRequest,
): Promise<CollectorWallet> {
  return apiRequest<
    CollectorWallet,
    SaveWalletRequest
  >({
    method: 'POST',
    url: endpoints.wallets.list,
    data: request,
  })
}

export function updateWallet(
  walletId: string,
  request: SaveWalletRequest,
): Promise<CollectorWallet> {
  return apiRequest<
    CollectorWallet,
    SaveWalletRequest
  >({
    method: 'PATCH',
    url: endpoints.wallets.item(walletId),
    data: request,
  })
}