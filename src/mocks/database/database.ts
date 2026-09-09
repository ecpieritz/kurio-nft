import type { MockDatabaseState } from '@/mocks/database/types'
import { createKnownDatabaseState } from '@/mocks/fixtures/state'

const DATABASE_STORAGE_KEY = 'kurio:msw:database:v1'

interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

let memoryState: string | null = null

const memoryStorage: StorageAdapter = {
  getItem: () => memoryState,
  setItem: (_key, value) => {
    memoryState = value
  },
  removeItem: () => {
    memoryState = null
  },
}

function resolveStorage(): StorageAdapter {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Browsers can deny storage access in private or embedded contexts.
  }

  return memoryStorage
}

function cloneState(state: MockDatabaseState): MockDatabaseState {
  return structuredClone(state)
}

function isDatabaseState(value: unknown): value is MockDatabaseState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === 1 &&
    'revision' in value &&
    typeof value.revision === 'number'
  )
}

export class PersistentMockDatabase {
  readonly #storage: StorageAdapter

  constructor(storage: StorageAdapter = resolveStorage()) {
    this.#storage = storage
  }

  read(): MockDatabaseState {
    const serializedState = this.#storage.getItem(DATABASE_STORAGE_KEY)

    if (!serializedState) {
      return this.reset()
    }

    try {
      const parsedState: unknown = JSON.parse(serializedState)

      if (isDatabaseState(parsedState)) {
        return cloneState(parsedState)
      }
    } catch {
      // A corrupt or outdated snapshot is replaced atomically below.
    }

    return this.reset()
  }

  write(state: MockDatabaseState): MockDatabaseState {
    const snapshot = cloneState(state)
    this.#storage.setItem(DATABASE_STORAGE_KEY, JSON.stringify(snapshot))
    return cloneState(snapshot)
  }

  update(mutator: (draft: MockDatabaseState) => void): MockDatabaseState {
    const draft = this.read()
    mutator(draft)
    draft.revision += 1
    return this.write(draft)
  }

  reset(): MockDatabaseState {
    this.#storage.removeItem(DATABASE_STORAGE_KEY)
    return this.write(cloneState(createKnownDatabaseState()))
  }
}

export const mockDatabase = new PersistentMockDatabase()
