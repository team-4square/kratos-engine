// stores/recentlyPlayedStore.ts
// NEW FILE
"use client"
import { create } from "zustand"

export interface RecentPlay {
  gameId: string; title: string; score: number
  timeTaken: number; playedAt: string; maxScore: number
}

interface Store {
  recent:  RecentPlay[]
  load:    () => void
  add:     (p: RecentPlay) => void
  get:     (n?: number) => RecentPlay[]
  clear:   () => void
}

const KEY = "taptap_recent"

export const useRecentlyPlayedStore = create<Store>((set, get) => ({
  recent: [],
  load:   () => { try { const r=localStorage.getItem(KEY); if(r) set({recent:JSON.parse(r)}) } catch{} },
  add:    (p) => {
    const u = [p, ...get().recent.filter(r=>r.gameId!==p.gameId)].slice(0,10)
    set({recent:u}); try{localStorage.setItem(KEY,JSON.stringify(u))}catch{}
  },
  get:    (n=5) => get().recent.slice(0,n),
  clear:  () => { set({recent:[]}); try{localStorage.removeItem(KEY)}catch{} }
}))
