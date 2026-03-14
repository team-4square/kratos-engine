# TapTap Game Engine — Implementation Plan
> AI Editor Instructions: Build each task in order. Do not skip ahead. Verify each checkpoint before continuing.

---

## Stack
```
Framework:   Next.js 14 (App Router)
Language:    TypeScript (strict)
Styling:     Tailwind CSS
State:       Zustand
Backend:     Firebase Firestore
Package mgr: npm
```

---

## INIT — Project Setup

```bash
npx create-next-app@latest taptap-engine --typescript --tailwind --app --no-src-dir
cd taptap-engine
npm install zustand firebase
```

Create ALL folders and empty placeholder files before writing any logic:

```
/public
  /configs
    sudoku-easy.json
    word-builder-medium.json

/engine
  GameLoader.ts
  GameRegistry.ts
  ScoreCalculator.ts
  ScoreSubmitter.ts

/games
  /sudoku
    sudoku.logic.ts
    Sudoku.tsx
  /wordbuilder
    wordbuilder.logic.ts
    WordBuilder.tsx

/stores
  gameStore.ts
  sessionStore.ts
  leaderboardStore.ts

/components
  Timer.tsx
  ScoreCard.tsx
  Leaderboard.tsx

/lib
  types.ts
  firebase.ts

/app
  page.tsx
  /play/[gameId]/page.tsx
  /leaderboard/[gameId]/page.tsx
```

---

## TASK 1 — lib/types.ts

Write the following interfaces exactly. Every other file imports from here.

```ts
// lib/types.ts

export interface JSONConfig {
  gameId:      string
  type:        string
  title:       string
  difficulty?: "easy" | "medium" | "hard"
  timer: {
    mode:    "countdown" | "countup"
    seconds: number
  }
  scoring: {
    base:           number
    timePenalty:    number
    errorPenalty?:  number
    hintPenalty?:   number
  }
  config: Record<string, any>
}

export interface GameState {
  board: any
  moves: Action[]
  meta: {
    errors: number
    hints:  number
    [key: string]: any
  }
}

export interface Action {
  type: string
  [key: string]: any
}

export interface GameDefinition {
  initialState:  (config: JSONConfig) => GameState
  reducer:       (state: GameState, action: Action) => GameState
  winCondition:  (state: GameState) => boolean
}

export interface ScoreSubmission {
  userId:    string
  gameId:    string
  score:     number
  timeTaken: number
}
```

**Checkpoint:** No TypeScript errors. All types exported correctly.

---

## TASK 2 — JSON Config Files

### public/configs/sudoku-easy.json
```json
{
  "gameId": "sudoku-easy",
  "type": "grid",
  "title": "Sudoku Easy",
  "difficulty": "easy",
  "timer": { "mode": "countdown", "seconds": 300 },
  "scoring": {
    "base": 1000,
    "timePenalty": 2,
    "errorPenalty": 50,
    "hintPenalty": 100
  },
  "config": {
    "gridSize": 9,
    "prefilled": [
      [0,0,5],[0,1,3],[0,4,7],
      [1,0,6],[1,3,1],[1,4,9],[1,5,5],
      [2,1,9],[2,2,8],
      [3,0,8],[3,4,6],[3,8,3],
      [4,0,4],[4,3,8],[4,5,3],[4,8,1],
      [5,0,7],[5,4,2],[5,8,6],
      [6,1,6],[6,6,2],[6,7,8],
      [7,3,4],[7,4,1],[7,5,9],[7,8,5],
      [8,4,8],[8,7,7],[8,8,9]
    ]
  }
}
```

### public/configs/word-builder-medium.json
```json
{
  "gameId": "word-builder-medium",
  "type": "word",
  "title": "Word Builder",
  "difficulty": "medium",
  "timer": { "mode": "countdown", "seconds": 180 },
  "scoring": {
    "base": 500,
    "timePenalty": 1,
    "errorPenalty": 25
  },
  "config": {
    "letters": ["A","P","L","E","T","R"],
    "minLength": 3,
    "targetWords": ["PLATE","PETAL","LATER","ALERT","ALTER","LEAP","TALE","TAPE","TRAP","REAP"]
  }
}
```

