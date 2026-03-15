// components/home/HeroStats.tsx
// NEW FILE
"use client"
import { useEffect, useState }       from "react"
import { usePersonalBestStore }      from "@/stores/personalBestStore"
import { useRecentlyPlayedStore }    from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY }             from "@/lib/gameRegistry"

export default function HeroStats() {
  const [m, setM] = useState(false)
  const { load, getAll } = usePersonalBestStore()
  const { load: lRecent, recent } = useRecentlyPlayedStore()
  useEffect(() => { load(); lRecent(); setM(true) }, [])

  const bests       = m ? getAll() : {}
  const played      = Object.keys(bests).length
  const topScore    = m ? Math.max(0, ...Object.values(bests).map(b=>b.score)) : 0

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label:"Games available", val: GAME_REGISTRY.length, color:"text-indigo-600", sub:"ready to play"   },
        { label:"Games completed", val: played,               color:"text-teal-600",   sub:"out of " + GAME_REGISTRY.length },
        { label:"Your best score", val: topScore,             color:"text-amber-600",  sub:"across all games" },
      ].map(s => (
        <div key={s.label}
          className="bg-white rounded-xl border border-gray-200 p-5 text-center
            hover:border-indigo-200 transition-colors">
          <p className={`text-3xl font-semibold tabular-nums ${s.color}`}>{s.val}</p>
          <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
