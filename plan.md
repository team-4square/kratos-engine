# TapTap Engine — Schema Upgrade & UX Implementation Plan
> AI Editor Instructions: Execute tasks in strict order. Each task modifies specific files only. Verify each checkpoint before proceeding. Never modify engine files unless the task explicitly says to.

---

## WHAT THIS PLAN DOES

1. Splits `type` into `type` + `renderer` — separates game logic from UI rendering
2. Adds per-type config validation — each game type has an enforced schema
3. Adds `category`, `version`, `meta` fields to JSON schema
4. Adds UX improvements — keyboard support, loading states, category filter, score breakdown, personal best

---

## FILES MODIFIED IN THIS PLAN

```
lib/types.ts                     → update JSONConfig interface
lib/configSchemas.ts             → NEW FILE — per-type config interfaces
engine/GameLoader.ts             → add renderer validation + per-type config validation
engine/GameRegistry.ts           → split into LOGIC_REGISTRY + RENDERER_REGISTRY
stores/personalBestStore.ts      → NEW FILE — localStorage personal best
app/play/[gameId]/page.tsx       → use getRenderer(), add loading/keyboard/score UX
app/page.tsx                     → add category filter + meta display
components/ScoreBreakdown.tsx    → NEW FILE — animated score breakdown
components/PersonalBest.tsx      → NEW FILE — personal best display
public/configs/*.json            → update all config files to new schema
```

---

## TASK 1 — Update lib/types.ts

Replace the existing `JSONConfig` interface. Add `renderer`, `category`, `version`, `meta` fields.

```ts
// lib/types.ts
// REPLACE the entire file with this

export interface JSONConfig {
  gameId:      string
  version:     string
  type:        string
  renderer:    string
  category:    "logic" | "word" | "math" | "speed" | "memory"
  title:       string
  difficulty?: "easy" | "medium" | "hard"
  meta?: {
    description: string
    tags:        string[]
    thumbnail?:  string
    maxPlayers?: number
  }
  timer: {
    mode:    "countdown" | "countup"
    seconds: number
  }
  scoring: {
    base:           number
    timePenalty:    number
    errorPenalty?:  number
    hintPenalty?:   number
    tieBreaker?:    "timeTaken" | "errors"
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

export interface PersonalBest {
  score:     number
  timeTaken: number
  date:      string
}
```

**Checkpoint:** No TypeScript errors. `JSONConfig` now has `renderer` and `category` fields.

---

## TASK 2 — Create lib/configSchemas.ts

Create this file from scratch. This is the contract every game type's config block must satisfy.

