// games/wordbuilder/WordBuilder.tsx
"use client"
import { useGameStore }    from "@/stores/gameStore"
import { useSessionStore } from "@/stores/sessionStore"

export default function WordBuilder() {
  const state    = useGameStore(s => s.state)
  const dispatch = useGameStore(s => s.dispatch)
  const status   = useSessionStore(s => s.status)

  if (!state) return null
  const board       = state.board as any
  const currentWord = board.current.join("")

  return (
    <div className="flex flex-col gap-5 max-w-sm">
      <div>
        <p className="text-xs text-gray-400 mb-2">Available letters</p>
        <div className="flex gap-2 flex-wrap">
          {board.available.map((l: string, i: number) => (
            <button key={i} onClick={() => dispatch({ type: "SELECT_LETTER", letter: l })}
              disabled={status !== "playing"}
              className="w-10 h-10 rounded-lg border border-gray-300 font-semibold text-gray-700
                hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40">
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[48px] rounded-lg bg-gray-50 border border-gray-200 px-4
        flex items-center justify-between">
        <span className="text-xl font-semibold tracking-widest text-indigo-700">
          {currentWord || <span className="text-gray-300 text-sm font-normal">select letters...</span>}
        </span>
        <button onClick={() => dispatch({ type: "REMOVE_LETTER" })} className="text-gray-400 text-sm">⌫</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => dispatch({ type: "SUBMIT_WORD" })}
          disabled={currentWord.length < state.meta.minLength || status !== "playing"}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
            hover:bg-indigo-700 disabled:opacity-40">
          Submit
        </button>
        <button onClick={() => dispatch({ type: "CLEAR_WORD" })}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
          Clear
        </button>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Found {board.found.length} of {board.targetWords.length} words</p>
        <div className="flex flex-wrap gap-2">
          {board.targetWords.map((word: string) => (
            <span key={word} className={`px-3 py-1 rounded-full text-xs font-medium
              ${board.found.includes(word) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
              {board.found.includes(word) ? word : "?".repeat(word.length)}
            </span>
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(board.found.length/board.targetWords.length)*100}%` }} />
        </div>
      </div>
      {state.meta.errors > 0 && (
        <p className="text-sm text-red-500">{state.meta.errors} incorrect attempt{state.meta.errors!==1?"s":""}</p>
      )}
    </div>
  )
}
