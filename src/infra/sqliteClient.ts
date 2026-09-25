import { normalizeGameState, type PersistenceMode, type SaveSnapshot, type GameState } from '../domain/game'

type WorkerRequest = {
  id: number
  type: 'init' | 'save' | 'load' | 'clear'
  payload?: {
    state: string
    checkpointId: string
    savedAt: number
  }
}

type WorkerResponse = {
  id: number
  ok: boolean
  result?: unknown
  error?: string
}

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

type InitResult = {
  storageMode: PersistenceMode
  sqliteVersion: string
  opfsNamespace?: boolean
  opfsDirectoryApi?: boolean
  syncAccessHandle?: boolean
}

const STORAGE_KEY = 'hotel-management-save-v1'
const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' })
const pending = new Map<number, PendingRequest>()
let requestId = 0
let initialized = false
let usingFallback = false
let memorySnapshot: SaveSnapshot | null = null

worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
  const response = event.data
  const request = pending.get(response.id)
  if (!request) {
    return
  }

  pending.delete(response.id)
  if (response.ok) {
    request.resolve(response.result)
  } else {
    request.reject(new Error(response.error ?? 'Persistence request failed'))
  }
}

worker.onerror = () => {
  for (const request of pending.values()) {
    request.reject(new Error('SQLite worker failed'))
  }
  pending.clear()
}

const request = <T>(type: WorkerRequest['type'], payload?: WorkerRequest['payload']): Promise<T> => {
  const id = ++requestId
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    })
    worker.postMessage({ id, type, payload })
  })
}

const normalizeSnapshot = (snapshot: SaveSnapshot | null): SaveSnapshot | null => {
  if (!snapshot) {
    return null
  }
  const state = normalizeGameState(snapshot.state)
  return state ? { ...snapshot, state } : null
}

const readFallback = (): SaveSnapshot | null => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return normalizeSnapshot(memorySnapshot)
  }

  try {
    return normalizeSnapshot(JSON.parse(stored) as SaveSnapshot)
  } catch {
    return normalizeSnapshot(memorySnapshot)
  }
}

const writeFallback = (snapshot: SaveSnapshot) => {
  memorySnapshot = snapshot
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export const initializePersistence = async (): Promise<InitResult> => {
  if (initialized && !usingFallback) {
    return request<InitResult>('init')
  }

  try {
    const result = await request<InitResult>('init')
    initialized = true
    usingFallback = result.storageMode !== 'opfs'
    return result
  } catch {
    worker.terminate()
    usingFallback = true
    initialized = true
    return {
      storageMode: 'local-fallback',
      sqliteVersion: 'Không dùng SQLite',
    }
  }
}

export const loadSnapshot = async (): Promise<SaveSnapshot | null> => {
  if (usingFallback) {
    return readFallback()
  }

  try {
    const result = await request<{
      state: string
      checkpointId: string
      savedAt: number
    } | null>('load')
    if (!result) {
      return null
    }
    const state = normalizeGameState(JSON.parse(result.state) as unknown)
    if (!state) {
      return null
    }
    return {
      state,
      checkpointId: result.checkpointId,
      savedAt: result.savedAt,
    }
  } catch {
    usingFallback = true
    return readFallback()
  }
}

export const saveSnapshot = async (state: GameState): Promise<SaveSnapshot> => {
  const savedAt = Date.now()
  const checkpointId = crypto.randomUUID()
  const snapshot: SaveSnapshot = { state, checkpointId, savedAt }

  if (usingFallback) {
    writeFallback(snapshot)
    return snapshot
  }

  try {
    await request('save', {
      state: JSON.stringify(state),
      checkpointId,
      savedAt,
    })
  } catch {
    usingFallback = true
    writeFallback(snapshot)
  }

  return snapshot
}

export const clearSnapshot = async (): Promise<void> => {
  if (usingFallback) {
    memorySnapshot = null
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  try {
    await request('clear')
  } catch {
    usingFallback = true
    memorySnapshot = null
    localStorage.removeItem(STORAGE_KEY)
  }
}
