// components/home/SortControl.tsx
// NEW FILE
"use client"
import { SortOption, SORT_OPTIONS } from "@/lib/gameRegistry"
const LABELS: Record<SortOption,string> = {
  featured:"Featured first", score:"Highest score", time:"Shortest time",
  difficulty:"Easiest first", newest:"Newest"
}
interface Props { value:SortOption; onChange:(s:SortOption)=>void }
export default function SortControl({value,onChange}:Props) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-gray-400">Sort</span>
      <select value={value} onChange={e=>onChange(e.target.value as SortOption)}
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white
          text-gray-600 outline-none focus:border-indigo-400 cursor-pointer transition-colors">
        {SORT_OPTIONS.map(o=><option key={o} value={o}>{LABELS[o]}</option>)}
      </select>
    </div>
  )
}
