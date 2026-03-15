// stores/personalBestStore.ts
// REPLACE entire file
"use client"
import { create } from "zustand"

export interface PersonalBest {
  score: number; timeTaken: number; date: string
}

interface Store {
  bests:    Record<string, PersonalBest>
  load:     () => void
  get:      (id: string) => PersonalBest | null
  getAll:   () => Record<string, PersonalBest>
  set_:     (id: string, score: number, time: number) => boolean
  clear:    () => void
}

const KEY = "taptap_bests"

export const usePersonalBestStore = create<Store>((set, get) => ({
  bests: {},
  load:  () => { try { const r=localStorage.getItem(KEY); if(r) set({bests:JSON.parse(r)}) } catch{} },
  get:   (id) => get().bests[id]??null,
  getAll:() => get().bests,
  set_:  (id, score, time) => {
    const ex = get().bests[id]
    const ok = !ex || score > ex.score
    if (ok) {
      const u = {...get().bests, [id]: {score, timeTaken:time, date:new Date().toISOString()}}
      set({bests:u}); try{localStorage.setItem(KEY,JSON.stringify(u))}catch{}
    }
    return ok
  },
  clear: () => { set({bests:{}}); try{localStorage.removeItem(KEY)}catch{} }
}))