```ts
// lib/configSchemas.ts
// NEW FILE — create this

export interface GridConfig {
  gridSize:   number       // board dimensions — 9 means 9x9
  prefilled:  number[][]   // [row, col, value] tuples. row/col are 0-indexed
  solution?:  number[][]   // optional full solution for hint validation
}

export interface WordConfig {
  letters:     string[]    // available letters player can use
  minLength:   number      // minimum word length accepted
  targetWords: string[]    // all words player must find to win
}

export interface MinesweeperConfig {
  rows:       number       // number of rows
  cols:       number       // number of columns
  mines:      number       // number of mines placed
  safeCount:  number       // rows * cols - mines
}

export interface BattleConfig {
  player: {
    name:  string
    hp:    number
    moves: string[]
  }
  opponent: {
    name:  string
    hp:    number
    moves: string[]
  }
}

export interface DungeonConfig {
  gridSize:  number
  player:    { startRow: number; startCol: number }
  exit:      { row: number; col: number }
  walls:     number[][]
  items?:    { row: number; col: number; type: string; points: number }[]
  enemies?:  { row: number; col: number; type: string }[]
}

// Validator map — type string → validation function
export const CONFIG_VALIDATORS: Record<string, (config: Record<string, any>) => void> = {

  "sudoku": (c) => {
    if (typeof c.gridSize !== "number")  throw new Error("sudoku config: gridSize must be a number")
    if (!Array.isArray(c.prefilled))     throw new Error("sudoku config: prefilled must be an array")
    c.prefilled.forEach((cell: any, i: number) => {
      if (!Array.isArray(cell) || cell.length !== 3)
        throw new Error(`sudoku config: prefilled[${i}] must be [row, col, value]`)
    })
  },

  "numberFill": (c) => {
    if (typeof c.gridSize !== "number")  throw new Error("numberFill config: gridSize must be a number")
    if (!Array.isArray(c.prefilled))     throw new Error("numberFill config: prefilled must be an array")
  },

  "minesweeper": (c) => {
    if (typeof c.rows !== "number")      throw new Error("minesweeper config: rows must be a number")
    if (typeof c.cols !== "number")      throw new Error("minesweeper config: cols must be a number")
    if (typeof c.mines !== "number")     throw new Error("minesweeper config: mines must be a number")
    if (typeof c.safeCount !== "number") throw new Error("minesweeper config: safeCount must be a number")
    if (c.mines >= c.rows * c.cols)      throw new Error("minesweeper config: mines must be less than total cells")
  },

  "wordBuilder": (c) => {
    if (!Array.isArray(c.letters))       throw new Error("wordBuilder config: letters must be an array")
    if (typeof c.minLength !== "number") throw new Error("wordBuilder config: minLength must be a number")
    if (!Array.isArray(c.targetWords))   throw new Error("wordBuilder config: targetWords must be an array")
    if (c.targetWords.length === 0)      throw new Error("wordBuilder config: targetWords cannot be empty")
  },

  "anagram": (c) => {
    if (!Array.isArray(c.letters))       throw new Error("anagram config: letters must be an array")
    if (!Array.isArray(c.targetWords))   throw new Error("anagram config: targetWords must be an array")
  },

  "battle": (c) => {
    if (!c.player)                       throw new Error("battle config: player is required")
    if (!c.opponent)                     throw new Error("battle config: opponent is required")
    if (!Array.isArray(c.player.moves))  throw new Error("battle config: player.moves must be an array")
    if (!Array.isArray(c.opponent.moves))throw new Error("battle config: opponent.moves must be an array")
  },

  "dungeon": (c) => {
    if (typeof c.gridSize !== "number")  throw new Error("dungeon config: gridSize must be a number")
    if (!c.player?.startRow === undefined) throw new Error("dungeon config: player.startRow is required")
    if (!c.exit)                         throw new Error("dungeon config: exit is required")
    if (!Array.isArray(c.walls))         throw new Error("dungeon config: walls must be an array")
  },
}
```

**Checkpoint:** File creates with no TypeScript errors. `CONFIG_VALIDATORS["sudoku"]` exists and is callable.

---

## TASK 3 — Update engine/GameLoader.ts

Add `renderer` to required field validation. Add per-type config validation using `CONFIG_VALIDATORS`.

