# TapTap Game Engine — Development Guidelines
> AI Editor Instructions: Read all rules before generating any code. Apply rules to every file written.

---

## RULE 0 — The Override Rule

**No game data is ever hardcoded in engine files.**

If the value belongs to a specific game (grid size, timer duration, scoring numbers, words, letters) — it must come from the JSON config. This rule overrides all other decisions.

---

## FILE OWNERSHIP MAP

Each file has exactly one job. Never mix responsibilities.

```
lib/types.ts              → shared interfaces only. No logic.
lib/firebase.ts           → Firebase init only. No queries.

engine/GameLoader.ts      → fetch + validate JSON config
engine/GameRegistry.ts    → REGISTRY map + getGameLogic()
engine/ScoreCalculator.ts → calculateScore() only
engine/ScoreSubmitter.ts  → submitScore() only. Never called from game logic.

games/*/[name].logic.ts   → initialState, reducer, winCondition only
games/*/[Name].tsx        → board UI. Read gameStore. Dispatch actions. Nothing else.

stores/gameStore.ts       → owns: state, config, logic, setGame(), dispatch()
stores/sessionStore.ts    → owns: timer, timeElapsed, score, status
stores/leaderboardStore.ts→ owns: entries[], loading

components/Timer.tsx      → reads sessionStore.timer only
components/ScoreCard.tsx  → reads sessionStore.score + calculates live estimate
components/Leaderboard.tsx→ queries Firestore, reads leaderboardStore

app/play/[gameId]/page.tsx→ orchestrates boot sequence + win detection
app/leaderboard/[gameId]/ → renders Leaderboard component
app/page.tsx              → static game list + navigation
```

---

## IMPORT RULES

```ts
// engine/ files may import from:
import { ... } from "@/lib/types"       // ✅
import { ... } from "@/lib/firebase"    // ✅ (ScoreSubmitter only)
import { ... } from "@/games/..."       // ❌ NEVER

// games/ files may import from:
import { ... } from "@/lib/types"       // ✅
import { ... } from "@/stores/..."      // ✅ (UI components only)
import { ... } from "@/engine/..."      // ❌ NEVER
import config from "@/configs/..."      // ❌ NEVER — fetch at runtime only

// configs/ files:
// Plain JSON only. No imports. No TypeScript.

// stores/ files:
// Only import from @/lib/types and @/engine/ScoreCalculator (ScoreCard only)
```

---

## JSON CONFIG RULES

### Configs must be fetched at runtime — never imported

```ts
// ✅ correct — runtime fetch, proves JSON drives the engine
const config = await fetch(`/configs/${gameId}.json`).then(r => r.json())

// ❌ wrong — build-time import, judges can tell
import config from "@/configs/sudoku-easy.json"
```

### Config files must live in /public/configs/
```
/public/configs/sudoku-easy.json         → served at /configs/sudoku-easy.json
/public/configs/word-builder-medium.json → served at /configs/word-builder-medium.json
```

### Required fields — GameLoader must validate all of these
```ts
const REQUIRED = ["gameId", "type", "title", "timer", "scoring", "config"]
// Throw a descriptive error if any are missing — never silently fail
```

### Changing JSON must change game behavior
These changes must produce visible differences without touching code:
- `timer.seconds` → timer starts at different value
- `scoring.base` → final score is different
- `config.prefilled` → different cells appear at start
- `type` → completely different game loads

---

## REDUCER RULES

### Must be pure functions
```ts
// ✅ pure — deterministic, no side effects
reducer: (state, action) => {
  if (action.type === "PLACE_NUMBER") {
    const newBoard = placeNumber(state.board, action.row, action.col, action.value)
    return { ...state, board: newBoard }
  }
  return state
}

// ❌ impure — never allowed inside a reducer
reducer: (state, action) => {
  const time = Date.now()          // ❌ non-deterministic
  submitScore(...)                 // ❌ side effect
  useSessionStore.getState()....   // ❌ side effect
  console.log(...)                 // ❌ side effect in prod
}
```

### Never mutate state
```ts
// ✅ correct — new objects at every level
return {
  ...state,
  board: newBoard,
  meta: { ...state.meta, errors: newErrors }
}

// ❌ wrong — mutates existing state
state.board[row][col] = value
state.meta.errors++
return state
```

