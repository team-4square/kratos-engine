// components/home/GameCard.tsx
// NEW FILE
"use client"
import Link from "next/link"
import { GameMeta, formatTime }  from "@/lib/gameRegistry"
import { PersonalBest }          from "@/stores/personalBestStore"
import { DIFFICULTY_STYLES, CATEGORY_STYLES } from "@/lib/constants"

interface Props { game:GameMeta; best?:PersonalBest|null; isRecent?:boolean }

export default function GameCard({game,best,isRecent}:Props) {
  const pct     = best ? Math.min(100,Math.round((best.score/game.maxScore)*100)) : 0
  const catStyle = CATEGORY_STYLES[game.category]
  const difStyle = DIFFICULTY_STYLES[game.difficulty]

  return (
    <div className={`bg-white rounded-xl border flex flex-col overflow-hidden
      hover:shadow-sm transition-all
      ${isRecent ? "border-indigo-200" : "border-gray-200 hover:border-indigo-200"}`}>

      {/* Header badges */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catStyle?.badge??""}`}>
            {game.category}
          </span>
          {game.isNew    && <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">New</span>}
          {game.isFeatured && <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100">Featured</span>}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difStyle.badge}`}>
          {game.difficulty}
        </span>
      </div>

      {/* Title + description */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-gray-800 text-sm mb-1">{game.title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{game.description}</p>
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap px-4 pb-3">
        {game.tags.map(t=>(
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400
            rounded border border-gray-100">{t}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2.5
        border-t border-gray-50 bg-gray-50">
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-gray-400">Max score</p>
            <p className="text-xs font-semibold text-gray-700">{game.maxScore}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Time limit</p>
            <p className="text-xs font-semibold text-gray-700">{formatTime(game.timeLimit)}</p>
          </div>
        </div>
        {best
          ? <div className="text-right"><p className="text-xs text-gray-400">Your best</p><p className="text-xs font-semibold text-indigo-600">{best.score} pts</p></div>
          : <p className="text-xs text-gray-300">Not played yet</p>
        }
      </div>

      {/* Progress bar */}
      {best && (
        <div className="px-4 py-2 border-t border-gray-50">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Score progress</span>
            <span className="text-xs text-indigo-500 font-medium">{pct}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{width:`${pct}%`}}/>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-4 pt-3">
        <Link href={`/play/${game.id}`}
          className={`block text-center text-sm px-4 py-2 rounded-lg
            font-medium transition-colors
            ${best
              ? "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
              : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {best ? "Play Again" : "Play"}
        </Link>
      </div>
    </div>
  )
}
