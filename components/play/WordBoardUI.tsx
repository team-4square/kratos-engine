// components/play/WordBoardUI.tsx
// NEW FILE (Extracted from games/wordbuilder/WordBuilder.tsx)
"use client"
import { useGameStore }    from "@/stores/gameStore"
import { useSessionStore } from "@/stores/sessionStore"

export default function WordBoardUI() {
  const { state, dispatch } = useGameStore()
  const { status }          = useSessionStore()

  if (!state) return null
  const board = state.board as { available: string[]; current: string[]; found: string[]; targetWords: string[] }
  const currentWord = board.current.join("")

  return (
    <div className="flex flex-col gap-5 max-w-sm px-4">
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Available letters</p>
        <div className="flex gap-2 flex-wrap">
          {board.available.map((l: string, i: number) => (
            <button key={i} onClick={() => dispatch({ type: "SELECT_LETTER", letter: l })}
              disabled={status !== "playing"}
              className="w-10 h-10 rounded-xl border border-gray-200 font-semibold text-gray-700
                bg-white shadow-sm hover:border-indigo-400 hover:text-indigo-600
                disabled:opacity-40 transition-all active:scale-95">
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-14 rounded-xl bg-white border border-gray-200 px-5
        flex items-center justify-between shadow-sm group">
        <span className="text-2xl font-bold tracking-widest text-indigo-700">
          {currentWord || <span className="text-gray-200 text-base font-normal lowercase tracking-normal italic">select letters...</span>}
        </span>
        <button onClick={() => dispatch({ type: "REMOVE_LETTER" })}
          className="text-gray-300 hover:text-red-500 transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: "SUBMIT_WORD" })}
          disabled={currentWord.length < state.meta.minLength || status !== "playing"}
          className="flex-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold
            hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md active:scale-[0.98]">
          Submit word
        </button>
        <button onClick={() => dispatch({ type: "CLEAR_WORD" })}
          className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold
            text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98]">
          Clear
        </button>
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Found words</p>
          <p className="text-xs font-bold text-indigo-600">{board.found.length} / {board.targetWords.length}</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {board.targetWords.map((word: string) => (
            <span key={word} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
              ${board.found.includes(word)
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-gray-50 text-gray-300 border-gray-100"}`}>
              {board.found.includes(word) ? word : "?".repeat(word.length)}
            </span>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(board.found.length/board.targetWords.length)*100}%` }} />
        </div>
      </div>
    </div>
  )
}
