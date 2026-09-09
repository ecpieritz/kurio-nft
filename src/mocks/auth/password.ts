export async function hashMockPassword(password: string): Promise<string> {
  const encodedPassword = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encodedPassword)

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
