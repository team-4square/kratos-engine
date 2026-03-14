// components/ScoreCard.tsx
"use client"
import { useSessionStore } from "@/stores/sessionStore"
import { useGameStore }    from "@/stores/gameStore"
import { calculateScore }  from "@/engine/ScoreCalculator"

export default function ScoreCard() {
  const status      = useSessionStore(s => s.status)
  const finalScore  = useSessionStore(s => s.score)
  const timeElapsed = useSessionStore(s => s.timeElapsed)
  const state       = useGameStore(s => s.state)
  const config      = useGameStore(s => s.config)

  const display = status === "complete"
    ? finalScore
    : (config && state ? calculateScore(config, timeElapsed, state) : 0)

  return <div className="text-2xl font-semibold text-indigo-600">{display} pts</div>
}