### Always return state as fallback
```ts
// ✅ every reducer must end with this
reducer: (state, action) => {
  if (action.type === "PLACE_NUMBER") { ... }
  if (action.type === "ERASE") { ... }
  return state  // ← required
}
```

---

## ZUSTAND STORE RULES

### One writer per store
```
gameStore     → written only by setGame() and dispatch()
sessionStore  → written only by startSession(), stopSession(), setScore()
leaderboardStore → written only by Leaderboard component after fetch
```

### Subscribe to slices — never the whole store
```ts
// ✅ correct — only re-renders when timer changes
const timer = useSessionStore(s => s.timer)

// ❌ wrong — re-renders on every store change
const { timer, status, score } = useSessionStore()
```

### Never call store methods inside reducers
Reducers are pure functions. They cannot call Zustand methods.

---

## TYPESCRIPT RULES

### All engine files must be fully typed — no `any` in /engine/
```ts
// ✅ correct
export function calculateScore(config: JSONConfig, timeElapsed: number, state: GameState): number

// ❌ wrong
export function calculateScore(config: any, timeElapsed: any, state: any): any
```

### `any` is only acceptable for board shape inside game logic files
```ts
// ✅ acceptable inside sudoku.logic.ts
const board = state.board as number[][]

// ✅ acceptable inside wordbuilder.logic.ts
const board = state.board as WordBoard
```

### Add "use client" to every interactive file
```tsx
// Required on any file using useState, useEffect, event handlers, or Zustand hooks
"use client"
```

---

## ERROR HANDLING RULES

### Fail loudly — throw descriptive errors
```ts
// ✅ correct
if (!config.type) throw new Error(`GameLoader: missing required field "type"`)

// ❌ wrong — silent failure causes invisible bugs
if (!config.type) return null
if (!config.type) return undefined
```

### Firebase must never crash the game
```ts
// ✅ correct — log and continue
export async function submitScore(data: ScoreSubmission): Promise<void> {
  try {
    await addDoc(collection(db, "scores"), data)
  } catch (e) {
    console.error("Score submission failed:", e)
    // Do NOT rethrow
  }
}
```

### Always wrap async calls in play page
```ts
// ✅ correct
try {
  const cfg = await loadConfig(gameId)
} catch (e: any) {
  setError(e.message)
  return
}
```

---

## ACTION TYPE CONVENTIONS

Always use SCREAMING_SNAKE_CASE for action.type strings:

```ts
// Sudoku actions
{ type: "PLACE_NUMBER", row: number, col: number, value: number }
{ type: "ERASE",        row: number, col: number }
{ type: "USE_HINT" }

// Word Builder actions
{ type: "SELECT_LETTER", letter: string }
{ type: "REMOVE_LETTER" }
{ type: "SUBMIT_WORD" }
{ type: "CLEAR_WORD" }
```

---

## NAMING CONVENTIONS

```
/engine files      → PascalCase.ts         (GameLoader.ts, ScoreCalculator.ts)
/stores files      → camelCase.ts          (gameStore.ts, sessionStore.ts)
/games logic files → kebab.logic.ts        (sudoku.logic.ts, wordbuilder.logic.ts)
/games UI files    → PascalCase.tsx        (Sudoku.tsx, WordBuilder.tsx)
/configs files     → kebab-case.json       (sudoku-easy.json)
/components files  → PascalCase.tsx        (Timer.tsx, Leaderboard.tsx)

Engine functions   → verb + noun           (loadConfig, getGameLogic, calculateScore)
Store methods      → verb + noun           (setGame, dispatch, startSession)
Logic helpers      → verb + description    (buildBoard, countErrors, isBoardComplete)
```

---

## COMPONENT RULES

### Game components do exactly two things
```tsx
// ✅ correct — read state, dispatch actions
const board    = useGameStore(s => s.state?.board)
const dispatch = useGameStore(s => s.dispatch)

// ❌ wrong — game component touching session concerns
const timer = useSessionStore(s => s.timer)  // use Timer.tsx for this
const score = useSessionStore(s => s.score)  // use ScoreCard.tsx for this
```

