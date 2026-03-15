// app/profile/page.tsx
// NEW FILE
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY } from "@/lib/gameRegistry"
import { DIFFICULTY_STYLES } from "@/lib/constants"

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const { load: lB, getAll } = usePersonalBestStore()
  const { load: lR, get } = useRecentlyPlayedStore()

  useEffect(() => { lB(); lR(); setMounted(true) }, [])

  const bests = mounted ? getAll() : {}
  const recent = mounted ? get(10) : []

  const gamesPlayed = Object.keys(bests).length
  const totalScore = Object.values(bests).reduce((s, b) => s + b.score, 0)
  const bestScore = Math.max(0, ...Object.values(bests).map(b => b.score))
  const avgTime = recent.length
    ? Math.round(recent.reduce((s, r) => s + r.timeTaken, 0) / recent.length)
    : 0

  const achievements = [
    { label: "First play", earned: gamesPlayed >= 1, desc: "Complete your first game" },
    { label: "All games", earned: gamesPlayed >= GAME_REGISTRY.length, desc: "Play every game at least once" },
    { label: "High scorer", earned: bestScore >= 900, desc: "Score 900+ in any game" },
    { label: "Speed runner", earned: avgTime > 0 && avgTime < 90, desc: "Average under 90 seconds" },
    { label: "Dedicated", earned: recent.length >= 5, desc: "Play 5 or more games" },
    { label: "Perfectionist", earned: Object.values(bests).some(b => b.score >= 950), desc: "Score 950+ in any game" },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6
        flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center
          justify-center text-white text-2xl font-bold">
          G
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">Guest Player</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kratos Engine · League 1</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Member since</p>
          <p className="text-sm font-medium text-gray-600">March 2026</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Games played", val: gamesPlayed, color: "text-indigo-600" },
          { label: "Total score", val: totalScore, color: "text-teal-600" },
          { label: "Best score", val: bestScore, color: "text-amber-600" },
          { label: "Avg time (s)", val: avgTime || "—", color: "text-purple-600" },
        ].map(s => (
          <div key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Personal bests per game */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Personal bests</h2>
          <span className="text-xs text-gray-400">{gamesPlayed} games</span>
        </div>
        {GAME_REGISTRY.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No games played yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {GAME_REGISTRY.map(g => {
              const best = bests[g.id]
              const pct = best ? Math.min(100, Math.round((best.score / g.maxScore) * 100)) : 0
              return (
                <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-700">{g.title}</p>
                      <span className={`text-xs font-medium px-2 py-0 rounded-full border
                        ${DIFFICULTY_STYLES[g.difficulty].badge}`}>
                        {g.difficulty}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    {best
                      ? <>
                        <p className="text-sm font-semibold text-indigo-600">{best.score} pts</p>
                        <p className="text-xs text-gray-400">{best.timeTaken}s</p>
                      </>
                      : <Link href={`/play/${g.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Play now →
                      </Link>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Achievements</h2>
          <span className="text-xs text-gray-400">
            {achievements.filter(a => a.earned).length} / {achievements.length} earned
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {achievements.map(a => (
            <div key={a.label}
              className={`rounded-xl border p-4 text-center transition-all
                ${a.earned
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-100 bg-gray-50 opacity-50"}`}>
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center
                justify-center text-lg
                ${a.earned ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                {a.earned ? "✓" : "?"}
              </div>
              <p className={`text-xs font-semibold mb-1
                ${a.earned ? "text-indigo-800" : "text-gray-500"}`}>
                {a.label}
              </p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Play history</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map((r, i) => {
              const meta = GAME_REGISTRY.find(g => g.id === r.gameId)
              const pct = Math.min(100, Math.round((r.score / (meta?.maxScore ?? 1000)) * 100))
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">{r.title}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(r.playedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <p className="text-sm font-semibold text-indigo-600">{r.score}</p>
                    <p className="text-xs text-gray-400">{r.timeTaken}s</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
