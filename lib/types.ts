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
