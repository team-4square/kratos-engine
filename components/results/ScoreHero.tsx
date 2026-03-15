// components/results/ScoreHero.tsx
// NEW FILE
"use client"
interface Props {
  score: number; maxScore: number; rank: number|null
  isNewBest: boolean; title: string
}
export default function ScoreHero({ score, maxScore, rank, isNewBest, title }: Props) {
  const pct = Math.min(100, Math.round((score/maxScore)*100))
  return (
    <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white mb-6">
      {isNewBest && (
        <div className="inline-block bg-amber-400 text-amber-900 text-xs font-bold
          px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          New personal best!
        </div>
      )}
      <p className="text-indigo-200 text-sm mb-2">{title}</p>
      <p className="text-6xl font-bold tabular-nums mb-1">{score}</p>
      <p className="text-indigo-200 text-sm">out of {maxScore} points</p>
      <div className="mt-5 h-2 bg-indigo-500 rounded-full overflow-hidden max-w-xs mx-auto">
        <div className="h-full bg-white rounded-full transition-all duration-700"
          style={{width:`${pct}%`}}/>
      </div>
      <p className="text-indigo-200 text-xs mt-2">{pct}% of max score</p>
      {rank && (
        <div className="mt-4 inline-flex items-center gap-2 bg-indigo-500
          px-4 py-2 rounded-full text-sm">
          <span className="text-indigo-200">Your rank</span>
          <span className="font-bold">#{rank}</span>
        </div>
      )}
    </div>
  )
}
