// components/home/EmptyState.tsx
// NEW FILE
"use client"
interface Props { query:string; category:string; onReset:()=>void }
export default function EmptyState({query,category,onReset}:Props) {
  return (
    <div className="col-span-3 flex flex-col items-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center
        justify-center text-2xl text-gray-300">?</div>
      <div>
        <p className="text-sm font-medium text-gray-600">No games found
          {query ? ` for "${query}"` : ""}
          {category!=="all" ? ` in ${category}` : ""}
        </p>
        <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
      </div>
      <button onClick={onReset}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
        Clear all filters
      </button>
    </div>
  )
}