**Checkpoint:** `fetch('/configs/sudoku-easy.json')` in browser console returns valid JSON.

---

## TASK 3 — engine/GameLoader.ts

```ts
// engine/GameLoader.ts
import { JSONConfig } from "@/lib/types"

export async function loadConfig(gameId: string): Promise<JSONConfig> {
  const res = await fetch(`/configs/${gameId}.json`)
  if (!res.ok) throw new Error(`Config not found for gameId: "${gameId}"`)

  const config: JSONConfig = await res.json()

  const required = ["gameId","type","title","timer","scoring","config"]
  for (const field of required) {
    if (!(field in config)) throw new Error(`GameLoader: missing required field "${field}"`)
  }
  if (!config.timer.mode)    throw new Error(`GameLoader: missing timer.mode`)
  if (!config.timer.seconds) throw new Error(`GameLoader: missing timer.seconds`)
  if (!config.scoring.base)  throw new Error(`GameLoader: missing scoring.base`)

  return config
}
```

**Checkpoint:** `loadConfig("sudoku-easy")` resolves with valid JSONConfig. `loadConfig("invalid")` throws.

---

## TASK 4 — engine/GameRegistry.ts

```ts
// engine/GameRegistry.ts
import { GameDefinition } from "@/lib/types"
import { sudokuLogic }      from "@/games/sudoku/sudoku.logic"
import { wordBuilderLogic } from "@/games/wordbuilder/wordbuilder.logic"

const REGISTRY: Record<string, GameDefinition> = {
  "grid": sudokuLogic,
  "word": wordBuilderLogic,
}

export function getGameLogic(type: string): GameDefinition {
  const logic = REGISTRY[type]
  if (!logic) throw new Error(`GameRegistry: unknown game type "${type}"`)
  return logic
}
```

**Checkpoint:** `getGameLogic("grid")` returns sudokuLogic. `getGameLogic("unknown")` throws.

---

## TASK 5 — engine/ScoreCalculator.ts

```ts
// engine/ScoreCalculator.ts
import { JSONConfig, GameState } from "@/lib/types"

export function calculateScore(
  config: JSONConfig,
  timeElapsed: number,
  state: GameState
): number {
  const { base, timePenalty, errorPenalty = 0, hintPenalty = 0 } = config.scoring
  const score =
    base
    - (timeElapsed       * timePenalty)
    - (state.meta.errors * errorPenalty)
    - (state.meta.hints  * hintPenalty)
  return Math.max(0, Math.round(score))
}
```

**Checkpoint:** `calculateScore(config, 130, { meta: { errors: 1, hints: 0 }, board: null, moves: [] })` returns `690`.

---

## TASK 6 — lib/firebase.ts + engine/ScoreSubmitter.ts

### lib/firebase.ts
```ts
// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

### .env.local (create, never commit)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### .env.example (commit this)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### engine/ScoreSubmitter.ts
```ts
// engine/ScoreSubmitter.ts
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ScoreSubmission } from "@/lib/types"

export async function submitScore(data: ScoreSubmission): Promise<void> {
  try {
    await addDoc(collection(db, "scores"), {
      ...data,
      createdAt: serverTimestamp()
    })
  } catch (e) {
    console.error("Score submission failed:", e)
    // Do NOT rethrow — Firebase failure must not crash the game
  }
}
```

> If Firebase env vars are not ready yet: replace the try block body with `console.log("SCORE:", data)` and mark as TODO.

---

## TASK 7 — Zustand Stores

### stores/gameStore.ts
```ts
// stores/gameStore.ts
"use client"
import { create } from "zustand"
import { GameState, Action, JSONConfig, GameDefinition } from "@/lib/types"

interface GameStore {
  state:    GameState | null
  config:   JSONConfig | null
  logic:    GameDefinition | null
  setGame:  (config: JSONConfig, logic: GameDefinition) => void
  dispatch: (action: Action) => void
  reset:    () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  state:   null,
  config:  null,
  logic:   null,

