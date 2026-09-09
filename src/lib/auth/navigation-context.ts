const RETURN_TO_STORAGE_KEY = 'kurio:auth-return-to:v1'

const AUTH_ROUTES = new Set(['/login', '/sign-up'])

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  try {
    const url = new URL(value, 'https://kurio.local')

    if (url.origin !== 'https://kurio.local' || AUTH_ROUTES.has(url.pathname)) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function getCurrentNavigationPath(): string {
  if (typeof window === 'undefined') return '/'

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function rememberReturnTo(value: unknown): string | null {
  const returnTo = sanitizeReturnTo(value)

  if (!returnTo || !canUseSessionStorage()) return returnTo

  try {
    window.sessionStorage.setItem(RETURN_TO_STORAGE_KEY, returnTo)
  } catch {
    // Navigation still works through the URL when storage is unavailable.
  }

  return returnTo
}

export function getRememberedReturnTo(): string | null {
  if (!canUseSessionStorage()) return null

  try {
    return sanitizeReturnTo(window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY))
  } catch {
    return null
  }
}

export function consumeReturnTo(fallback = '/'): string {
  const returnTo = getRememberedReturnTo() ?? sanitizeReturnTo(fallback) ?? '/'
  clearReturnTo()
  return returnTo
}

export function clearReturnTo(): void {
  if (!canUseSessionStorage()) return

  try {
    window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY)
  } catch {
    // Storage is an enhancement; an unavailable store must not block logout.
  }
}
