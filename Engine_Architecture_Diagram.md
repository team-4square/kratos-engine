# Engine Architecture Diagram
### Kratos Engine — Kratos Hackathon 2026 · League 1

---

## What Is the Engine?

The engine is the infrastructure layer that every game runs on top of. It is not a game itself. It is the system that handles everything a game needs — loading, timing, scoring, submitting — so that each individual game only has to worry about its own rules and board.

The engine is built around one universal pattern called **State · Action · Win**.

---

## The Core Model — State · Action · Win

Every game — no matter how different it looks — follows the same three-step cycle:

```
Player sees STATE
        ↓
Player takes ACTION
        ↓
ENGINE updates STATE
        ↓
ENGINE checks WIN condition
        ↓
Not done? → repeat from top
Done?     → end session
```

This cycle is the engine loop. It runs the same way for Sudoku, Word Builder, Minesweeper, or any future game. What changes between games is only what happens inside each step — not the loop itself.

---

## The Three Functions Every Game Provides

To plug into the engine, a game must answer exactly three questions by providing three pure functions:

```ts
interface GameDefinition {

  initialState: (config: JSONConfig) => GameState
  // Question: What does the board look like at the start?
  // Receives the JSON config block.
  // Returns the complete starting game state.
  // Called once when the game boots.

  reducer: (state: GameState, action: Action) => GameState
  // Question: What happens when the player does something?
  // Receives current state + the player's action.
  // Returns brand new state. Never mutates the old state.
  // No side effects — no API calls, no timers, no DOM changes.

  winCondition: (state: GameState) => boolean
  // Question: How do we know the game is over?
  // Receives current state after every move.
  // Returns true when the win condition is met.

}
```

### The Pure Functions Rule

All three functions must be **pure** — meaning given the same inputs, they always return the same output, with no side effects of any kind. This means:

- No API calls inside a reducer
- No timer manipulation inside winCondition
- No writing to a database inside initialState

This rule is what makes the engine trustworthy. The engine can call these functions as many times as it needs and nothing unexpected will happen. It also makes every game independently testable without needing the engine running.

---

## Full Engine Flow — Step by Step

Here is the complete journey from the moment a player opens a game to the moment they see their rank on the leaderboard:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — LOAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Player opens /play/sudoku-easy

GameLoader.ts reads sudoku-easy.json
  → checks gameId exists         (string, required)
  → checks type exists           (string, required)
  → checks timer block exists    (object, required)
  → checks scoring block exists  (object, required)
  → checks config block exists   (object, required)
  → throws clear error if anything is missing or wrong

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — REGISTRY LOOKUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GameRegistry.ts reads the type field from the config
  → type = "grid"
  → REGISTRY["grid"] = sudokuLogic
  → returns sudokuLogic (the three functions)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — INITIAL STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

sudokuLogic.initialState(config) runs
  → reads config.gridSize = 9
  → reads config.prefilled = [[0,0,5],[0,1,3]...]
  → builds 9×9 board with prefilled cells placed
  → returns GameState: { board, moves: [], meta: { errors: 0, hints: 0 } }

Result written to Zustand gameStore
Board renders to screen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — SESSION STARTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SessionManager.ts reads timer config
  → mode = "countdown", seconds = 300
  → starts 5-minute countdown
  → writes to sessionStore: { status: "playing", timer: 300, score: 0 }

Timer.tsx subscribes to sessionStore
  → re-renders every second (only Timer re-renders, not the whole board)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — THE GAME LOOP (repeats until win)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Player clicks cell at row 2, col 4 and places the number 7

UI dispatches action:
  { type: "PLACE_NUMBER", row: 2, col: 4, value: 7 }

sudokuLogic.reducer(currentState, action) runs
  → places 7 at [2,4] on the board
  → validates board — counts errors
  → returns new state (never mutates old state)

gameStore updates with new state
  → only cells that changed re-render (Zustand advantage)

sudokuLogic.winCondition(newState) runs
  → isBoardComplete(board) && meta.errors === 0
  → returns false → loop continues

Player makes next move → same cycle repeats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — WIN CONDITION MET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

