const STORAGE_KEY = 'kurio:pending-order:v1'
const MAX_AGE_MS = 30 * 60_000

export interface PendingOrderRecovery {
  idempotencyKey: string
  userId: string
  createdAt: string
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

function parsePendingOrderRecovery(
  value: unknown,
): PendingOrderRecovery | null {
  if (
    !isRecord(value) ||
    typeof value.idempotencyKey !==
      'string' ||
    typeof value.userId !==
      'string' ||
    typeof value.createdAt !==
      'string'
  ) {
    return null
  }

  return {
    idempotencyKey:
      value.idempotencyKey,

    userId:
      value.userId,

    createdAt:
      value.createdAt,
  }
}

export function readPendingOrderRecovery(
  userId: string,
): PendingOrderRecovery | null {
  try {
    const rawValue =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    if (!rawValue) {
      return null
    }

    const parsedValue: unknown =
      JSON.parse(
        rawValue,
      )

    const recovery =
      parsePendingOrderRecovery(
        parsedValue,
      )

    if (!recovery) {
      window.localStorage.removeItem(
        STORAGE_KEY,
      )

      return null
    }

    const createdAtMs =
      Date.parse(
        recovery.createdAt,
      )

    const expired =
      !Number.isFinite(
        createdAtMs,
      ) ||
      Date.now() -
        createdAtMs >
        MAX_AGE_MS

    if (
      expired ||
      recovery.userId !==
        userId
    ) {
      window.localStorage.removeItem(
        STORAGE_KEY,
      )

      return null
    }

    return recovery
  } catch {
    return null
  }
}

export function persistPendingOrderRecovery(
  userId: string,
  idempotencyKey: string,
): PendingOrderRecovery {
  const recovery:
    PendingOrderRecovery = {
      idempotencyKey,
      userId,

      createdAt:
        new Date().toISOString(),
    }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        recovery,
      ),
    )
  } catch {
    // The in-memory key still protects the active submission.
  }

  return recovery
}

export function clearPendingOrderRecovery(): void {
  try {
    window.localStorage.removeItem(
      STORAGE_KEY,
    )
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}