### Never hardcode game dimensions in UI
```tsx
// ✅ correct — reads size from state which came from JSON
{board.map((row, r) => row.map((cell, c) => ...))}

// ❌ wrong — hardcoded
{Array(9).fill(null).map((_, r) => ...)}
```

---

## GIT RULES

### Commit after each task — not at the end
```bash
# ✅ commit messages that prove incremental work
git commit -m "add GameLoader with config validation"
git commit -m "wire Zustand gameStore and sessionStore"
git commit -m "implement sudoku initialState and reducer"
git commit -m "sudoku board renders from prefilled JSON cells"
git commit -m "timer reads seconds from JSON config"
git commit -m "score submits to Firebase on win condition"

# ❌ red flags for judges
git commit -m "final"
git commit -m "update"
git commit -m "fix"
```

### Never commit sensitive files
```bash
# .gitignore must contain:
.env.local
.env*.local

# Always commit:
.env.example  # with empty values only
```

---

## DEMO VIDEO RULES

### Three required moments — in this exact order

**Moment 1 (0:00–0:20) — Show JSON file**
- Open `/public/configs/sudoku-easy.json` in editor
- Scroll through it
- Say: "Every value — timer, scoring, grid — comes from this file"

**Moment 2 (0:20–0:50) — Show engine loading it**
- Open browser DevTools → Network tab
- Hard refresh `/play/sudoku-easy`
- Show `sudoku-easy.json` in network requests
- Say: "Engine fetches this JSON at runtime and builds the game"

**Moment 3 (0:50–1:40) — Play the game**
- Place numbers on the board
- Show timer ticking
- Make one error — show error count update
- Say: "All rules come from JSON"

**Moment 4 (1:40–2:00) — The proof move**
- Change `"seconds": 300` to `"seconds": 30` in JSON
- Hard refresh browser
- Show timer now starts at 30
- Say: "Different JSON, different game, same engine, zero code changes"

### What kills your score
- Going over 2 minutes
- Pre-loading the game before recording
- Saying "this would work if..." — show it working
- Showing code without showing it running

---

## COMMON MISTAKES — DO NOT DO THESE

```ts
// ❌ MISTAKE 1 — importing JSON instead of fetching
import config from "@/configs/sudoku-easy.json"
// Fix: fetch("/configs/sudoku-easy.json") at runtime

// ❌ MISTAKE 2 — game logic inside engine files
// engine/SessionManager.ts
if (state.board[0][0] === 5) { ... }
// Fix: game logic belongs in games/sudoku/sudoku.logic.ts only

// ❌ MISTAKE 3 — hardcoded values anywhere in engine
const gridSize = 9
const timerSeconds = 300
const baseScore = 1000
// Fix: all values must come from config object

// ❌ MISTAKE 4 — mutating state in reducer
state.board[row][col] = value
return state
// Fix: return { ...state, board: newBoard }

// ❌ MISTAKE 5 — editing engine files to add a new game
// The ONLY engine file that changes when adding a game is GameRegistry.ts (one line)
// If you're editing GameLoader, SessionManager, or ScoreCalculator — your architecture is wrong

// ❌ MISTAKE 6 — Firebase crashing the app
export async function submitScore(data) {
  await addDoc(...)  // throws if Firebase is misconfigured → crashes game
}
// Fix: always wrap in try/catch, never rethrow
```

---

## FINAL BUILD VERIFICATION

Run these checks before submitting:

```bash
# 1. Zero build errors
npm run build

# 2. Test these URLs work
http://localhost:3000/
http://localhost:3000/play/sudoku-easy
http://localhost:3000/play/word-builder-medium
http://localhost:3000/leaderboard/sudoku-easy

# 3. Verify JSON drives behavior — open sudoku-easy.json
#    Change timer.seconds from 300 to 30
#    Refresh /play/sudoku-easy
#    Timer must start at 0:30 not 5:00
#    Change back to 300 after verifying

# 4. Verify no hardcoding — search entire codebase
grep -r "gridSize = 9" ./engine    # must return nothing
grep -r "seconds = 300" ./engine   # must return nothing
grep -r "base = 1000" ./engine     # must return nothing
```
