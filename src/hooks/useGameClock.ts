import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { advanceGameClock, MAX_CATCH_UP_MINUTES, type GameState } from '../domain/game'

type ClockTransform = (current: GameState, advanced: GameState) => GameState

export interface GameClockController {
  state: GameState
  setState: Dispatch<SetStateAction<GameState>>
  closeShift: () => void
  fastForward: (gameMinutes: number) => void
}

export const useGameClock = (initialState: GameState, transform?: ClockTransform): GameClockController => {
  const [state, setState] = useState(initialState)
  const lastRealAtRef = useRef(0)

  const advance = useCallback((current: GameState, elapsed: number, maxGameMinutes = Number.POSITIVE_INFINITY) => {
    const advanced = advanceGameClock(current, elapsed, maxGameMinutes)
    return transform ? transform(current, advanced) : advanced
  }, [transform])

  useEffect(() => {
    lastRealAtRef.current = Date.now()
    const timer = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastRealAtRef.current
      lastRealAtRef.current = now
      if (elapsed > 0) {
        setState((current) => advance(current, elapsed))
      }
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [advance])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now()
      const elapsed = now - lastRealAtRef.current
      lastRealAtRef.current = now

      if (document.visibilityState === 'visible' && elapsed > 0) {
        setState((current) => advance(current, elapsed, MAX_CATCH_UP_MINUTES))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [advance])

  const closeShift = useCallback(() => {
    setState((current) => ({
      ...current,
      day: current.day + 1,
      minuteOfDay: 8 * 60,
      lastEvent: 'Đã kết thúc ca',
    }))
  }, [])

  const fastForward = useCallback((gameMinutes: number) => {
    setState((current) => {
      const realElapsed = (gameMinutes * 60_000) / current.timeScale
      return advance(current, realElapsed, MAX_CATCH_UP_MINUTES)
    })
  }, [advance])

  return { state, setState, closeShift, fastForward }
}
