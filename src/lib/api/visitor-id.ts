const VISITOR_ID_STORAGE_KEY = 'kurio:visitor-id:v1'

let memoryVisitorId: string | null = null

function createVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `visitor-${crypto.randomUUID()}`
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getOrCreateVisitorId(): string {
  if (memoryVisitorId) return memoryVisitorId

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedVisitorId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)

      if (storedVisitorId) {
        memoryVisitorId = storedVisitorId
        return storedVisitorId
      }

      const visitorId = createVisitorId()

      window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId)

      memoryVisitorId = visitorId

      return visitorId
    }
  } catch {
    // Storage can be blocked in private or embedded browsing contexts.
  }

  const visitorId = createVisitorId()

  memoryVisitorId = visitorId

  return visitorId
}