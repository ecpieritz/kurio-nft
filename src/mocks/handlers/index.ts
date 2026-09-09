import { authHandlers } from '@/mocks/handlers/auth'
import { controlHandlers } from '@/mocks/handlers/control'

export const handlers = [...authHandlers, ...controlHandlers]
