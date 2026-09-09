function encodePathSegment(value: string): string {
  return encodeURIComponent(value)
}

export const endpoints = {
  auth: {
    register: '/auth/register',

    login: '/auth/login',

    session: '/auth/session',

    logout: '/auth/logout',
  },

  nfts: {
    list: '/nfts',

    details: (nftId: string) => `/nfts/${encodePathSegment(nftId)}`,
  },

  favorites: {
    list: '/favorites',

    item: (nftId: string) => `/favorites/${encodePathSegment(nftId)}`,
  },

  cart: {
    current: '/cart',

    items: '/cart/items',

    item: (itemId: string) => `/cart/items/${encodePathSegment(itemId)}`,
  },

  quotes: {
    create: '/quotes',

    details: (quoteId: string) => `/quotes/${encodePathSegment(quoteId)}`,
  },

  orders: {
    create: '/orders',

    details: (orderId: string) => `/orders/${encodePathSegment(orderId)}`,

    recovery: (idempotencyKey: string) => `/orders/recovery/${encodePathSegment(idempotencyKey)}`,
  },

  profile: {
    details: '/profile',

    avatar: '/profile/avatar',

    password: '/profile/password',
  },

  wallets: {
    list: '/wallets',

    item: (walletId: string) => `/wallets/${encodePathSegment(walletId)}`,
  },
} as const