```ts
// engine/GameLoader.ts
// REPLACE entire file

import { JSONConfig } from "@/lib/types"
import { CONFIG_VALIDATORS } from "@/lib/configSchemas"

export async function loadConfig(gameId: string): Promise<JSONConfig> {
  const res = await fetch(`/configs/${gameId}.json`)
  if (!res.ok) throw new Error(`GameLoader: config not found for gameId "${gameId}"`)

  let raw: any
  try {
    raw = await res.json()
  } catch {
    throw new Error(`GameLoader: config file for "${gameId}" is not valid JSON`)
  }

  // Validate top-level required fields
  const required = ["gameId","version","type","renderer","category","title","timer","scoring","config"]
  for (const field of required) {
    if (!(field in raw)) throw new Error(`GameLoader: missing required field "${field}" in ${gameId}.json`)
  }

  // Validate timer block
  if (!raw.timer.mode)              throw new Error(`GameLoader: missing timer.mode in ${gameId}.json`)
  if (typeof raw.timer.seconds !== "number")
    throw new Error(`GameLoader: timer.seconds must be a number in ${gameId}.json`)
  if (raw.timer.seconds <= 0)       throw new Error(`GameLoader: timer.seconds must be > 0 in ${gameId}.json`)
  if (!["countdown","countup"].includes(raw.timer.mode))
    throw new Error(`GameLoader: timer.mode must be "countdown" or "countup" in ${gameId}.json`)

  // Validate scoring block
  if (typeof raw.scoring.base !== "number")
    throw new Error(`GameLoader: scoring.base must be a number in ${gameId}.json`)
  if (raw.scoring.base <= 0)        throw new Error(`GameLoader: scoring.base must be > 0 in ${gameId}.json`)
  if (typeof raw.scoring.timePenalty !== "number")
    throw new Error(`GameLoader: scoring.timePenalty must be a number in ${gameId}.json`)

  // Validate config block against its type-specific schema
  const validator = CONFIG_VALIDATORS[raw.type]
  if (!validator) throw new Error(`GameLoader: no config schema defined for type "${raw.type}"`)
  validator(raw.config)

  return raw as JSONConfig
}
```

**Checkpoint:** `loadConfig("sudoku-easy")` succeeds. `loadConfig("invalid-id")` throws `Config not found`. A config with missing `renderer` field throws `missing required field "renderer"`.

---

## TASK 4 — Update engine/GameRegistry.ts

Split into `LOGIC_REGISTRY` and `RENDERER_REGISTRY`. Export two getter functions.

```ts
// engine/GameRegistry.ts
// REPLACE entire file

import { GameDefinition } from "@/lib/types"
import { sudokuLogic }       from "@/games/sudoku/sudoku.logic"
import { wordBuilderLogic }  from "@/games/wordbuilder/wordbuilder.logic"
import Sudoku                from "@/games/sudoku/Sudoku"
import WordBuilder           from "@/games/wordbuilder/WordBuilder"

// Maps type → game logic (rules, reducer, win condition)
export const LOGIC_REGISTRY: Record<string, GameDefinition> = {
  "sudoku":       sudokuLogic,
  "wordBuilder":  wordBuilderLogic,
  // Add new game types here — one line per game
}

// Maps renderer → UI component (visual layout)
export const RENDERER_REGISTRY: Record<string, React.ComponentType<any>> = {
  "grid":  Sudoku,
  "word":  WordBuilder,
  // Add new renderers here — one line per renderer type
}

export function getGameLogic(type: string): GameDefinition {
  const logic = LOGIC_REGISTRY[type]
  if (!logic) throw new Error(`GameRegistry: unknown game type "${type}". Add it to LOGIC_REGISTRY.`)
  return logic
}

export function getRenderer(renderer: string): React.ComponentType<any> {
  const R = RENDERER_REGISTRY[renderer]
  if (!R) throw new Error(`GameRegistry: unknown renderer "${renderer}". Add it to RENDERER_REGISTRY.`)
  return R
}
```

**Checkpoint:** `getGameLogic("sudoku")` returns sudokuLogic. `getGameLogic("unknown")` throws. `getRenderer("grid")` returns Sudoku component. `getRenderer("unknown")` throws.

---

## TASK 5 — Update JSON Config Files

Update ALL config files in `/public/configs/` to use the new schema. Add `version`, `renderer`, `category`, `meta` fields to each.

