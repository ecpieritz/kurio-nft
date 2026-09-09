import axios, { type AxiosRequestConfig } from 'axios'

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

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
)

export async function apiRequest<TResponse, TBody = unknown>(
  config: AxiosRequestConfig<TBody>,
): Promise<TResponse> {
  const response = await apiClient.request<TResponse, { data: TResponse }, TBody>(config)
  return response.data
}