  setGame: (config, logic) => {
    set({ config, logic, state: logic.initialState(config) })
  },

  dispatch: (action) => {
    const { state, logic } = get()
    if (!state || !logic) return
    set({ state: logic.reducer(state, action) })
  },

  reset: () => set({ state: null, config: null, logic: null })
}))
```

### stores/sessionStore.ts
```ts
// stores/sessionStore.ts
"use client"
import { create } from "zustand"

type Status = "idle" | "playing" | "complete"

interface SessionStore {
  status:       Status
  timer:        number
  timeElapsed:  number
  score:        number
  intervalId:   ReturnType<typeof setInterval> | null
  startSession: (seconds: number) => void
  stopSession:  () => void
  setScore:     (score: number) => void
  reset:        () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  status:      "idle",
  timer:       0,
  timeElapsed: 0,
  score:       0,
  intervalId:  null,

  startSession: (seconds) => {
    const id = setInterval(() => {
      const { timer } = get()
      if (timer <= 1) {
        clearInterval(get().intervalId!)
        set({ timer: 0, status: "complete" })
      } else {
        set(s => ({ timer: s.timer - 1, timeElapsed: s.timeElapsed + 1 }))
      }
    }, 1000)
    set({ timer: seconds, timeElapsed: 0, status: "playing", intervalId: id })
  },

  stopSession: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set(s => ({ status: "complete", timeElapsed: s.timeElapsed + 1, intervalId: null }))
  },

  setScore: (score) => set({ score }),

  reset: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ status: "idle", timer: 0, timeElapsed: 0, score: 0, intervalId: null })
  }
}))
```

### stores/leaderboardStore.ts
```ts
// stores/leaderboardStore.ts
"use client"
import { create } from "zustand"

export interface LeaderboardEntry {
  userId:    string
  score:     number
  timeTaken: number
}

interface LeaderboardStore {
  entries:    LeaderboardEntry[]
  loading:    boolean
  setEntries: (entries: LeaderboardEntry[]) => void
  setLoading: (loading: boolean) => void
}

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  entries:    [],
  loading:    false,
  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ loading })
}))
```

**Checkpoint:** `useGameStore.getState().setGame(config, logic)` populates state. Store updates trigger re-renders.

---

## TASK 8 — games/sudoku/sudoku.logic.ts

```ts
// games/sudoku/sudoku.logic.ts
import { GameDefinition, JSONConfig, GameState, Action } from "@/lib/types"

function buildBoard(gridSize: number, prefilled: number[][]): number[][] {
  const board: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
  prefilled.forEach(([r, c, v]) => { board[r][c] = v })
  return board
}

function countErrors(board: number[][]): number {
  let errors = 0
  const size = board.length
  const boxSize = Math.sqrt(size)

  for (let r = 0; r < size; r++) {
    const vals = board[r].filter(v => v !== 0)
    if (new Set(vals).size !== vals.length) errors++
  }
  for (let c = 0; c < size; c++) {
    const vals = board.map(r => r[c]).filter(v => v !== 0)
    if (new Set(vals).size !== vals.length) errors++
  }
  for (let br = 0; br < boxSize; br++) {
    for (let bc = 0; bc < boxSize; bc++) {
      const vals: number[] = []
      for (let r = 0; r < boxSize; r++)
        for (let c = 0; c < boxSize; c++)
          vals.push(board[br * boxSize + r][bc * boxSize + c])
      const nonZero = vals.filter(v => v !== 0)
      if (new Set(nonZero).size !== nonZero.length) errors++
    }
  }
  return errors
}

function isBoardComplete(board: number[][]): boolean {
  return board.every(row => row.every(cell => cell !== 0))
}