### public/configs/sudoku-easy.json
```json
{
  "gameId":     "sudoku-easy",
  "version":    "1.0",
  "type":       "sudoku",
  "renderer":   "grid",
  "category":   "logic",
  "title":      "Sudoku Easy",
  "difficulty": "easy",
  "meta": {
    "description": "Fill the 9x9 grid. No repeated numbers in any row, column or box.",
    "tags":        ["numbers", "logic", "classic"],
    "thumbnail":   "/thumbnails/sudoku.png"
  },
  "timer":   { "mode": "countdown", "seconds": 300 },
  "scoring": {
    "base": 1000,
    "timePenalty": 2,
    "errorPenalty": 50,
    "hintPenalty": 100,
    "tieBreaker": "timeTaken"
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
  "gameId":     "word-builder-medium",
  "version":    "1.0",
  "type":       "wordBuilder",
  "renderer":   "word",
  "category":   "word",
  "title":      "Word Builder",
  "difficulty": "medium",
  "meta": {
    "description": "Build as many words as you can from the given letters.",
    "tags":        ["words", "vocabulary", "spelling"],
    "thumbnail":   "/thumbnails/wordbuilder.png"
  },
  "timer":   { "mode": "countdown", "seconds": 180 },
  "scoring": {
    "base": 500,
    "timePenalty": 1,
    "errorPenalty": 25,
    "tieBreaker": "timeTaken"
  },
  "config": {
    "letters":     ["A","P","L","E","T","R"],
    "minLength":   3,
    "targetWords": ["PLATE","PETAL","LATER","ALERT","ALTER","LEAP","TALE","TAPE","TRAP","REAP"]
  }
}
```

**Checkpoint:** `fetch('/configs/sudoku-easy.json')` returns config with `renderer: "grid"` and `category: "logic"`. `fetch('/configs/word-builder-medium.json')` returns config with `type: "wordBuilder"`.

---

## TASK 6 — Create stores/personalBestStore.ts

```ts
// stores/personalBestStore.ts
// NEW FILE

"use client"
import { create } from "zustand"
import { PersonalBest } from "@/lib/types"

interface PersonalBestStore {
  bests:     Record<string, PersonalBest>
  getBest:   (gameId: string) => PersonalBest | null
  setBest:   (gameId: string, score: number, timeTaken: number) => boolean
  loadBests: () => void
}

const STORAGE_KEY = "taptap_personal_bests"

export const usePersonalBestStore = create<PersonalBestStore>((set, get) => ({
  bests: {},

  loadBests: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) set({ bests: JSON.parse(raw) })
    } catch { /* ignore parse errors */ }
  },

  getBest: (gameId) => {
    return get().bests[gameId] ?? null
  },

  setBest: (gameId, score, timeTaken) => {
    const existing = get().bests[gameId]
    const isNewBest = !existing || score > existing.score

    if (isNewBest) {
      const newBest: PersonalBest = {
        score,
        timeTaken,
        date: new Date().toISOString()
      }
      const updated = { ...get().bests, [gameId]: newBest }
      set({ bests: updated })
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore storage errors */ }
    }
    return isNewBest
  }
}))
```

**Checkpoint:** `usePersonalBestStore.getState().setBest("sudoku-easy", 900, 80)` saves to localStorage. `usePersonalBestStore.getState().getBest("sudoku-easy")` returns `{ score: 900, timeTaken: 80, date: "..." }`.

---

## TASK 7 — Create components/ScoreBreakdown.tsx

