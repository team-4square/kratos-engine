# JSON Configuration Structure
### Kratos Engine — taptap Hackathon 2026 · League 1

---

## What Is the JSON Config?

The JSON config file is the **contract between a game and the engine**. It is a single file that describes everything the engine needs to know about a game — before a single line of game code runs.

When a player opens `/play/sudoku-easy`, the engine reads `sudoku-easy.json`. From that one file it knows:
- Which logic module and renderer to use
- How long the timer should run
- How the score should be calculated
- What the starting board should look like

No game data is hardcoded anywhere in the engine. All of it comes from these files.

---

## Why JSON?

- **Human-readable** — anyone can open and understand a config file without reading code
- **Version-controllable** — every config change is tracked in Git like any other file
- **Zero runtime cost** — plain text, loads instantly
- **Completely decoupled** — the engine reads configs at runtime, not at build time

---

## The Full Schema

Every JSON config file must follow this structure:

```
Root Level
├── gameId        (string, required)
├── type          (string, required)
├── title         (string, required)
├── difficulty    (string, optional)
├── timer
│   ├── mode      (string, required)
│   └── seconds   (number, required)
├── scoring
│   ├── base          (number, required)
│   ├── timePenalty   (number, required)
│   ├── errorPenalty  (number, optional)
│   └── hintPenalty   (number, optional)
└── config        (object, required)
    └── [game-specific fields — see sub-schemas below]
```

---

## Field Reference — Every Field Explained

### `gameId`
- **Type:** string
- **Required:** yes
- **Purpose:** Unique identifier for this game. Used as the URL slug, the Firebase document key, and the leaderboard filter.
- **Rule:** Must be unique across all config files. Use lowercase with hyphens.
- **Example:** `"sudoku-easy"` → game lives at `/play/sudoku-easy`

---

### `type`
- **Type:** string
- **Required:** yes
- **Purpose:** The most important field in the file. The GameRegistry reads this and finds the correct logic module and renderer.
- **Allowed values:** `"grid"`, `"word"` (and any new types you register)
- **Rule:** Must exactly match a key in `GameRegistry.ts`.
- **Example:** `"type": "grid"` → loads `GridRenderer` and `sudokuLogic`

> If `type` doesn't match any registry entry, the engine throws: `Unknown game type: "xyz"`. This is intentional — fail loudly so errors are caught immediately.

---

### `title`
- **Type:** string
- **Required:** yes
- **Purpose:** Display name shown in the UI header, leaderboard title, and browser tab.
- **Example:** `"Sudoku Easy"`

---

### `difficulty`
- **Type:** string
- **Required:** no
- **Allowed values:** `"easy"`, `"medium"`, `"hard"`
- **Purpose:** A label that drives the values in the `config` block. A hard Sudoku has fewer prefilled cells. A hard Word Builder has longer target words. The difficulty label itself doesn't do anything — it's the config values that change.
- **Example:** `"difficulty": "hard"`

---

### `timer`

The timer block configures the session timer. The engine reads this to start and manage the clock automatically.

```json
"timer": {
  "mode":    "countdown",
  "seconds": 300
}
```

#### `timer.mode`
- **Type:** string
- **Required:** yes
- **Allowed values:**
  - `"countdown"` — timer counts down from `seconds` to 0. Game ends if timer hits 0 before win condition is met.
  - `"countup"` — timer counts up from 0. Records how long the player took. `seconds` sets the maximum allowed time before auto-end.
- **Use countdown for:** puzzle games where time pressure is part of the challenge (Sudoku)
- **Use countup for:** games where speed is measured but there's no strict time limit

#### `timer.seconds`
- **Type:** number
- **Required:** yes
- **Purpose:** The duration in seconds.
  - For `countdown`: starting value (300 = 5 minutes)
  - For `countup`: maximum allowed time before session auto-ends
- **Example:** `300` = 5 minutes, `180` = 3 minutes, `60` = 1 minute

---

### `scoring`

The scoring block defines the formula used to calculate the final score. The engine reads these values and applies them automatically. The formula never changes — only the numbers fed into it change.

```json
"scoring": {
  "base":         1000,
  "timePenalty":  2,
  "errorPenalty": 50,
  "hintPenalty":  100
}
```

**The formula:**
```
score = base
      − (timeElapsed   × timePenalty)
      − (errors        × errorPenalty)
      − (hints         × hintPenalty)
```

#### `scoring.base`
- **Type:** number
- **Required:** yes
- **Purpose:** The maximum score a perfect player receives. Every player starts here and loses points.
- **Example:** `1000`

