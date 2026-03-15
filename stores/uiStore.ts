// stores/uiStore.ts
// NEW FILE
"use client"
import { create } from "zustand"

interface UIStore {
  toasts:    { id: string; message: string; type: "success"|"error"|"info" }[]
  addToast:  (message: string, type?: "success"|"error"|"info") => void
  rmToast:   (id: string) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  toasts: [],
  addToast: (message, type="info") => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, {id, message, type}] }))
    setTimeout(() => get().rmToast(id), 3000)
  },
  rmToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}))