```tsx
// components/ScoreBreakdown.tsx
// NEW FILE

"use client"
import { useEffect, useState } from "react"
import { JSONConfig, GameState } from "@/lib/types"

interface Props {
  config:      JSONConfig
  timeElapsed: number
  state:       GameState
  finalScore:  number
  isNewBest:   boolean
}

interface Step {
  label: string
  value: number
  color: string
}

export default function ScoreBreakdown({ config, timeElapsed, state, finalScore, isNewBest }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0)
  const s = config.scoring

  const steps: Step[] = [
    {
      label: "Base score",
      value: s.base,
      color: "text-gray-800"
    },
    {
      label: `Time penalty  (${timeElapsed}s × ${s.timePenalty})`,
      value: -(timeElapsed * s.timePenalty),
      color: "text-red-500"
    },
  ]

  if (state.meta.errors > 0 && s.errorPenalty) {
    steps.push({
      label: `Error penalty  (${state.meta.errors} × ${s.errorPenalty})`,
      value: -(state.meta.errors * s.errorPenalty),
      color: "text-red-500"
    })
  }

  if (state.meta.hints > 0 && s.hintPenalty) {
    steps.push({
      label: `Hint penalty  (${state.meta.hints} × ${s.hintPenalty})`,
      value: -(state.meta.hints * s.hintPenalty),
      color: "text-orange-500"
    })
  }

  steps.push({
    label: "Final score",
    value: finalScore,
    color: "text-indigo-600"
  })

  // Animate steps appearing one by one
  useEffect(() => {
    if (visibleSteps >= steps.length) return
    const timeout = setTimeout(() => {
      setVisibleSteps(v => v + 1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [visibleSteps, steps.length])

  return (
    <div className="space-y-2 min-w-[260px]">
      {isNewBest && (
        <div className="text-center mb-4 px-3 py-2 bg-amber-50 border border-amber-200
          rounded-lg text-amber-700 text-sm font-semibold">
          New personal best!
        </div>
      )}

      {steps.slice(0, visibleSteps).map((step, i) => (
        <div
          key={i}
          className={`flex justify-between items-center text-sm
            transition-all duration-300 ease-out
            ${i === steps.length - 1 ? "border-t pt-2 mt-2 font-bold text-base" : ""}`}
        >
          <span className="text-gray-500">{step.label}</span>
          <span className={`font-semibold tabular-nums ${step.color}`}>
            {step.value > 0 ? "+" : ""}{step.value}
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Checkpoint:** Component renders with animated steps. Steps appear every 400ms. `isNewBest=true` shows amber banner.

---

## TASK 8 — Create components/PersonalBest.tsx

```tsx
// components/PersonalBest.tsx
// NEW FILE

"use client"
import { useEffect }            from "react"
import { usePersonalBestStore } from "@/stores/personalBestStore"

interface Props { gameId: string }

export default function PersonalBest({ gameId }: Props) {
  const { getBest, loadBests } = usePersonalBestStore()

  useEffect(() => { loadBests() }, [])

  const best = getBest(gameId)

  if (!best) return (
    <div className="text-xs text-gray-300 text-center">No best yet</div>
  )

  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-0.5">Personal best</p>
      <p className="text-lg font-semibold text-indigo-500">{best.score}</p>
      <p className="text-xs text-gray-400">{best.timeTaken}s</p>
    </div>
  )
}
```

---

## TASK 9 — Update app/play/[gameId]/page.tsx

Four changes in this file:
1. Use `getRenderer(config.renderer)` instead of `RENDERERS[config.type]`
2. Add keyboard support for Sudoku
3. Use `ScoreBreakdown` on completion
4. Use `PersonalBest` in sidebar
5. Save personal best on session complete

```tsx
// app/play/[gameId]/page.tsx
// REPLACE entire file

"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter }             from "next/navigation"
import { loadConfig }                       from "@/engine/GameLoader"
import { getGameLogic, getRenderer }        from "@/engine/GameRegistry"
import { calculateScore }                   from "@/engine/ScoreCalculator"
import { submitScore }                      from "@/engine/ScoreSubmitter"
import { useGameStore }                     from "@/stores/gameStore"
import { useSessionStore }                  from "@/stores/sessionStore"
import { usePersonalBestStore }             from "@/stores/personalBestStore"
import { JSONConfig }                       from "@/lib/types"
import Timer                                from "@/components/Timer"
import ScoreCard                            from "@/components/ScoreCard"
import ScoreBreakdown                       from "@/components/ScoreBreakdown"
import PersonalBest                         from "@/components/PersonalBest"
import Leaderboard                          from "@/components/Leaderboard"

