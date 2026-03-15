// app/results/[gameId]/page.tsx
// NEW FILE
"use client"
import { useEffect, useState }  from "react"
import { useParams, useRouter } from "next/navigation"
import Link                     from "next/link"
import { useSessionStore }      from "@/stores/sessionStore"
import { useGameStore }         from "@/stores/gameStore"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY }        from "@/lib/gameRegistry"
import ScoreHero                from "@/components/results/ScoreHero"
import ScoreBreakdown           from "@/components/results/ScoreBreakdown"
import Leaderboard              from "@/components/Leaderboard"

export default function ResultsPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const { score, timeElapsed, status }   = useSessionStore()
  const { state, config }               = useGameStore()
  const { load, get }                   = usePersonalBestStore()
  const { load: lR, get: getRecent }    = useRecentlyPlayedStore()

  const [isNewBest, setIsNewBest] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    load(); lR(); setMounted(true)
    const best = get(gameId)
    setIsNewBest(best?.score === score && score > 0)
  }, [])

  const gameMeta = GAME_REGISTRY.find(g => g.id === gameId)

  // If navigated directly (no session), redirect home
  if (mounted && !config && !state) {
    router.replace("/")
    return null
  }

  if (!config || !state || !gameMeta) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent
        rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <ScoreHero
        score={score}
        maxScore={config.scoring.base}
        rank={null}
        isNewBest={isNewBest}
        title={config.title}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ScoreBreakdown
          config={config}
          timeElapsed={timeElapsed}
          state={state}
          finalScore={score}
        />
        <div className="flex flex-col gap-4">
          {/* Time card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Session stats
            </p>
            <div className="space-y-2">
              {[
                { label:"Time taken",  val:`${timeElapsed}s`          },
                { label:"Errors made", val:state.meta.errors           },
                { label:"Hints used",  val:state.meta.hints            },
                { label:"Moves made",  val:state.moves?.length ?? 0    },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="font-medium text-gray-700">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personal best card */}
          {mounted && (() => {
            const best = get(gameId)
            return best ? (
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-3">
                  Personal best
                </p>
                <p className="text-2xl font-bold text-indigo-700">{best.score}</p>
                <p className="text-xs text-indigo-400 mt-1">{best.timeTaken}s · {new Date(best.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
              </div>
            ) : null
          })()}
        </div>
      </div>

      {/* Leaderboard preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-700">Top scores</p>
          <Link href={`/leaderboard/${gameId}`}
            className="text-xs text-indigo-600 hover:text-indigo-800">
            View full →
          </Link>
        </div>
        <Leaderboard gameId={gameId}/>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push(`/play/${gameId}`)}
          className="flex-1 py-3 rounded-xl border-2 border-indigo-200
            text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors">
          Play Again
        </button>
        <button onClick={() => router.push("/")}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white
            font-semibold text-sm hover:bg-indigo-700 transition-colors">
          All Games
        </button>
        <Link href={`/leaderboard/${gameId}`}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700
            font-semibold text-sm hover:bg-gray-200 transition-colors text-center">
          Leaderboard
        </Link>
      </div>
    </div>
  )
}
