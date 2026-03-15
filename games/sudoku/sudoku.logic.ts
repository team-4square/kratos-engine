import { GameDefinition, JSONConfig, GameState, Action } from "@/lib/types"

function buildBoard(gridSize: number, prefilled: number[][]): number[][] {
  const board: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
  prefilled.forEach(([r, c, v]) => { board[r][c] = v })
  return board
}

function countErrors(board: number[][]): number {
  let errors = 0
  const size = board.length
  const boxSize = Math.sqrt(size)

  for (let r = 0; r < size; r++) {
    const vals = board[r].filter(v => v !== 0)
    if (new Set(vals).size !== vals.length) errors++
  }
  for (let c = 0; c < size; c++) {
    const vals = board.map(r => r[c]).filter(v => v !== 0)
    if (new Set(vals).size !== vals.length) errors++
  }
  for (let br = 0; br < boxSize; br++) {
    for (let bc = 0; bc < boxSize; bc++) {
      const vals: number[] = []
      for (let r = 0; r < boxSize; r++)
        for (let c = 0; c < boxSize; c++)
          vals.push(board[br * boxSize + r][bc * boxSize + c])
      const nonZero = vals.filter(v => v !== 0)
      if (new Set(nonZero).size !== nonZero.length) errors++
    }
  }
  return errors
}

function isBoardComplete(board: number[][]): boolean {
  return board.every(row => row.every(cell => cell !== 0))
}

export const sudokuLogic: GameDefinition = {

  initialState: (config: JSONConfig): GameState => ({
    board: buildBoard(config.config.gridSize, config.config.prefilled),
    moves: [],
    meta:  { errors: 0, hints: 0 }
  }),

  reducer: (state: GameState, action: Action): GameState => {
    const board = state.board as number[][]

    if (action.type === "PLACE_NUMBER") {
      const newBoard = board.map((r, ri) =>
        r.map((cell, ci) => (ri === action.row && ci === action.col ? action.value : cell))
      )
      return { ...state, board: newBoard, moves: [...state.moves, action],
               meta: { ...state.meta, errors: countErrors(newBoard) } }
    }

    if (action.type === "ERASE") {
      const newBoard = board.map((r, ri) =>
        r.map((cell, ci) => (ri === action.row && ci === action.col ? 0 : cell))
      )
      return { ...state, board: newBoard, moves: [...state.moves, action],
               meta: { ...state.meta, errors: countErrors(newBoard) } }
    }

    if (action.type === "USE_HINT") {
      const solution = action.config?.config.solution as number[][]
      if (!solution) return state

      // Find all empty cells (value 0)
      const emptyCells: [number, number][] = []
      board.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell === 0) emptyCells.push([ri, ci])
        })
      })

      if (emptyCells.length === 0) return state

      // Pick the first empty cell for simplicity (or we could pick random)
      const [r, c] = emptyCells[0]
      const hintValue = solution[r][c]
      
      const newBoard = board.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? hintValue : cell))
      )

      return {
        ...state,
        board: newBoard,
        moves: [...state.moves, action],
        meta: { ...state.meta, hints: (state.meta.hints || 0) + 1, errors: countErrors(newBoard) }
      }
    }

    return state
  },

  winCondition: (state: GameState): boolean => {
    const board = state.board as number[][]
    return isBoardComplete(board) && countErrors(board) === 0
  }
}