export const sudokuLogic: GameDefinition = {

  initialState: (config: JSONConfig): GameState => ({
    board: buildBoard(config.config.gridSize, config.config.prefilled),
    moves: [],
    meta:  { errors: 0, hints: 0 }
  }),

  reducer: (state: GameState, action: Action): GameState => {
    const board = state.board as number[][]

    if (action.type === "PLACE_NUMBER") {
      const newBoard = board.map((r, ri) =>
        r.map((cell, ci) => (ri === action.row && ci === action.col ? action.value : cell))
      )
      return { ...state, board: newBoard, moves: [...state.moves, action],
               meta: { ...state.meta, errors: countErrors(newBoard) } }
    }

    if (action.type === "ERASE") {
      const newBoard = board.map((r, ri) =>
        r.map((cell, ci) => (ri === action.row && ci === action.col ? 0 : cell))
      )
      return { ...state, board: newBoard, moves: [...state.moves, action],
               meta: { ...state.meta, errors: countErrors(newBoard) } }
    }

    return state
  },

  winCondition: (state: GameState): boolean => {
    const board = state.board as number[][]
    return isBoardComplete(board) && countErrors(board) === 0
  }
}
```

**Checkpoint:** `sudokuLogic.initialState(config).board[0][0]` === `5`. Win condition returns false on incomplete board.

---

## TASK 9 — games/wordbuilder/wordbuilder.logic.ts

```ts
// games/wordbuilder/wordbuilder.logic.ts
import { GameDefinition, JSONConfig, GameState, Action } from "@/lib/types"

export const wordBuilderLogic: GameDefinition = {

  initialState: (config: JSONConfig): GameState => ({
    board: {
      available:   config.config.letters as string[],
      found:       [] as string[],
      current:     [] as string[],
      targetWords: config.config.targetWords as string[]
    },
    moves: [],
    meta:  { errors: 0, hints: 0, minLength: config.config.minLength }
  }),

  reducer: (state: GameState, action: Action): GameState => {
    const board = state.board as any

    if (action.type === "SELECT_LETTER") {
      return { ...state, board: { ...board, current: [...board.current, action.letter] } }
    }
    if (action.type === "REMOVE_LETTER") {
      return { ...state, board: { ...board, current: board.current.slice(0, -1) } }
    }
    if (action.type === "CLEAR_WORD") {
      return { ...state, board: { ...board, current: [] } }
    }
    if (action.type === "SUBMIT_WORD") {
      const word    = board.current.join("").toUpperCase()
      const isValid = board.targetWords.includes(word)
      const isNew   = !board.found.includes(word)
      const isLong  = word.length >= state.meta.minLength

      if (isValid && isNew && isLong) {
        return { ...state, board: { ...board, found: [...board.found, word], current: [] },
                 moves: [...state.moves, action] }
      }
      return { ...state, board: { ...board, current: [] },
               meta: { ...state.meta, errors: state.meta.errors + 1 },
               moves: [...state.moves, action] }
    }
    return state
  },

  winCondition: (state: GameState): boolean => {
    const board = state.board as any
    return board.targetWords.every((w: string) => board.found.includes(w))
  }
}
```

---

## TASK 10 — components/Timer.tsx

```tsx
// components/Timer.tsx
"use client"
import { useSessionStore } from "@/stores/sessionStore"

export default function Timer() {
  const timer  = useSessionStore(s => s.timer)
  const status = useSessionStore(s => s.status)
  const mins   = Math.floor(timer / 60).toString().padStart(2, "0")
  const secs   = (timer % 60).toString().padStart(2, "0")
  return (
    <div className={`text-3xl font-mono font-semibold tabular-nums
      ${timer <= 30 && status === "playing" ? "text-red-500" : "text-gray-800"}`}>
      {mins}:{secs}
    </div>
  )
}
```

---

## TASK 11 — components/ScoreCard.tsx

```tsx
// components/ScoreCard.tsx
"use client"
import { useSessionStore } from "@/stores/sessionStore"
import { useGameStore }    from "@/stores/gameStore"
import { calculateScore }  from "@/engine/ScoreCalculator"

