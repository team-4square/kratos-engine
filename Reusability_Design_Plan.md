# Reusability Design Plan
### Kratos Engine — Kratos Hackathon 2026 · League 1

---

## The Core Idea

The engine is built so that adding a new game requires writing **as little new code as possible** — and never touching the existing engine code.

This is achieved through a strict division of responsibility into two zones:

| Zone | What Lives Here | Rule |
|------|----------------|------|
| **Engine Zone** | Timer, scoring, leaderboard, submission, session | Built once. Never modified when games are added. |
| **Game Zone** | Board logic, move rules, win condition, UI | Written fresh per game. Never touches engine code. |

These two zones are completely isolated. The engine zone calls into the game zone through a defined contract. The game zone never calls back into the engine zone directly.

---

## The Engine Zone — Built Once

Everything in the engine zone is written once and works automatically for every game added afterward. A game never needs to implement any of these.

### 1. Game Loop — `SessionManager.ts`

The loop that drives every game:

```
state → player action → reducer → new state → check win → repeat
```

This runs identically for Sudoku, Word Builder, Minesweeper, or any future game. The loop itself never changes. Only the functions called inside it change.

### 2. Timer — `SessionManager.ts`

Handles both countdown and countup modes. Reads the timer config from JSON and manages the clock automatically. No game ever implements its own timer.

- Countdown: counts from `seconds` to 0, triggers session end at 0
- Countup: counts from 0 upward, records elapsed time for scoring
- Exposes `timeElapsed` to `ScoreCalculator` on session end

### 3. Score Calculator — `ScoreCalculator.ts`

```ts
const score =
  config.scoring.base
  - (session.timeElapsed  * config.scoring.timePenalty)
  - (state.meta.errors    * config.scoring.errorPenalty)
  - (state.meta.hints     * config.scoring.hintPenalty)
```

The formula is the same for every game. The values that feed into it come from the JSON config. This file has never needed to change since the engine was designed.

The only way a game influences scoring is by tracking `errors` and `hints` in its `meta` state object. The calculator reads those values automatically.

### 4. Score Submitter — `ScoreSubmitter.ts`

Sends a fixed object shape to Firebase on every session end:

```ts
await submitScore({
  userId:    session.userId,
  gameId:    config.gameId,
  score:     calculatedScore,
  timeTaken: session.timeElapsed
})
```

Every game's result goes through this same path. No game implements its own Firebase call.

### 5. Leaderboard — `Leaderboard.tsx` + `leaderboardStore.ts`

Queries Firestore and renders the top scores after submission. The query is:

```
WHERE gameId == [current gameId]
ORDER BY score DESC, timeTaken ASC
```

Tie-breaking by time is handled at the database level — no custom logic needed per game. Every game automatically gets a working leaderboard.

### 6. JSON Loader — `GameLoader.ts`

Reads and validates any config file. Ensures all required fields exist and are the correct type before booting the game. Works identically for every game that follows the schema.

---

## The Game Zone — Written Fresh Per Game

When adding a new game, these are the **only** things that need to be written:

### 1. `initialState(config)` — The Starting Board

Takes the JSON `config` block and builds the initial game state.

```ts
// Sudoku example
initialState: (config) => ({
  board: buildBoard(config.prefilled, config.gridSize),
  moves: [],
  meta: { errors: 0, hints: 0 }
})
```

```ts
// Word Builder example
initialState: (config) => ({
  board: {
    available: config.letters,
    found:     [],
    current:   []
  },
  moves: [],
  meta: { errors: 0, hints: 0 }
})
```

Same function name. Different board structure inside. The engine doesn't care what the board looks like — it just stores and passes it.

### 2. `reducer(state, action)` — Move Logic

Takes the current state and an action, returns new state. This is where the game's rules live.

```ts
// Sudoku reducer (partial)
reducer: (state, action) => {
  if (action.type === "PLACE_NUMBER") {
    const newBoard = placeNumber(state.board, action.row, action.col, action.value)
    const errors   = countErrors(newBoard)
    return {
      ...state,
      board: newBoard,
      moves: [...state.moves, action],
      meta:  { ...state.meta, errors }
    }
  }
  if (action.type === "USE_HINT") {
    const hint   = getHint(state.board)
    const filled = applyHint(state.board, hint)
    return {
      ...state,
      board: filled,
      meta:  { ...state.meta, hints: state.meta.hints + 1 }
    }
  }
  return state
}
```

```ts
// Word Builder reducer (partial)
reducer: (state, action) => {
  if (action.type === "SUBMIT_WORD") {
    const word    = action.word.toUpperCase()
    const isValid = config.targetWords.includes(word)
    const isNew   = !state.board.found.includes(word)
    if (isValid && isNew) {
      return { ...state, board: { ...state.board, found: [...state.board.found, word] } }
    }
    return { ...state, meta: { ...state.meta, errors: state.meta.errors + 1 } }
  }
  return state
}
```

**The rule:** reducers are always pure. Input in, new state out. No side effects ever.

### 3. `winCondition(state)` — End Check

A single function that inspects the current state and returns true when the game is complete.

```ts
// Sudoku: board is full with no errors
winCondition: (state) =>
  isBoardComplete(state.board) && state.meta.errors === 0
```

