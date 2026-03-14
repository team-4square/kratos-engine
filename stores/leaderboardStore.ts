// stores/leaderboardStore.ts
"use client"
import { create } from "zustand"

export interface LeaderboardEntry {
  userId:    string
  score:     number
  timeTaken: number
}

interface LeaderboardStore {
  entries:    LeaderboardEntry[]
  loading:    boolean
  setEntries: (entries: LeaderboardEntry[]) => void
  setLoading: (loading: boolean) => void
}

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  entries:    [],
  loading:    false,
  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ loading })
}))
