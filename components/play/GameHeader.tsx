// components/play/GameHeader.tsx
// NEW FILE
"use client"
import { useRouter }    from "next/navigation"
import { JSONConfig }   from "@/lib/types"
import { CATEGORY_STYLES, DIFFICULTY_STYLES } from "@/lib/constants"

interface Props { config: JSONConfig; onQuit: () => void }
export default function GameHeader({ config, onQuit }: Props) {
  const catStyle = CATEGORY_STYLES[config.category??"logic"]
  const difStyle = DIFFICULTY_STYLES[config.difficulty??"easy"]
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3
      flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-gray-800">{config.title}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${catStyle?.badge??""}`}>
          {config.category}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difStyle.badge}`}>
          {config.difficulty}
        </span>
      </div>
      <button onClick={onQuit}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5
        rounded-lg hover:bg-red-50">
        Quit game
      </button>
    </div>
  )
}
