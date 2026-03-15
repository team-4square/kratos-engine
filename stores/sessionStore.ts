"use client"
import { create } from "zustand"

type Status = "idle" | "playing" | "complete"

interface SessionStore {
  status:       Status
  timer:        number
  timeElapsed:  number
  score:        number
  intervalId:   ReturnType<typeof setInterval> | null
  startSession: (seconds: number) => void
  stopSession:  () => void
  setScore:     (score: number) => void
  reset:        () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  status:      "idle",
  timer:       0,
  timeElapsed: 0,
  score:       0,
  intervalId:  null,

  startSession: (seconds) => {
    const id = setInterval(() => {
      const { timer } = get()
      if (timer <= 1) {
        clearInterval(get().intervalId!)
        set({ timer: 0, status: "complete" })
      } else {
        set(s => ({ timer: s.timer - 1, timeElapsed: s.timeElapsed + 1 }))
      }
    }, 1000)
    set({ timer: seconds, timeElapsed: 0, status: "playing", intervalId: id })
  },

  stopSession: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set(s => ({ status: "complete", timeElapsed: s.timeElapsed + 1, intervalId: null }))
  },

  setScore: (score) => set({ score }),

  reset: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ status: "idle", timer: 0, timeElapsed: 0, score: 0, intervalId: null })
  }
}))
