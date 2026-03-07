# 🎮 TapTap Game Engine

> A plugin-style browser game engine that loads and runs any game from a JSON config file — built for TapTap Hackathon 2026, League 1 · Engine League.

---

## 📌 What Is This?

Most browser games rebuild the same infrastructure every time — timers, scoring, leaderboards, submission flows — just wrapped in a different UI. There is no shared foundation, so effort never compounds.

**TapTap Game Engine solves that.**

It is a reusable, JSON-driven game engine where the infrastructure is built once and games are plug-ins that connect to it. Any game that can be described as:

```
show a state → accept a player action → check if it's over
```

...can run inside this engine. Without touching a single line of engine code.

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **JSON Game Loader** | Drop a config file — the game is live. No hardcoded data anywhere. |
| 2 | **Plugin Registry** | New game = one new file. Nothing else in the engine changes. |
| 3 | **Universal Timer** | Countdown or countup timer, automatic for every game. |
| 4 | **JSON-Driven Scoring** | Scoring rules (base, time penalty, error penalty) live in the JSON config. |
| 5 | **Firebase Leaderboard** | Auto-sorted by score, time as tie-breaker. Handled at database level. |
| 6 | **Session Manager** | Owns game state, timer, and score so no other layer has to. |

---

## 🕹️ Games Included

### 1. Sudoku (Grid Game)
- Classic 9×9 Sudoku loaded entirely from JSON
- Prefilled cells defined as `[row, col, value]` tuples in config
- Error detection on every move
- Hint system with score penalty
- Difficulty levels: Easy / Medium / Hard

### 2. Word Builder (Word Game)
- Given a set of letters, find all target words
- Letter set, minimum word length, and target words all defined in JSON
- Tracks found words, wrong attempts, and remaining words
- Difficulty levels: Easy / Medium / Hard

---

## 🏗️ Architecture

### The Core Model — State · Action · Win

Every game in the engine is defined by exactly **three pure functions**:

```ts
interface GameDefinition {
  initialState:  (config: JSONConfig) => GameState
  // Build the starting board from the JSON config block

  reducer:       (state: GameState, action: Action) => GameState
  // Handle any player move. Return new state. Never mutate.

  winCondition:  (state: GameState) => boolean
  // Return true when the game is complete
}
```

The engine runs the loop. The game provides the three functions. They never need to know about each other.

### The Engine Loop

```
Player opens /play/sudoku-easy
        ↓
GameLoader reads sudoku-easy.json → validates config
        ↓
GameRegistry maps type "grid" → sudokuLogic
        ↓
initialState(config) → builds board → written to gameStore
        ↓
SessionManager starts timer → sessionStore
        ↓
┌─────────────────────────────────┐
│  Player makes a move            │
│          ↓                      │
│  reducer(state, action)         │
│          ↓                      │
│  new state → gameStore updates  │
│          ↓                      │
│  winCondition(state)?           │
│  NO  → back to top (loop)       │
│  YES → exit loop                │
└─────────────────────────────────┘
        ↓
Timer stops → ScoreCalculator runs
        ↓
ScoreSubmitter → Firebase Firestore
        ↓
Leaderboard renders → player sees rank
```

### System Layers

```
/src
  /engine
    GameLoader.ts         ← reads + validates JSON config
    GameRegistry.ts       ← maps game type → logic module
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
    sudoku-easy.json
    sudoku-hard.json
    word-builder-medium.json

  /components
    Timer.tsx
    Leaderboard.tsx
    ScoreCard.tsx

  /app
    /play/[gameId]        ← dynamic route per game
    /leaderboard/[gameId] ← leaderboard per game
```

---

## 📦 JSON Configuration Schema

Every game is described by a JSON config file. This is the contract between the game and the engine.

### Schema

```json
{
  "gameId":     "string   — required — unique ID, becomes the URL slug",
  "type":       "string   — required — maps to registry: grid, word",
  "title":      "string   — required — display name in UI",
  "difficulty": "string   — optional — easy / medium / hard",

  "timer": {
    "mode":    "string  — required — countdown or countup",
    "seconds": "number  — required — duration in seconds"
  },

  "scoring": {
    "base":          "number — required — maximum possible score",
    "timePenalty":   "number — required — points lost per second",
    "errorPenalty":  "number — optional — points lost per error",
    "hintPenalty":   "number — optional — points lost per hint"
  },

  "config": {
    "...": "object — required — game-specific data, passed to initialState()"
  }
}
```

### Scoring Formula

```
score = base
      − (timeElapsed  × timePenalty)
      − (errors       × errorPenalty)
      − (hints        × hintPenalty)
```

All values come from the JSON. The `ScoreCalculator` never changes between games.

### Sample — Sudoku Easy

```json
{
  "gameId":     "sudoku-easy",
  "type":       "grid",
  "title":      "Sudoku Easy",
  "difficulty": "easy",
  "timer":   { "mode": "countdown", "seconds": 300 },
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
      [1,0,6],[1,3,1],[1,4,9],
      [2,1,9],[2,2,8]
    ]
  }
}
```

