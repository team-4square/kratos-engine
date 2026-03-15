"use client"
import { create } from "zustand"
import { GameState, Action, JSONConfig, GameDefinition } from "@/lib/types"

interface GameStore {
  state:    GameState | null
  config:   JSONConfig | null
  logic:    GameDefinition | null
  setGame:  (config: JSONConfig, logic: GameDefinition) => void
  dispatch: (action: Action) => void
  reset:    () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  state:   null,
  config:  null,
  logic:   null,

  setGame: (config, logic) => {
    set({ config, logic, state: logic.initialState(config) })
  },

  dispatch: (action) => {
    const { state, logic } = get()
    if (!state || !logic) return
    set({ state: logic.reducer(state, action) })
  },

  reset: () => set({ state: null, config: null, logic: null })
}))
