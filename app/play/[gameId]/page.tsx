"use client"
import { useEffect, useState }  from "react"
import { useParams, useRouter } from "next/navigation"
import { loadConfig }           from "@/engine/GameLoader"
import { getGameLogic }         from "@/engine/GameRegistry"
import { calculateScore }       from "@/engine/ScoreCalculator"
import { submitScore }          from "@/engine/ScoreSubmitter"
import { useGameStore }         from "@/stores/gameStore"
import { useSessionStore }      from "@/stores/sessionStore"
import { JSONConfig }           from "@/lib/types"
import Timer                    from "@/components/Timer"
import ScoreCard                from "@/components/ScoreCard"
import Leaderboard              from "@/components/Leaderboard"
import Sudoku                   from "@/games/sudoku/Sudoku"
import WordBuilder              from "@/games/wordbuilder/WordBuilder"

const RENDERERS: Record<string, React.ComponentType<any>> = {
  "grid": Sudoku,
  "word": WordBuilder,
}

export default function PlayPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const [config, setConfig]       = useState<JSONConfig | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { state, setGame, reset: resetGame }                          = useGameStore()
  const { startSession, stopSession, status, timeElapsed,
          setScore, reset: resetSession }                             = useSessionStore()

  useEffect(() => {
    async function boot() {
      try {
        resetGame(); resetSession()
        const cfg   = await loadConfig(gameId)
        const logic = getGameLogic(cfg.type)
        setGame(cfg, logic)
        setConfig(cfg)
        startSession(cfg.timer.seconds)
      } catch (e: any) { setError(e.message) }
    }
    boot()
    return () => resetSession()
  }, [gameId])

  useEffect(() => {
    if (!state || !config || status !== "playing" || submitted) return
    const logic = getGameLogic(config.type)
    if (logic.winCondition(state)) {
      stopSession()
      const finalScore = calculateScore(config, timeElapsed, state)
      setScore(finalScore)
      setSubmitted(true)
      submitScore({ userId: "guest", gameId, score: finalScore, timeTaken: timeElapsed })
    }
  }, [state])

  if (error)             return <div className="p-8 text-red-500">{error}</div>
  if (!config || !state) return <div className="p-8 text-gray-400">Loading game...</div>

  const Renderer = RENDERERS[config.type]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">{config.title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            {config.difficulty}
          </span>
          <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800">Quit</button>
        </div>
      </nav>
      <div className="flex gap-8 p-8 max-w-4xl mx-auto">
        <div className="flex-1 flex items-start justify-center pt-4">
          {status === "complete" ? (
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold">Game Complete!</p>
              <ScoreCard />
              <button onClick={() => router.push(`/leaderboard/${gameId}`)}
                className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                View Leaderboard →
              </button>
            </div>
          ) : (
            <Renderer prefilled={config.config.prefilled ?? []} config={config.config} />
          )}
        </div>
        <div className="w-44 flex flex-col gap-6 pt-4">
          <div><p className="text-xs text-gray-400 mb-1">Time</p><Timer /></div>
          <div><p className="text-xs text-gray-400 mb-1">Score</p><ScoreCard /></div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Errors</p>
            <p className={`text-2xl font-semibold ${state.meta.errors>0?"text-red-500":"text-gray-300"}`}>
              {state.meta.errors}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
