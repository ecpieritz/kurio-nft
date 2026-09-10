import { fetchNftDetails } from '@/features/catalog/catalog-api'
import type {
  BlockchainNetwork,
  Cart,
  CollectorWallet,
  QuoteRequest,
  QuoteResponse,
} from '@/lib/api/contracts'

export async function buildCartQuoteRequest(
  cart: Cart,
  network: BlockchainNetwork,
  couponCode?: string,
): Promise<QuoteRequest> {
  const nfts = await Promise.all(cart.items.map((item) => fetchNftDetails(item.nftId)))
  const versionByNftId = new Map(nfts.map((nft) => [nft.id, nft.version]))

  return {
    cartId: cart.id,
    expectedCartVersion: cart.version,
    network,
    couponCode: couponCode?.trim() || undefined,
    items: cart.items.map((item) => ({
      cartItemId: item.id,
      quantity: item.quantity,
      expectedNftVersion: versionByNftId.get(item.nftId) ?? 0,
    })),
  }
}

export async function buildQuoteRequest(
  cart: Cart,
  wallet: CollectorWallet,
  couponCode?: string,
): Promise<QuoteRequest> {
  return buildCartQuoteRequest(cart, wallet.network, couponCode)
}

export function hasQuoteChanged(previous: QuoteResponse, next: QuoteResponse): boolean {
  if (
    previous.cartVersion !== next.cartVersion ||
    previous.network !== next.network ||
    previous.subtotalEth !== next.subtotalEth ||
    previous.discountEth !== next.discountEth ||
    previous.networkFeeEth !== next.networkFeeEth ||
    previous.totalEth !== next.totalEth ||
    previous.coupon.code !== next.coupon.code ||
    previous.coupon.status !== next.coupon.status ||
    previous.items.length !== next.items.length
  ) {
    return true
  }

  return previous.items.some((item, index) => {
    const nextItem = next.items[index]

    return (
      !nextItem ||
      item.cartItemId !== nextItem.cartItemId ||
      item.quantity !== nextItem.quantity ||
      item.unitPriceEth !== nextItem.unitPriceEth ||
      item.subtotalEth !== nextItem.subtotalEth ||
      item.nftVersion !== nextItem.nftVersion
    )
  })
}
