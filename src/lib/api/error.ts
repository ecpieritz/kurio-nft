import axios from 'axios'

import type {
  ApiErrorCode,
  ApiErrorPayload,
  ApiErrorResponse,
  FieldError,
} from '@/lib/api/contracts'

interface ApiClientErrorOptions {
  code: ApiErrorCode
  message: string
  retryable: boolean
  status?: number
  requestId?: string
  fieldErrors?: FieldError[]
  details?: Record<string, unknown>
  cause?: unknown
}

export class ApiClientError extends Error {
  readonly code: ApiErrorCode
  readonly retryable: boolean
  readonly status?: number
  readonly requestId?: string
  readonly fieldErrors?: FieldError[]
  readonly details?: Record<string, unknown>

  constructor(options: ApiClientErrorOptions) {
    super(options.message, { cause: options.cause })
    this.name = 'ApiClientError'
    this.code = options.code
    this.retryable = options.retryable
    this.status = options.status
    this.requestId = options.requestId
    this.fieldErrors = options.fieldErrors
    this.details = options.details
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    typeof value.retryable === 'boolean'
  )
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && isApiErrorPayload(value.error)
}

function getFallbackCode(status?: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 429) return 'RATE_LIMITED'
  if (status !== undefined && status >= 500) return 'INTERNAL_ERROR'
  return 'UNKNOWN_ERROR'
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error

  if (!axios.isAxiosError(error)) {
    return new ApiClientError({
      code: 'UNKNOWN_ERROR',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      retryable: false,
      cause: error,
    })
  }

  if (axios.isCancel(error)) {
    return new ApiClientError({
      code: 'REQUEST_CANCELLED',
      message: 'A solicitação foi cancelada.',
      retryable: false,
      cause: error,
    })
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError({
      code: 'TIMEOUT',
      message: 'A solicitação demorou mais que o esperado. Tente novamente.',
      retryable: true,
      cause: error,
    })
  }

  if (!error.response) {
    return new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Não foi possível acessar a API. Verifique sua conexão e tente novamente.',
      retryable: true,
      cause: error,
    })
  }

  const status = error.response.status
  const responseData: unknown = error.response.data

  if (isApiErrorResponse(responseData)) {
    return new ApiClientError({
      ...responseData.error,
      status,
      cause: error,
    })
  }

  return new ApiClientError({
    code: getFallbackCode(status),
    message: 'A API retornou uma resposta inesperada. Atualize a página e tente novamente.',
    retryable: status >= 500,
    status,
    cause: error,
  })
}
