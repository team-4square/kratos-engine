import { GameDefinition } from "@/lib/types"
import { sudokuLogic }      from "@/games/sudoku/sudoku.logic"
import { wordBuilderLogic } from "@/games/wordbuilder/wordbuilder.logic"

const REGISTRY: Record<string, GameDefinition> = {
  "grid": sudokuLogic,
  "word": wordBuilderLogic,
}

export function getGameLogic(type: string): GameDefinition {
  const logic = REGISTRY[type]
  if (!logic) throw new Error(`GameRegistry: unknown game type "${type}"`)
  return logic
}