### Sample — Word Builder Medium

```json
{
  "gameId":     "word-builder-medium",
  "type":       "word",
  "title":      "Word Builder",
  "difficulty": "medium",
  "timer":   { "mode": "countdown", "seconds": 180 },
  "scoring": {
    "base": 500,
    "timePenalty": 1,
    "errorPenalty": 25
  },
  "config": {
    "letters":     ["A","P","L","E","T","R"],
    "minLength":   3,
    "targetWords": ["PLATE","PETAL","LATER","ALERT","ALTER","LEAP","TALE"]
  }
}
```

---

## 🔌 How to Add a New Game

### Case 1 — New game, same type (e.g. Sudoku Hard)

Just add a JSON file. Nothing else.

```bash
# Create /src/configs/sudoku-hard.json
# Game is instantly live at /play/sudoku-hard
```

### Case 2 — New game, new type (e.g. Minesweeper)

**Step 1** — Create the logic file:

```ts
// src/games/minesweeper/minesweeper.logic.ts

export const minesweeperLogic: GameDefinition = {

  initialState: (config) => ({
    board: buildMinesweeperBoard(config.rows, config.cols, config.mines),
    moves: [],
    meta: { revealed: 0, flagged: 0 }
  }),

  reducer: (state, action) => {
    if (action.type === "REVEAL_CELL") {
      // ... return new state
    }
    if (action.type === "FLAG_CELL") {
      // ... return new state
    }
    return state
  },

  winCondition: (state) =>
    state.meta.revealed === state.config.safeCount
}
```

**Step 2** — Register it (one line):

```ts
// src/engine/GameRegistry.ts

const REGISTRY = {
  "grid":        sudokuLogic,
  "word":        wordBuilderLogic,
  "minesweeper": minesweeperLogic,  // ← add this
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

That is everything. The engine handles the rest automatically.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Next.js | Component-based UI, dynamic routing |
| Styling | Tailwind CSS + NativewindCSS | Utility-first, mobile-ready |
| State Management | Zustand | No boilerplate, per-slice subscriptions |
| Game Configs | JSON Files | Human-readable, zero runtime cost |
| Backend / DB | Firebase Firestore | Real-time leaderboard, no server needed |
| Hosting | Vercel | Zero-config deploys, fast CDN |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/taptap-game-engine.git
cd taptap-game-engine

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase config values in .env.local

# 4. Run the development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Open in Browser

```
http://localhost:3000/play/sudoku-easy
http://localhost:3000/play/word-builder-medium
http://localhost:3000/leaderboard/sudoku-easy
```

---

## ♻️ Reusability Model

### Built once — never changes

- Game loop (state → action → update → check win)
- Timer and scoring system
- Leaderboard UI and query logic
- Score submission to Firebase
- JSON loader and validator

### Written fresh per game — and only this

- `initialState()` — starting board from config
- `reducer()` — what happens on each player move
- `winCondition()` — how the game knows it's over
- Board UI component — visual renderer

> **The result:** Adding a new game of an existing type = 1 JSON file.
> Adding a new game type = 1 logic file + 1 JSON file.
> The engine itself never changes.

---

## 🧠 Judging Criteria Alignment

| Criteria | Weight | How This Project Addresses It |
|----------|--------|-------------------------------|
| Functionality & Stability | 30% | Full game loop tested end-to-end. Firebase live. No hardcoded data. |
| Architecture & Reusability | 25% | State-Action-Win model. Registry pattern. Clean separation of engine vs game. |
| UI/UX Design | 20% | Tailwind + NativewindCSS. Consistent design system across all games. |
| Code Quality | 15% | TypeScript throughout. Single responsibility per file. Pure reducer functions. |
| Innovation & Creativity | 10% | JSON-driven scoring rules. Plug-and-play game registry. |

---

## 📁 Submission Deliverables

- [x] Public GitHub Repository
- [x] Deployed Live Demo — [Live Link](#)
- [x] 3-minute Demo Video — [Video Link](#)
- [x] Architecture Document (PDF)
- [x] JSON Schema Sample

---

## 🗓️ Development Timeline

| Week | Dates | Deliverable |
|------|-------|-------------|
| Week 1 | Mar 8 – Mar 14 | JSON schema + GameLoader + Registry skeleton. First game from config. |
| Week 2 | Mar 15 – Mar 21 | SessionManager + timer + score. Firebase submission working. |
| Week 3 | Mar 22 – Mar 27 | Second game type + Leaderboard UI. End-to-end flow complete. |
| Week 4 | Mar 28 – Mar 31 | Polish, README, demo video, final submission. |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📧 Contact

Submitted for **TapTap Hackathon 2026 — League 1, Engine League**
Contact: games@theblackbucks.com

---

> *Build once. Scale infinitely. Power learning through play.*