export default function PlayPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const [config, setConfig]         = useState<JSONConfig | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [submitted, setSubmitted]   = useState(false)
  const [isNewBest, setIsNewBest]   = useState(false)

  const { state, setGame, reset: resetGame }                               = useGameStore()
  const { startSession, stopSession, status, timeElapsed,
          setScore, score, reset: resetSession }                           = useSessionStore()
  const { setBest, loadBests }                                             = usePersonalBestStore()

  // Boot engine
  useEffect(() => {
    loadBests()
    async function boot() {
      try {
        resetGame(); resetSession(); setSubmitted(false); setIsNewBest(false)
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

  // Win condition check
  useEffect(() => {
    if (!state || !config || status !== "playing" || submitted) return
    const logic = getGameLogic(config.type)
    if (logic.winCondition(state)) {
      stopSession()
      const finalScore = calculateScore(config, timeElapsed, state)
      setScore(finalScore)
      setSubmitted(true)
      const newBest = setBest(gameId, finalScore, timeElapsed)
      setIsNewBest(newBest)
      submitScore({ userId: "guest", gameId, score: finalScore, timeTaken: timeElapsed })
    }
  }, [state])

  // Keyboard support
  const { dispatch } = useGameStore()
  const [selectedCell, setSelectedCell] = useState<[number,number] | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== "playing" || !config || config.renderer !== "grid") return

    const n = parseInt(e.key)
    if (n >= 1 && n <= 9 && selectedCell) {
      dispatch({ type: "PLACE_NUMBER", row: selectedCell[0], col: selectedCell[1], value: n })
      return
    }
    if ((e.key === "Backspace" || e.key === "0" || e.key === "Delete") && selectedCell) {
      dispatch({ type: "ERASE", row: selectedCell[0], col: selectedCell[1] })
      return
    }

    // Arrow key navigation
    if (!selectedCell) return
    const [r, c] = selectedCell
    if (e.key === "ArrowRight") setSelectedCell([r, Math.min(8, c + 1)])
    if (e.key === "ArrowLeft")  setSelectedCell([r, Math.max(0, c - 1)])
    if (e.key === "ArrowDown")  setSelectedCell([Math.min(8, r + 1), c])
    if (e.key === "ArrowUp")    setSelectedCell([Math.max(0, r - 1), c])
  }, [status, config, selectedCell, dispatch])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Render states
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-800">← Back to games</button>
      </div>
    </div>
  )

  if (!config || !state) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-600
        border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm">Loading {gameId}...</p>
    </div>
  )

  const Renderer = getRenderer(config.renderer)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg text-gray-800">{config.title}</h1>
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            {config.difficulty}
          </span>
          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
            {config.category}
          </span>
        </div>
        <button onClick={() => router.push("/")}
          className="text-sm text-gray-400 hover:text-gray-800 transition-colors">
          Quit
        </button>
      </nav>

      <div className="flex gap-8 p-8 max-w-5xl mx-auto">
        {/* Game area */}
        <div className="flex-1 flex items-start justify-center pt-4">
          {status === "complete" ? (
            <div className="text-center space-y-6">
              <div>
                <p className="text-2xl font-bold text-gray-800 mb-1">
                  {isNewBest ? "New personal best!" : "Game Complete!"}
                </p>
                <p className="text-4xl font-bold text-indigo-600">{score} pts</p>
              </div>
              <ScoreBreakdown
                config={config}
                timeElapsed={timeElapsed}
                state={state}
                finalScore={score}
                isNewBest={isNewBest}
              />
              <div className="flex gap-3 justify-center">
                <button onClick={() => router.push(`/play/${gameId}`)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700
                    rounded-lg text-sm font-medium hover:bg-gray-50">
                  Play Again
                </button>
                <button onClick={() => router.push(`/leaderboard/${gameId}`)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg
                    text-sm font-medium hover:bg-indigo-700">
                  Leaderboard →
                </button>
              </div>
            </div>
          ) : (
            <Renderer
              prefilled={config.config.prefilled ?? []}
              config={config.config}
              selectedCell={selectedCell}
              onCellSelect={setSelectedCell}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-44 flex flex-col gap-6 pt-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time</p>
            <Timer />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Score</p>
            <ScoreCard />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Errors</p>
            <p className={`text-2xl font-semibold tabular-nums
              ${state.meta.errors > 0 ? "text-red-500" : "text-gray-200"}`}>
              {state.meta.errors}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hints</p>
            <p className="text-2xl font-semibold tabular-nums text-gray-700">
              {state.meta.hints}
            </p>
          </div>
          <div className="border-t pt-4">
            <PersonalBest gameId={gameId} />
          </div>
          {config.renderer === "grid" && status === "playing" && (
            <div className="text-xs text-gray-300 text-center">
              Use arrow keys to navigate<br/>Type 1-9 to fill cells
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Checkpoint:** Page loads. Renderer selected via `config.renderer`. Keyboard input fills Sudoku cells. ScoreBreakdown animates on completion. PersonalBest shows in sidebar.

---

## TASK 10 — Update games/sudoku/Sudoku.tsx

Accept `selectedCell` and `onCellSelect` props so the play page can control keyboard navigation.

```tsx
// games/sudoku/Sudoku.tsx
// REPLACE entire file

"use client"
import { useGameStore }    from "@/stores/gameStore"
import { useSessionStore } from "@/stores/sessionStore"

interface Props {
  prefilled:      number[][]
  config?:        any
  selectedCell?:  [number, number] | null
  onCellSelect?:  (cell: [number, number]) => void
}

export default function Sudoku({ prefilled, selectedCell, onCellSelect }: Props) {
  const { state, dispatch } = useGameStore()
  const { status }          = useSessionStore()

  if (!state) return null

  const board        = state.board as number[][]
  const prefilledSet = new Set(prefilled.map(([r,c]) => `${r}-${c}`))

  const handleCell = (r: number, c: number) => {
    if (status !== "playing" || prefilledSet.has(`${r}-${c}`)) return
    onCellSelect?.([r, c])
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="border-2 border-gray-700 inline-grid grid-cols-9">
        {board.map((row, r) => row.map((cell, c) => {
          const isPre  = prefilledSet.has(`${r}-${c}`)
          const isSel  = selectedCell?.[0] === r && selectedCell?.[1] === c
          const bR = (c+1)%3===0&&c!==8 ? "border-r-2 border-r-gray-700" : "border-r border-r-gray-200"
          const bB = (r+1)%3===0&&r!==8 ? "border-b-2 border-b-gray-700" : "border-b border-b-gray-200"

          return (
            <div key={`${r}-${c}`} onClick={() => handleCell(r, c)}
              className={`w-9 h-9 flex items-center justify-center text-sm font-medium select-none
                ${bR} ${bB}
                ${isSel ? "bg-indigo-100 ring-1 ring-indigo-400" : ""}
                ${isPre
                  ? "text-gray-500 cursor-default"
                  : "text-indigo-600 cursor-pointer hover:bg-indigo-50"
                }`}>
              {cell !== 0 ? cell : ""}
            </div>
          )
        }))}
      </div>

      {/* Numpad — fallback for mouse users */}
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n}
            onClick={() => {
              if (selectedCell) {
                dispatch({ type: "PLACE_NUMBER", row: selectedCell[0], col: selectedCell[1], value: n })
              }
            }}
            className="w-10 h-10 rounded-lg border border-gray-300 text-sm font-semibold
              text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
            {n}
          </button>
        ))}
        <button
          onClick={() => {
            if (selectedCell) dispatch({ type: "ERASE", row: selectedCell[0], col: selectedCell[1] })
          }}
          className="w-10 h-10 rounded-lg border border-gray-300 text-xs text-gray-500
            hover:bg-gray-100 transition-colors">
          ✕
        </button>
      </div>

      {state.meta.errors > 0 && (
        <p className="text-sm text-red-500 font-medium">
          {state.meta.errors} error{state.meta.errors !== 1 ? "s" : ""} on the board
        </p>
      )}
    </div>
  )
}
```

---

## TASK 11 — Update app/page.tsx

Add category filter. Show `meta.description` and `meta.tags` from config. Load game list dynamically.

```tsx
// app/page.tsx
// REPLACE entire file

"use client"
import { useState } from "react"
import Link from "next/link"

const GAMES = [
  {
    id:         "sudoku-easy",
    title:      "Sudoku Easy",
    type:       "sudoku",
    renderer:   "grid",
    category:   "logic",
    difficulty: "Easy",
    maxScore:   1000,
    meta: {
      description: "Fill the 9x9 grid. No repeated numbers in any row, column or box.",
      tags:        ["numbers", "logic", "classic"]
    }
  },
  {
    id:         "word-builder-medium",
    title:      "Word Builder",
    type:       "wordBuilder",
    renderer:   "word",
    category:   "word",
    difficulty: "Medium",
    maxScore:   500,
    meta: {
      description: "Build as many words as you can from the given letters.",
      tags:        ["words", "vocabulary", "spelling"]
    }
  },
]

const CATEGORIES = ["all", "logic", "word", "math", "speed", "memory"]

const CATEGORY_COLORS: Record<string, string> = {
  logic:  "bg-indigo-50 text-indigo-700",
  word:   "bg-teal-50 text-teal-700",
  math:   "bg-orange-50 text-orange-700",
  speed:  "bg-red-50 text-red-700",
  memory: "bg-purple-50 text-purple-700",
}

export default function Home() {
  const [filter, setFilter] = useState("all")

  const filtered = GAMES.filter(g => filter === "all" || g.category === filter)

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 mb-1">TapTap Engine</h1>
          <p className="text-gray-500 text-sm">
            JSON-driven game engine · TapTap Hackathon 2026 · League 1
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                ${filter === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Game grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No games in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(g => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200
                p-5 flex flex-col gap-3 hover:border-indigo-200 transition-colors">

                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-800">{g.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                    ${CATEGORY_COLORS[g.category] ?? "bg-gray-100 text-gray-500"}`}>
                    {g.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed">{g.meta.description}</p>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {g.meta.tags.map(tag => (
                    <span key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                  <span>{g.difficulty}</span>
                  <span>{g.maxScore} pts max</span>
                </div>

                {/* Play button */}
                <Link href={`/play/${g.id}`}
                  className="block text-center text-sm bg-indigo-600 text-white
                    px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Play
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

**Checkpoint:** Category filter buttons work. Clicking "word" shows only Word Builder. Clicking "all" shows all games. Tags and descriptions appear on cards.

---

## TASK 12 — Final Verification

```bash
# 1. Build must pass with zero errors
npm run build

# 2. Test config validation
# Open /play/sudoku-easy — config must load with new schema fields
# Check DevTools network tab: sudoku-easy.json must show renderer: "grid"

# 3. Test type/renderer split
# Verify getGameLogic("sudoku") works
# Verify getRenderer("grid") works
# Verify getGameLogic("wordBuilder") works
# Verify getRenderer("word") works

# 4. Test keyboard support
# Open /play/sudoku-easy
# Click a cell → press 1-9 → cell fills
# Press Backspace → cell clears
# Press arrow keys → selection moves

# 5. Test personal best
# Complete a game
# Check localStorage for "taptap_personal_bests" key
# Play again — sidebar must show previous best

# 6. Test score breakdown
# Complete a game
# Verify steps animate in one by one
# Verify final score matches formula

# 7. Test category filter on home page
# Click "logic" → only logic games shown
# Click "word" → only word games shown
# Click "all" → all games shown

# 8. Push to GitHub
git add .
git commit -m "upgrade schema: type/renderer split, per-type validation, UX improvements"
git push origin main
```

---

## Submission Checklist
- [ ] `npm run build` passes zero errors
- [ ] All JSON configs have `renderer`, `category`, `version`, `meta` fields
- [ ] `getGameLogic` and `getRenderer` are two separate functions
- [ ] GameLoader validates per-type config schema
- [ ] Keyboard input works in Sudoku
- [ ] Score breakdown animates on completion
- [ ] Personal best saves and displays
- [ ] Category filter works on home page
