import axios, { type AxiosRequestConfig } from 'axios'

import { reportSessionExpiration, isSessionInvalidationError } from '@/lib/auth/session-expiration'
import { getSessionToken } from '@/lib/auth/session-token'
import { normalizeApiError } from '@/lib/api/error'

const DEFAULT_TIMEOUT_MS = 10_000

function getTimeout(): number {
  const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS)

  return Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_TIMEOUT_MS
}

function getBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  return configuredBaseUrl || '/api'
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: getTimeout(),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const sessionToken = getSessionToken()

  if (sessionToken) {
    config.headers.set('Authorization', `Bearer ${sessionToken}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalizedError = normalizeApiError(error)
    const requestUrl = axios.isAxiosError(error) ? error.config?.url : undefined
    const isAuthenticationMutation =
      requestUrl?.endsWith('/auth/login') ||
      requestUrl?.endsWith('/auth/register') ||
      requestUrl?.endsWith('/auth/logout')

    if (
      getSessionToken() &&
      !isAuthenticationMutation &&
      isSessionInvalidationError(normalizedError)
    ) {
      reportSessionExpiration(normalizedError)
    }

    return Promise.reject(normalizedError)
  },
)

export async function apiRequest<TResponse, TBody = unknown>(
  config: AxiosRequestConfig<TBody>,
): Promise<TResponse> {
  const response = await apiClient.request<TResponse, { data: TResponse }, TBody>(config)
  return response.data
}