winCondition returns true
SessionManager receives the signal
  → stops the timer
  → records timeElapsed = 130 seconds
  → sets sessionStore.status = "complete"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — SCORE CALCULATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ScoreCalculator.ts runs
  → reads from JSON: base=1000, timePenalty=2, errorPenalty=50
  → reads from session: timeElapsed=130, errors=1, hints=0

  score = 1000
        - (130 × 2)   → -260
        - (1  × 50)   → -50
        - (0  × 100)  → 0
        = 690

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 — SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ScoreSubmitter.ts sends to Firebase Firestore:
  {
    userId:    "user_abc123",
    gameId:    "sudoku-easy",
    score:     690,
    timeTaken: 130
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 9 — LEADERBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Leaderboard.tsx queries Firestore:
  WHERE gameId == "sudoku-easy"
  ORDER BY score DESC, timeTaken ASC

leaderboardStore updates
Player sees their rank
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## System Layers — One Responsibility Each

| File | Layer | Single Responsibility |
|------|-------|-----------------------|
| `GameLoader.ts` | engine/ | Reads and validates JSON config. Throws descriptive error on any issue. |
| `GameRegistry.ts` | engine/ | Maps the `type` string to the correct logic module. One line per game type. |
| `SessionManager.ts` | engine/ | Owns timer, score, and game status. Nothing else reads or writes these values. |
| `ScoreCalculator.ts` | engine/ | Applies the scoring formula. All values come from JSON — this file never changes. |
| `ScoreSubmitter.ts` | engine/ | Sends the final result object to Firebase on session end. |
| `gameStore.ts` | stores/ | Zustand store — live board state. Only the game renderer reads from this. |
| `sessionStore.ts` | stores/ | Zustand store — timer and score. Only SessionManager writes to this. |
| `leaderboardStore.ts` | stores/ | Zustand store — top scores. Populated after submission, read by Leaderboard. |

---

## Folder Structure

```
/src
  /engine
    GameLoader.ts         ← reads + validates JSON config
    GameRegistry.ts       ← maps game type string → logic module
    SessionManager.ts     ← owns timer, score, game status
    ScoreCalculator.ts    ← applies JSON scoring formula
    ScoreSubmitter.ts     ← sends result to Firebase

  /games
    /sudoku
      sudoku.logic.ts     ← initialState, reducer, winCondition
      Sudoku.tsx          ← board UI component
    /wordbuilder
      wordbuilder.logic.ts
      WordBuilder.tsx

  /stores
    gameStore.ts          ← live board state (Zustand)
    sessionStore.ts       ← timer + score (Zustand)
    leaderboardStore.ts   ← top scores (Zustand)

  /configs
    sudoku-easy.json      ← drop new files here to add games
    sudoku-hard.json
    word-builder-medium.json

  /components
    Timer.tsx
    Leaderboard.tsx
    ScoreCard.tsx

  /app
    /play/[gameId]        ← dynamic route, one URL per game
    /leaderboard/[gameId] ← leaderboard per game
```

---

## The Game Registry — The Switchboard

```ts
// engine/GameRegistry.ts

const REGISTRY: Record<string, GameDefinition> = {
  "grid": sudokuLogic,
  "word": wordBuilderLogic,
  // adding a new game type = one new line here + one new logic file
}

export const loadGame = (type: string): GameDefinition => {
  const game = REGISTRY[type]
  if (!game) throw new Error(`Unknown game type: "${type}"`)
  return game
}
```

This is the only place in the entire codebase where game types are listed. It is a deliberate single point of control. If you want to add Minesweeper, you add `"minesweeper": minesweeperLogic` here. If you want to remove a game, you remove its line. Nothing else in the engine needs to change.

---

## The Golden Rules

1. `/engine` and `/games` never import from `/configs` — JSON flows in at runtime through the loader, not at build time through imports.
2. Reducers and winConditions are always pure — no side effects, ever.
3. Only `SessionManager` writes to `sessionStore` — no other file touches the timer or score.
4. Adding a game never requires editing engine files — only adding new files.

---

> *The engine runs the loop. The game provides the rules. They never need to know about each other.*
