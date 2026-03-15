// components/home/CategoryFilter.tsx
// NEW FILE
"use client"
import { Category, CATEGORIES } from "@/lib/gameRegistry"
import { CATEGORY_STYLES }      from "@/lib/constants"

const INACTIVE = "text-gray-500 border-gray-200 bg-white hover:border-indigo-300 hover:text-indigo-600"
const ACTIVE_ALL = "bg-indigo-600 text-white border-indigo-600"

interface Props { active:Category; counts:Record<string,number>; onChange:(c:Category)=>void }
export default function CategoryFilter({active,counts,onChange}:Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(cat => {
        const count = counts[cat]??0
        if (cat!=="all" && count===0) return null
        const isActive = active===cat
        const style = cat==="all"
          ? (isActive ? ACTIVE_ALL : INACTIVE)
          : (isActive
            ? CATEGORY_STYLES[cat]?.badge ?? ACTIVE_ALL
            : INACTIVE)
        return (
          <button key={cat} onClick={()=>onChange(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${style}`}>
            {cat.charAt(0).toUpperCase()+cat.slice(1)}
            <span className={`ml-1.5 tabular-nums ${isActive?"opacity-70":"opacity-40"}`}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
