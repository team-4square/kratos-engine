// components/home/RecentlyPlayed.tsx
// NEW FILE
"use client"
import { useEffect }              from "react"
import Link                       from "next/link"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"

export default function RecentlyPlayed() {
  const { load, get } = useRecentlyPlayedStore()
  useEffect(() => { load() }, [])
  const recent = get(4)
  if (!recent.length) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Continue playing</h2>
        <span className="text-xs text-gray-400">{recent.length} recent</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {recent.map(r => {
          const pct = Math.min(100, Math.round((r.score/r.maxScore)*100))
          return (
            <Link key={r.gameId} href={`/play/${r.gameId}`}
              className="bg-white border border-gray-200 rounded-xl p-3
                hover:border-indigo-200 transition-all group">
              <p className="text-xs font-medium text-gray-700 mb-2 group-hover:text-indigo-700
                transition-colors truncate">{r.title}</p>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-base font-semibold text-indigo-600">{r.score}</span>
                <span className="text-xs text-gray-400">{r.timeTaken}s</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{width:`${pct}%`}}/>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {new Date(r.playedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