export default function ScoreCard() {
  const status      = useSessionStore(s => s.status)
  const finalScore  = useSessionStore(s => s.score)
  const timeElapsed = useSessionStore(s => s.timeElapsed)
  const state       = useGameStore(s => s.state)
  const config      = useGameStore(s => s.config)

  const display = status === "complete"
    ? finalScore
    : (config && state ? calculateScore(config, timeElapsed, state) : 0)

  return <div className="text-2xl font-semibold text-indigo-600">{display} pts</div>
}
```

---

## TASK 12 — components/Leaderboard.tsx

```tsx
// components/Leaderboard.tsx
"use client"
import { useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { useLeaderboardStore } from "@/stores/leaderboardStore"

export default function Leaderboard({ gameId }: { gameId: string }) {
  const { entries, loading, setEntries, setLoading } = useLeaderboardStore()

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const q = query(
          collection(db, "scores"),
          where("gameId", "==", gameId),
          orderBy("score", "desc"),
          orderBy("timeTaken", "asc"),
          limit(10)
        )
        const snap = await getDocs(q)
        setEntries(snap.docs.map(d => d.data() as any))
      } catch (e) {
        console.error("Leaderboard fetch failed:", e)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [gameId])

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!entries.length) return <p className="text-sm text-gray-400">No scores yet.</p>

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg text-sm">
          <span className="w-6 font-semibold text-gray-400">{i + 1}</span>
          <span className="flex-1 text-gray-700">{e.userId}</span>
          <span className="font-semibold text-indigo-600">{e.score}</span>
          <span className="text-gray-400 w-14 text-right">{e.timeTaken}s</span>
        </div>
      ))}
    </div>
  )
}
```

---

## TASK 13 — games/sudoku/Sudoku.tsx

```tsx
// games/sudoku/Sudoku.tsx
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
```

---

## TASK 14 — games/wordbuilder/WordBuilder.tsx

```tsx
// games/wordbuilder/WordBuilder.tsx
"use client"
import { useGameStore }    from "@/stores/gameStore"
import { useSessionStore } from "@/stores/sessionStore"

