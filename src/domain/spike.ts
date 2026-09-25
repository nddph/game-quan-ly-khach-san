export const TIME_SCALE = 10
export const MAX_CATCH_UP_MINUTES = 24 * 60

export type PersistenceMode = 'opfs' | 'sqlite-memory' | 'local-fallback'

export interface SpikeState {
  hotelName: string
  day: number
  minuteOfDay: number
  cashVND: number
  roomsAvailable: number
  roomsOccupied: number
  guestsCheckedIn: number
  reviewsCreated: number
  lastEvent: string
  lastSavedAt: number
  timeScale: number
}

export interface Snapshot {
  state: SpikeState
  checkpointId: string
  savedAt: number
}

export const createInitialState = (): SpikeState => ({
  hotelName: 'Khách sạn Đà Nẵng',
  day: 1,
  minuteOfDay: 8 * 60,
  cashVND: 180_000_000,
  roomsAvailable: 12,
  roomsOccupied: 0,
  guestsCheckedIn: 0,
  reviewsCreated: 0,
  lastEvent: 'Khách sạn đã sẵn sàng',
  lastSavedAt: Date.now(),
  timeScale: TIME_SCALE,
})

export const advanceGameClock = (
  state: SpikeState,
  realElapsedMs: number,
  maxGameMinutes = Number.POSITIVE_INFINITY,
): SpikeState => {
  const realMinutes = Math.max(0, realElapsedMs / 60_000)
  const requestedGameMinutes = Math.floor(realMinutes * state.timeScale)
  const gameMinutes = Math.min(requestedGameMinutes, maxGameMinutes)
  const totalMinutes = state.minuteOfDay + gameMinutes
  const dayOffset = Math.floor(totalMinutes / (24 * 60))
  const minuteOfDay = totalMinutes % (24 * 60)

  return {
    ...state,
    day: state.day + dayOffset,
    minuteOfDay,
  }
}

export const formatGameTime = (minuteOfDay: number): string => {
  const hours = Math.floor(minuteOfDay / 60) % 24
  const minutes = Math.floor(minuteOfDay % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const formatVnd = (amount: number, locale = 'vi-VN'): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