```ts
// Word Builder: all target words found
winCondition: (state) =>
  config.targetWords.every(word => state.board.found.includes(word))
```

The engine calls this after every move. When it returns true, the engine handles everything else — stopping the timer, calculating the score, submitting, showing the leaderboard.

### 4. Board UI Component — `Game.tsx`

The visual renderer for this game type. It reads from `gameStore` and dispatches actions when the player interacts.

```tsx
// Sudoku.tsx (simplified)
const Sudoku = () => {
  const board    = useGameStore(s => s.board)
  const dispatch = useGameStore(s => s.dispatch)

  return (
    <div className="grid grid-cols-9">
      {board.map((row, r) =>
        row.map((cell, c) => (
          <Cell
            key={`${r}-${c}`}
            value={cell}
            onClick={(val) => dispatch({ type: "PLACE_NUMBER", row: r, col: c, value: val })}
          />
        ))
      )}
    </div>
  )
}
```

The board UI only does two things: read state, dispatch actions. It never touches the timer, score, or Firebase.

---

## The Plugin Contract — Formal Definition

```ts
interface GameDefinition {
  initialState:  (config: JSONConfig) => GameState
  reducer:       (state: GameState, action: Action) => GameState
  winCondition:  (state: GameState) => boolean
}
```

This is the only interface a game must satisfy to work with the engine. Three functions. Nothing else.

### The GameRegistry — Connecting Games to the Engine

```ts
// engine/GameRegistry.ts

const REGISTRY: Record<string, GameDefinition> = {
  "grid": sudokuLogic,
  "word": wordBuilderLogic,
}

export const loadGame = (type: string): GameDefinition => {
  const game = REGISTRY[type]
  if (!game) throw new Error(`Unknown game type: "${type}"`)
  return game
}
```

This is the **only file in the engine that needs editing** when a new game type is added. One new line per game type.

---

## What Adding a New Game Looks Like

### Scenario A — New game, same type (e.g. Sudoku Hard)

The renderer and logic already exist for grid games. Just drop a new config file:

```json
// src/configs/sudoku-hard.json
{
  "gameId":     "sudoku-hard",
  "type":       "grid",
  "difficulty": "hard",
  "timer":   { "mode": "countdown", "seconds": 180 },
  "scoring": { "base": 2000, "timePenalty": 5, "errorPenalty": 100 },
  "config":  { "gridSize": 9, "prefilled": [...fewer cells...] }
}
```

**Files written:** 1 JSON file
**Engine files touched:** 0
**Game lives at:** `/play/sudoku-hard` immediately

---

### Scenario B — New game, new type (e.g. Minesweeper)

**Step 1** — Write the logic file:

```ts
// src/games/minesweeper/minesweeper.logic.ts

export const minesweeperLogic: GameDefinition = {

  initialState: (config) => ({
    board: buildMinesweeperBoard(config.rows, config.cols, config.mines),
    moves: [],
    meta:  { revealed: 0, flagged: 0, exploded: false }
  }),

  reducer: (state, action) => {
    if (action.type === "REVEAL_CELL") {
      if (isMine(state.board, action.row, action.col)) {
        return { ...state, meta: { ...state.meta, exploded: true } }
      }
      const newBoard = revealCell(state.board, action.row, action.col)
      return { ...state, board: newBoard, meta: { ...state.meta, revealed: countRevealed(newBoard) } }
    }
    if (action.type === "FLAG_CELL") {
      return { ...state, board: toggleFlag(state.board, action.row, action.col) }
    }
    return state
  },

  winCondition: (state) =>
    !state.meta.exploded &&
    state.meta.revealed === state.config.safeCount
}
```

**Step 2** — Add one line to the registry:

```ts
const REGISTRY = {
  "grid":        sudokuLogic,
  "word":        wordBuilderLogic,
  "minesweeper": minesweeperLogic,  // ← this is all
}
```

**Step 3** — Create the JSON config:

```json
{
  "gameId":  "minesweeper-easy",
  "type":    "minesweeper",
  "title":   "Minesweeper",
  "timer":   { "mode": "countup", "seconds": 999 },
  "scoring": { "base": 1000, "timePenalty": 1 },
  "config":  { "rows": 9, "cols": 9, "mines": 10, "safeCount": 71 }
}
```

**Files written:** 1 logic file + 1 UI component + 1 JSON file
**Engine files touched:** 1 line in `GameRegistry.ts`
**Everything else** (timer, scoring, submission, leaderboard) works automatically

---

## The Reusability Summary

| Item | Reused? | Notes |
|------|---------|-------|
| Game loop | ✅ Always | Same for every game |
| Timer | ✅ Always | Countdown and countup automatic |
| Score formula | ✅ Always | Values from JSON, calculator never changes |
| Firebase submission | ✅ Always | Same object shape every time |
| Leaderboard | ✅ Always | Same query, same UI |
| JSON loader | ✅ Always | Validates any compliant config |
| `initialState()` | ❌ Per game | Board structure varies |
| `reducer()` | ❌ Per game | Move rules vary |
| `winCondition()` | ❌ Per game | End condition varies |
| Board UI | ❌ Per game type | Visual layout varies |

The engine reuses 6 of the 10 components for every single game added. The 4 written per game are the minimum possible — they are the parts that are inherently different between games.

---

> *Build once. Scale infinitely. The engine never changes — only the games do.*
