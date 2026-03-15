"use client"
import { useState }        from "react"
import { useGameStore }    from "@/stores/gameStore"
import { useSessionStore } from "@/stores/sessionStore"

export default function Sudoku({ prefilled }: { prefilled: number[][] }) {
  const { state, dispatch }     = useGameStore()
  const { status }              = useSessionStore()
  const [selected, setSelected] = useState<[number,number] | null>(null)
  const [activeNum, setActiveNum] = useState<number | null>(null)

  if (!state) return null

  const board        = state.board as number[][]
  const prefilledSet = new Set(prefilled.map(([r,c]) => `${r}-${c}`))

  const handleCell = (r: number, c: number) => {
    if (status !== "playing" || prefilledSet.has(`${r}-${c}`)) return
    setSelected([r, c])
    if (activeNum !== null) dispatch({ type: "PLACE_NUMBER", row: r, col: c, value: activeNum })
  }

  const handleNum = (n: number) => {
    setActiveNum(n)
    if (selected) dispatch({ type: "PLACE_NUMBER", row: selected[0], col: selected[1], value: n })
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="border-2 border-gray-700 inline-grid grid-cols-9">
        {board.map((row, r) => row.map((cell, c) => {
          const isPre  = prefilledSet.has(`${r}-${c}`)
          const isSel  = selected?.[0] === r && selected?.[1] === c
          const bR = (c+1)%3===0&&c!==8 ? "border-r-2 border-r-gray-700" : "border-r border-r-gray-200"
          const bB = (r+1)%3===0&&r!==8 ? "border-b-2 border-b-gray-700" : "border-b border-b-gray-200"
          return (
            <div key={`${r}-${c}`} onClick={() => handleCell(r, c)}
              className={`w-9 h-9 flex items-center justify-center text-sm font-medium select-none
                ${bR} ${bB}
                ${isSel ? "bg-indigo-100" : ""}
                ${isPre ? "text-gray-500 cursor-default" : "text-indigo-600 cursor-pointer hover:bg-indigo-50"}`}>
              {cell !== 0 ? cell : ""}
            </div>
          )
        }))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleNum(n)}
            className={`w-10 h-10 rounded-lg border text-sm font-semibold
              ${activeNum===n ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
            {n}
          </button>
        ))}
        <button onClick={() => { setActiveNum(null); if(selected) dispatch({type:"ERASE",row:selected[0],col:selected[1]}) }}
          className="w-10 h-10 rounded-lg border border-gray-300 text-xs text-gray-500 hover:bg-gray-100">✕</button>
      </div>
      {state.meta.errors > 0 && (
        <p className="text-sm text-red-500 font-medium">{state.meta.errors} error{state.meta.errors!==1?"s":""} on board</p>
      )}
    </div>
  )
}
