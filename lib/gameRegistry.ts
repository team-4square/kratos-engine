// lib/gameRegistry.ts
// NEW FILE

export interface GameMeta {
  id:          string
  title:       string
  description: string
  type:        string
  renderer:    string
  category:    "logic" | "word" | "math" | "speed" | "memory"
  difficulty:  "easy" | "medium" | "hard"
  maxScore:    number
  timeLimit:   number
  tags:        string[]
  isNew?:      boolean
  isFeatured?: boolean
  addedAt:     string
}

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: "sudoku-easy", title: "Sudoku Easy",
    description: "Fill the 9×9 grid. No repeated numbers in any row, column or box.",
    type: "sudoku", renderer: "grid", category: "logic", difficulty: "easy",
    maxScore: 1000, timeLimit: 300, tags: ["numbers","logic","classic"],
    isFeatured: true, addedAt: "2026-03-01",
  },
  {
    id: "sudoku-hard", title: "Sudoku Hard",
    description: "Fewer clues, higher stakes. Only the sharpest minds finish.",
    type: "sudoku", renderer: "grid", category: "logic", difficulty: "hard",
    maxScore: 2000, timeLimit: 180, tags: ["numbers","logic","challenge"],
    addedAt: "2026-03-01",
  },
  {
    id: "word-builder-medium", title: "Word Builder",
    description: "Build as many words as you can from the given letters before time runs out.",
    type: "wordBuilder", renderer: "word", category: "word", difficulty: "medium",
    maxScore: 500, timeLimit: 180, tags: ["words","vocabulary","spelling"],
    isFeatured: true, addedAt: "2026-03-01",
  },
]

export const CATEGORIES = ["all","logic","word","math","speed","memory"] as const
export type Category   = typeof CATEGORIES[number]
export const SORT_OPTIONS = ["featured","score","time","difficulty","newest"] as const
export type SortOption = typeof SORT_OPTIONS[number]

export function filterGames(games: GameMeta[], category: Category, query: string, sort: SortOption): GameMeta[] {
  let r = [...games]
  if (category !== "all")  r = r.filter(g => g.category === category)
  if (query.trim()) {
    const q = query.toLowerCase()
    r = r.filter(g => g.title.toLowerCase().includes(q) || g.tags.some(t => t.includes(q)))
  }
  r.sort((a, b) => {
    if (sort === "score")      return b.maxScore - a.maxScore
    if (sort === "time")       return a.timeLimit - b.timeLimit
    if (sort === "difficulty") return ({easy:0,medium:1,hard:2}[a.difficulty]) - ({easy:0,medium:1,hard:2}[b.difficulty])
    if (sort === "newest")     return b.addedAt.localeCompare(a.addedAt)
    return (b.isFeatured?1:0) - (a.isFeatured?1:0)
  })
  return r
}

export function getGameCounts(games: GameMeta[]): Record<string, number> {
  const c: Record<string,number> = { all: games.length }
  games.forEach(g => { c[g.category] = (c[g.category]??0)+1 })
  return c
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds/60), s = seconds%60
  return s===0 ? `${m}m` : `${m}m ${s}s`
}
