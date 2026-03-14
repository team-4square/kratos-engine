// games/wordbuilder/wordbuilder.logic.ts
import { GameDefinition, JSONConfig, GameState, Action } from "@/lib/types"

export const wordBuilderLogic: GameDefinition = {

  initialState: (config: JSONConfig): GameState => ({
    board: {
      available:   config.config.letters as string[],
      found:       [] as string[],
      current:     [] as string[],
      targetWords: config.config.targetWords as string[]
    },
    moves: [],
    meta:  { errors: 0, hints: 0, minLength: config.config.minLength }
  }),

  reducer: (state: GameState, action: Action): GameState => {
    const board = state.board as any

    if (action.type === "SELECT_LETTER") {
      return { ...state, board: { ...board, current: [...board.current, action.letter] } }
    }
    if (action.type === "REMOVE_LETTER") {
      return { ...state, board: { ...board, current: board.current.slice(0, -1) } }
    }
    if (action.type === "CLEAR_WORD") {
      return { ...state, board: { ...board, current: [] } }
    }
    if (action.type === "SUBMIT_WORD") {
      const word    = board.current.join("").toUpperCase()
      const isValid = board.targetWords.includes(word)
      const isNew   = !board.found.includes(word)
      const isLong  = word.length >= state.meta.minLength

      if (isValid && isNew && isLong) {
        return { ...state, board: { ...board, found: [...board.found, word], current: [] },
                 moves: [...state.moves, action] }
      }
      return { ...state, board: { ...board, current: [] },
               meta: { ...state.meta, errors: state.meta.errors + 1 },
               moves: [...state.moves, action] }
    }
    return state
  },

  winCondition: (state: GameState): boolean => {
    const board = state.board as any
    return board.targetWords.every((w: string) => board.found.includes(w))
  }
}
