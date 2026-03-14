// engine/ScoreCalculator.ts
import { JSONConfig, GameState } from "@/lib/types"

export function calculateScore(
  config: JSONConfig,
  timeElapsed: number,
  state: GameState
): number {
  const { base, timePenalty, errorPenalty = 0, hintPenalty = 0 } = config.scoring
  const score =
    base
    - (timeElapsed       * timePenalty)
    - (state.meta.errors * errorPenalty)
    - (state.meta.hints  * hintPenalty)
  return Math.max(0, Math.round(score))
}
