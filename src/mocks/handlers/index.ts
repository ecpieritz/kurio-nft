import { authHandlers } from '@/mocks/handlers/auth'
import { controlHandlers } from '@/mocks/handlers/control'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { nftHandlers } from '@/mocks/handlers/nfts'

export const handlers = [...authHandlers, ...nftHandlers, ...favoriteHandlers, ...controlHandlers]
