const SESSION_TOKEN_STORAGE_KEY = 'kurio:session-token:v1'
let memoryToken: string | null = null

export function getSessionToken(): string | null {
  try {
    return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setSessionToken(token: string): void {
  memoryToken = token

  try {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
  } catch {
    // The active session still works in memory when persistent storage is unavailable.
  }
}

export function clearSessionToken(): void {
  memoryToken = null

  try {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
  } catch {
    // There is no persisted token to clear when storage access is unavailable.
  }
}
