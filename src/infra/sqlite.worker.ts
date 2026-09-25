import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm'

type SavePayload = {
  state: string
  checkpointId: string
  savedAt: number
}

type WorkerRequest = {
  id: number
  type: 'init' | 'save' | 'load' | 'clear'
  payload?: SavePayload
}

type WorkerResponse = {
  id: number
  ok: boolean
  result?: unknown
  error?: string
}

type StoredRow = {
  state: string
  checkpoint_id: string
  saved_at: number
}

let database: Database | undefined
let storageMode: 'opfs' | 'sqlite-memory' = 'sqlite-memory'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (message: WorkerResponse) => void
}

const initialize = async () => {
  const sqlite3 = await sqlite3InitModule()
  const hasOpfs = 'opfs' in sqlite3 && typeof sqlite3.oo1.OpfsDb === 'function'

  database = hasOpfs
    ? new sqlite3.oo1.OpfsDb('/hotel-management-v1.sqlite3')
    : new sqlite3.oo1.DB('/hotel-management-v1.sqlite3', 'c')

  storageMode = hasOpfs ? 'opfs' : 'sqlite-memory'

  database.exec(
    'CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), state TEXT NOT NULL, checkpoint_id TEXT NOT NULL, saved_at INTEGER NOT NULL)',
  )

  return {
    storageMode,
    sqliteVersion: sqlite3.version.libVersion,
    opfsNamespace: 'opfs' in sqlite3,
    opfsDirectoryApi: typeof navigator.storage?.getDirectory === 'function',
    syncAccessHandle: typeof FileSystemFileHandle !== 'undefined' && typeof (FileSystemFileHandle.prototype as { createSyncAccessHandle?: unknown }).createSyncAccessHandle === 'function',
  }
}

const save = (payload: SavePayload) => {
  if (!database || !payload) {
    throw new Error('Database is not initialized')
  }

  database.exec('BEGIN')
  try {
    database.exec({
      sql: 'INSERT INTO app_state (id, state, checkpoint_id, saved_at) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET state = excluded.state, checkpoint_id = excluded.checkpoint_id, saved_at = excluded.saved_at',
      bind: [payload.state, payload.checkpointId, payload.savedAt],
    })
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }

  return {
    storageMode,
    checkpointId: payload.checkpointId,
    savedAt: payload.savedAt,
  }
}

const load = () => {
  if (!database) {
    throw new Error('Database is not initialized')
  }

  const rows = database.exec({
    sql: 'SELECT state, checkpoint_id, saved_at FROM app_state WHERE id = 1',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as StoredRow[]

  if (rows.length === 0) {
    return null
  }

  return {
    state: rows[0].state,
    checkpointId: rows[0].checkpoint_id,
    savedAt: rows[0].saved_at,
  }
}

const clear = () => {
  if (!database) {
    throw new Error('Database is not initialized')
  }

  database.exec('DELETE FROM app_state')
  return { storageMode }
}

scope.onmessage = async (event) => {
  const request = event.data
  try {
    let result: unknown
    switch (request.type) {
      case 'init':
        result = await initialize()
        break
      case 'save':
        if (!request.payload) {
          throw new Error('Save payload is required')
        }
        result = save(request.payload)
        break
      case 'load':
        result = load()
        break
      case 'clear':
        result = clear()
        break
      default:
        throw new Error('Unknown persistence request')
    }

    scope.postMessage({ id: request.id, ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown persistence error'
    scope.postMessage({ id: request.id, ok: false, error: message })
  }
}
