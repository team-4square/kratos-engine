// components/home/SearchBar.tsx
// NEW FILE
"use client"
interface Props { value:string; onChange:(v:string)=>void }
export default function SearchBar({value,onChange}:Props) {
  return (
    <div className="relative flex-1 max-w-xs">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)}
        placeholder="Search games or tags..."
        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white
          text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400
          focus:ring-2 focus:ring-indigo-50 transition-all"/>
      {value && (
        <button onClick={()=>onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300
            hover:text-gray-500 transition-colors text-base leading-none">×</button>
      )}
    </div>
  )
}