#### `scoring.timePenalty`
- **Type:** number
- **Required:** yes
- **Purpose:** Points lost per second elapsed. Higher = more aggressive time pressure.
- **Example:** `2` → a player who takes 130 seconds loses `130 × 2 = 260` points

#### `scoring.errorPenalty`
- **Type:** number
- **Required:** no (defaults to 0)
- **Purpose:** Points lost per error made during the game. Use for games where mistakes should be penalised beyond just lost time.
- **Example:** `50` → 3 errors costs `3 × 50 = 150` points

#### `scoring.hintPenalty`
- **Type:** number
- **Required:** no (defaults to 0)
- **Purpose:** Points lost per hint used. Discourages players from relying on hints.
- **Example:** `100` → using 2 hints costs `2 × 100 = 200` points

---

### `config`

The config block contains the game-specific data. The engine passes this block directly into `initialState()` without reading it. Each game type defines its own expected structure.

---

## Sub-Schemas — Config Block Per Game Type

### Grid Games (`type: "grid"`)

Used for board-based games like Sudoku, Number Fill, Logic Grids.

```json
"config": {
  "gridSize":  9,
  "prefilled": [
    [0, 0, 5],
    [0, 1, 3],
    [2, 4, 7]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `gridSize` | number | Board dimensions. `9` = 9×9 grid. |
| `prefilled` | array | Array of `[row, col, value]` tuples. Row and col are **0-indexed**. |

**Reading the prefilled array:**
- `[0, 0, 5]` → row 0, column 0, value 5 (top-left cell = 5)
- `[0, 1, 3]` → row 0, column 1, value 3
- `[2, 4, 7]` → row 2, column 4, value 7

The `initialState()` function places these values on the board at startup. All other cells start empty.

---

### Word Games (`type: "word"`)

Used for word-based games like Word Builder, Anagram Solver, Word Search.

```json
"config": {
  "letters":     ["A", "P", "L", "E", "T", "R"],
  "minLength":   3,
  "targetWords": ["PLATE", "PETAL", "LATER", "ALERT", "ALTER"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `letters` | string[] | The available letters the player can use to form words. |
| `minLength` | number | Minimum word length the engine will accept as a submission. |
| `targetWords` | string[] | The words the player must find to complete the game. |

**Rule check:** Every word in `targetWords` must be formable using only the letters in `letters`. If a word uses a letter not in the set, `initialState()` will fail to validate.

---

## Complete Sample Files

### Sample 1 — Sudoku Easy (Grid Game)

```json
{
  "gameId":     "sudoku-easy",
  "type":       "grid",
  "title":      "Sudoku Easy",
  "difficulty": "easy",
  "timer": {
    "mode":    "countdown",
    "seconds": 300
  },
  "scoring": {
    "base":         1000,
    "timePenalty":  2,
    "errorPenalty": 50,
    "hintPenalty":  100
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

---

### Sample 2 — Word Builder Medium (Word Game)

```json
{
  "gameId":     "word-builder-medium",
  "type":       "word",
  "title":      "Word Builder",
  "difficulty": "medium",
  "timer": {
    "mode":    "countdown",
    "seconds": 180
  },
  "scoring": {
    "base":         500,
    "timePenalty":  1,
    "errorPenalty": 25
  },
  "config": {
    "letters":     ["A","P","L","E","T","R"],
    "minLength":   3,
    "targetWords": ["PLATE","PETAL","LATER","ALERT","ALTER","LEAP","TALE","TAPE","TRAP","REAP"]
  }
}
```

---

## Validation Rules

The `GameLoader.ts` validates every config file before the game boots. These are the checks it runs:

| Check | What It Validates |
|-------|-------------------|
| Required fields exist | `gameId`, `type`, `title`, `timer`, `scoring`, `config` |
| Correct types | `gameId` is string, `timer.seconds` is number, etc. |
| Known game type | `type` must exist as a key in `GameRegistry` |
| Valid timer mode | `timer.mode` must be `"countdown"` or `"countup"` |
| Positive numbers | `scoring.base`, `timer.seconds` must be > 0 |

If any check fails, the engine throws a clear error message before rendering anything. This prevents broken games from silently failing mid-session.

---

## How Config Files Flow Through the Engine

```
sudoku-easy.json
        ↓
GameLoader.ts validates the file
        ↓
type = "grid" → GameRegistry finds sudokuLogic
        ↓
timer block → SessionManager configures the clock
        ↓
scoring block → ScoreCalculator stores the formula values
        ↓
config block → passed into sudokuLogic.initialState()
        ↓
game boots with correct board, timer, and scoring rules
```

The engine reads the top-level fields. The game reads the `config` block. They never interfere with each other.

---

> *The schema is the only thing you design before writing any engine or game code. Get it right first and everything else slots in cleanly.*
