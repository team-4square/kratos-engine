import { GameDefinition } from "@/lib/types"
import { sudokuLogic }      from "@/games/sudoku/sudoku.logic"
import { wordBuilderLogic } from "@/games/wordbuilder/wordbuilder.logic"
import SudokuBoard          from "@/components/play/SudokuBoard"
import WordBoardUI          from "@/components/play/WordBoardUI"

const LOGIC_REGISTRY: Record<string, GameDefinition> = {
  "sudoku":      sudokuLogic,
  "wordBuilder": wordBuilderLogic,
}

const RENDERER_REGISTRY: Record<string, any> = {
  "grid": SudokuBoard,
  "word": WordBoardUI,
}

export function getGameLogic(type: string): GameDefinition {
  const logic = LOGIC_REGISTRY[type]
  if (!logic) throw new Error(`GameRegistry: unknown game type "${type}"`)
  return logic
}

export function getRenderer(type: string): any {
  const renderer = RENDERER_REGISTRY[type]
  if (!renderer) throw new Error(`GameRegistry: unknown renderer type "${type}"`)
  return renderer
}
