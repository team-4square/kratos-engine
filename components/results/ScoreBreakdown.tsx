// components/results/ScoreBreakdown.tsx
// REPLACE entire file
"use client"
import { useEffect, useState } from "react"
import { JSONConfig }          from "@/lib/types"
import { GameState }           from "@/lib/types"

interface Props {
  config: JSONConfig; timeElapsed: number
  state: GameState;  finalScore: number
}

export default function ScoreBreakdown({ config, timeElapsed, state, finalScore }: Props) {
  const [visible, setVisible] = useState(0)
  const s = config.scoring

  const rows = [
    { label: "Base score",                  val: s.base,                          positive: true  },
    { label: `Time penalty  (${timeElapsed}s × ${s.timePenalty})`, val: -(timeElapsed*(s.timePenalty||0)), positive: false },
    ...(state.meta.errors>0&&s.errorPenalty ? [{ label:`Error penalty  (${state.meta.errors} × ${s.errorPenalty})`, val:-(state.meta.errors*s.errorPenalty), positive:false }] : []),
    ...(state.meta.hints>0&&s.hintPenalty   ? [{ label:`Hint penalty  (${state.meta.hints} × ${s.hintPenalty})`,    val:-(state.meta.hints*s.hintPenalty),   positive:false }] : []),
  ]

  useEffect(() => {
    if (visible >= rows.length+1) return
    const t = setTimeout(() => setVisible(v=>v+1), 350)
    return () => clearTimeout(t)
  }, [visible, rows.length])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
        Score breakdown
      </p>
      <div className="space-y-2">
        {rows.slice(0, visible).map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm
            transition-all duration-300">
            <span className="text-gray-500">{r.label}</span>
            <span className={`font-semibold tabular-nums
              ${r.positive ? "text-gray-800" : "text-red-500"}`}>
              {r.val > 0 ? `+${r.val}` : r.val}
            </span>
          </div>
        ))}
        {visible > rows.length && (
          <div className="flex justify-between items-center pt-3 mt-2
            border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-800">Final score</span>
            <span className="text-xl font-bold text-indigo-600 tabular-nums">{finalScore}</span>
          </div>
        )}
      </div>
    </div>
  )
}
