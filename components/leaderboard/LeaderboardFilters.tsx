// components/leaderboard/LeaderboardFilters.tsx
// NEW FILE
"use client"
const FILTERS = ["all time","this week","today"] as const
type Filter = typeof FILTERS[number]
interface Props { active:Filter; onChange:(f:Filter)=>void; total:number }
export default function LeaderboardFilters({active,onChange,total}:Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={()=>onChange(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
              ${active===f
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">{total} players</p>
    </div>
  )
}
