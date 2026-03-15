// components/play/SessionSidebar.tsx
// NEW FILE
"use client"
import { useSessionStore }      from "@/stores/sessionStore"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useGameStore }         from "@/stores/gameStore"
import { calculateScore }       from "@/engine/ScoreCalculator"
import Timer                    from "@/components/Timer"

interface Props { gameId: string; onHint?: () => void; hintCost: number }
export default function SessionSidebar({ gameId, onHint, hintCost }: Props) {
  const { status, timeElapsed, score }  = useSessionStore()
  const { state, config }              = useGameStore()
  const { get }                        = usePersonalBestStore()
  const best                           = get(gameId)

  const liveScore = status === "complete"
    ? score
    : (config && state ? calculateScore(config, timeElapsed, state) : 0)

  return (
    <div className="w-48 border-l border-gray-200 bg-white flex flex-col gap-0">

      {/* Timer */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time</p>
        <Timer />
        <p className="text-xs text-gray-400 mt-1">
          {status === "playing" ? "remaining" : status === "complete" ? "final" : "—"}
        </p>
      </div>

      {/* Score */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Score</p>
        <p className="text-2xl font-semibold text-indigo-600 tabular-nums">{liveScore}</p>
        <p className="text-xs text-gray-400 mt-0.5">of {config?.scoring.base ?? 0} max</p>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Errors</p>
            <p className={`text-xl font-semibold tabular-nums
              ${(state?.meta.errors??0) > 0 ? "text-red-500" : "text-gray-300"}`}>
              {state?.meta.errors ?? 0}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Hints</p>
            <p className="text-xl font-semibold tabular-nums text-gray-700">
              {state?.meta.hints ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Hint button */}
      {onHint && status === "playing" && (
        <div className="p-4 border-b border-gray-100">
          <button onClick={onHint}
            className="w-full text-xs py-2 rounded-lg border border-amber-200
              bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium">
            Use hint
            <span className="block text-amber-500 font-normal">−{hintCost} pts</span>
          </button>
        </div>
      )}

      {/* Personal best */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Personal best</p>
        {best
          ? <>
              <p className="text-base font-semibold text-indigo-500">{best.score} pts</p>
              <p className="text-xs text-gray-400">{best.timeTaken}s</p>
            </>
          : <p className="text-xs text-gray-300">Not set yet</p>
        }
      </div>
    </div>
  )
}
