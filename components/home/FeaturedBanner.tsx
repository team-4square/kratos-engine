// components/home/FeaturedBanner.tsx
// NEW FILE
"use client"
import Link from "next/link"
import { GAME_REGISTRY } from "@/lib/gameRegistry"

export default function FeaturedBanner() {
  const featured = GAME_REGISTRY.find(g => g.isFeatured)
  if (!featured) return null
  return (
    <div className="bg-indigo-600 rounded-2xl p-6 mb-8 flex items-center justify-between">
      <div>
        <span className="text-indigo-200 text-xs font-medium uppercase tracking-wide">
          Featured game
        </span>
        <h2 className="text-white text-xl font-semibold mt-1 mb-1">{featured.title}</h2>
        <p className="text-indigo-200 text-sm max-w-xs">{featured.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-indigo-200">{featured.maxScore} pts max</span>
          <span className="text-indigo-400">·</span>
          <span className="text-xs text-indigo-200">{Math.floor(featured.timeLimit/60)} min</span>
          <span className="text-indigo-400">·</span>
          <span className="text-xs text-indigo-200 capitalize">{featured.difficulty}</span>
        </div>
      </div>
      <Link href={`/play/${featured.id}`}
        className="shrink-0 bg-white text-indigo-700 px-5 py-2.5 rounded-xl
          text-sm font-semibold hover:bg-indigo-50 transition-colors">
        Play now
      </Link>
    </div>
  )
}