export default function WordBuilder() {
  const { state, dispatch } = useGameStore()
  const { status }          = useSessionStore()

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
```

---

## TASK 15 — app/play/[gameId]/page.tsx

```tsx
// app/play/[gameId]/page.tsx
"use client"
import { useEffect, useState }  from "react"
import { useParams, useRouter } from "next/navigation"
import { loadConfig }           from "@/engine/GameLoader"
import { getGameLogic }         from "@/engine/GameRegistry"
import { calculateScore }       from "@/engine/ScoreCalculator"
import { submitScore }          from "@/engine/ScoreSubmitter"
import { useGameStore }         from "@/stores/gameStore"
import { useSessionStore }      from "@/stores/sessionStore"
import { JSONConfig }           from "@/lib/types"
import Timer                    from "@/components/Timer"
import ScoreCard                from "@/components/ScoreCard"
import Leaderboard              from "@/components/Leaderboard"
import Sudoku                   from "@/games/sudoku/Sudoku"
import WordBuilder              from "@/games/wordbuilder/WordBuilder"

const RENDERERS: Record<string, React.ComponentType<any>> = {
  "grid": Sudoku,
  "word": WordBuilder,
}

export default function PlayPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const [config, setConfig]       = useState<JSONConfig | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { state, setGame, reset: resetGame }                          = useGameStore()
  const { startSession, stopSession, status, timeElapsed,
          setScore, reset: resetSession }                             = useSessionStore()

  useEffect(() => {
    async function boot() {
      try {
        resetGame(); resetSession()
        const cfg   = await loadConfig(gameId)
        const logic = getGameLogic(cfg.type)
        setGame(cfg, logic)
        setConfig(cfg)
        startSession(cfg.timer.seconds)
      } catch (e: any) { setError(e.message) }
    }
    boot()
    return () => resetSession()
  }, [gameId])

  useEffect(() => {
    if (!state || !config || status !== "playing" || submitted) return
    const logic = getGameLogic(config.type)
    if (logic.winCondition(state)) {
      stopSession()
      const finalScore = calculateScore(config, timeElapsed, state)
      setScore(finalScore)
      setSubmitted(true)
      submitScore({ userId: "guest", gameId, score: finalScore, timeTaken: timeElapsed })
    }
  }, [state])

  if (error)             return <div className="p-8 text-red-500">{error}</div>
  if (!config || !state) return <div className="p-8 text-gray-400">Loading game...</div>

  const Renderer = RENDERERS[config.type]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">{config.title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            {config.difficulty}
          </span>
          <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800">Quit</button>
        </div>
      </nav>
      <div className="flex gap-8 p-8 max-w-4xl mx-auto">
        <div className="flex-1 flex items-start justify-center pt-4">
          {status === "complete" ? (
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold">Game Complete!</p>
              <ScoreCard />
              <button onClick={() => router.push(`/leaderboard/${gameId}`)}
                className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                View Leaderboard →
              </button>
            </div>
          ) : (
            <Renderer prefilled={config.config.prefilled ?? []} config={config.config} />
          )}
        </div>
        <div className="w-44 flex flex-col gap-6 pt-4">
          <div><p className="text-xs text-gray-400 mb-1">Time</p><Timer /></div>
          <div><p className="text-xs text-gray-400 mb-1">Score</p><ScoreCard /></div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Errors</p>
            <p className={`text-2xl font-semibold ${state.meta.errors>0?"text-red-500":"text-gray-300"}`}>
              {state.meta.errors}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## TASK 16 — app/leaderboard/[gameId]/page.tsx

```tsx
// app/leaderboard/[gameId]/page.tsx
"use client"
import { useParams, useRouter } from "next/navigation"
import Leaderboard from "@/components/Leaderboard"

export default function LeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
        <button onClick={() => router.push(`/play/${gameId}`)}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Play Again
        </button>
      </div>
      <div className="bg-white rounded-xl border p-5">
        <Leaderboard gameId={gameId} />
      </div>
      <button onClick={() => router.push("/")} className="mt-4 text-sm text-gray-500 hover:text-gray-800">
        ← Back to games
      </button>
    </div>
  )
}
```

---

## TASK 17 — app/page.tsx

```tsx
// app/page.tsx
import Link from "next/link"

const GAMES = [
  { id: "sudoku-easy",         title: "Sudoku Easy",  type: "Grid", difficulty: "Easy",   maxScore: 1000 },
  { id: "word-builder-medium", title: "Word Builder", type: "Word", difficulty: "Medium", maxScore: 500  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-1">TapTap Engine</h1>
        <p className="text-gray-500 text-sm mb-8">JSON-driven game engine · TapTap Hackathon 2026 · League 1</p>
        <div className="grid grid-cols-3 gap-4">
          {GAMES.map(g => (
            <div key={g.id} className="bg-white rounded-xl border p-5 flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-gray-800">{g.title}</h2>
                  <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">{g.type}</span>
                </div>
                <p className="text-xs text-gray-400">{g.difficulty} · {g.maxScore} pts max</p>
              </div>
              <Link href={`/play/${g.id}`}
                className="block text-center text-sm bg-indigo-600 text-white px-4 py-2
                  rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Play
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
```

---

## TASK 18 — .gitignore

```
.env.local
.env*.local
node_modules/
.next/
out/
*.tsbuildinfo
```

---

## TASK 19 — Verify and Push

```bash
npm run build          # must pass with zero errors
npm run dev            # verify locally

# Test manually:
# 1. Home page loads
# 2. /play/sudoku-easy → network tab shows sudoku-easy.json fetched
# 3. Board renders with correct prefilled cells
# 4. Click cell + click number → cell updates
# 5. Timer counts down
# 6. Score updates on each move
# 7. Win or timeout → score submits

git add .
git commit -m "complete checkpoint 2 engine"
git push origin main
```

---

## Submission Checklist
- [ ] `npm run build` passes zero errors
- [ ] `/play/sudoku-easy` fully playable
- [ ] `/play/word-builder-medium` fully playable
- [ ] Changing `timer.seconds` in JSON changes the timer on refresh
- [ ] Changing `scoring.base` in JSON changes the final score
- [ ] Score submits to Firebase or console.log on win
- [ ] GitHub repo is public
- [ ] README.md complete with run instructions + schema + folder guide
- [ ] `.env.local` NOT in repo
- [ ] Demo video under 2 minutes and publicly accessible
