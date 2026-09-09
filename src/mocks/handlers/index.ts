import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { controlHandlers } from '@/mocks/handlers/control'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { quoteHandlers } from '@/mocks/handlers/quotes'
import { realtimeHandlers } from '@/mocks/handlers/realtime'

export const handlers = [
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...controlHandlers,
  ...quoteHandlers,
  ...realtimeHandlers,  
]
