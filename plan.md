# Kratos Engine — Complete All-Screens Implementation Plan
> AI Editor Instructions: Execute tasks in strict order. Each task targets specific files only. Never modify files not listed in the task. Verify each checkpoint before proceeding.

---

## SCREENS COVERED

```
1. app/page.tsx                          → Home / Game Lobby
2. app/play/[gameId]/page.tsx            → Game Play (Sudoku + Word Builder)
3. app/leaderboard/[gameId]/page.tsx     → Full Leaderboard
4. app/profile/page.tsx                  → NEW — Player Profile
5. app/results/[gameId]/page.tsx         → NEW — Dedicated Results Screen
```

---

## NEW FILES OVERVIEW

```
app/
  page.tsx                               → Home (update)
  play/[gameId]/page.tsx                 → Play (update)
  leaderboard/[gameId]/page.tsx          → Leaderboard (update)
  profile/page.tsx                       → NEW
  results/[gameId]/page.tsx              → NEW

components/
  layout/
    Navbar.tsx                           → NEW — shared navbar
    Footer.tsx                           → NEW — shared footer
  home/
    HeroSection.tsx                      → NEW
    GameCard.tsx                         → NEW
    SearchBar.tsx                        → NEW
    CategoryFilter.tsx                   → NEW
    SortControl.tsx                      → NEW
    RecentlyPlayed.tsx                   → NEW
    FeaturedBanner.tsx                   → NEW
    EmptyState.tsx                       → NEW
  play/
    GameHeader.tsx                       → NEW
    SudokuBoard.tsx                      → extracted from Sudoku.tsx
    WordBoardUI.tsx                      → extracted from WordBuilder.tsx
    SessionSidebar.tsx                   → NEW
    HintButton.tsx                       → NEW
    KeyboardHint.tsx                     → NEW
  leaderboard/
    LeaderboardTable.tsx                 → NEW
    LeaderboardFilters.tsx               → NEW
  results/
    ScoreHero.tsx                        → NEW
    ScoreBreakdown.tsx                   → NEW (update)
    PersonalBestBanner.tsx               → NEW
    ShareCard.tsx                        → NEW
  profile/
    StatCard.tsx                         → NEW
    GameHistoryTable.tsx                 → NEW
    AchievementBadge.tsx                 → NEW

lib/
  gameRegistry.ts                        → NEW
  constants.ts                           → NEW

stores/
  recentlyPlayedStore.ts                 → NEW
  personalBestStore.ts                   → UPDATE
  uiStore.ts                             → NEW
```

---

## ═══════════════════════════════════
## PHASE 1 — FOUNDATION
## ═══════════════════════════════════

---

## TASK 1 — lib/constants.ts

```ts
// lib/constants.ts
// NEW FILE

export const DIFFICULTY_STYLES = {
  easy:   { badge: "bg-green-50 text-green-700 border-green-100",   dot: "bg-green-500"  },
  medium: { badge: "bg-amber-50 text-amber-700 border-amber-100",   dot: "bg-amber-500"  },
  hard:   { badge: "bg-red-50 text-red-700 border-red-100",         dot: "bg-red-500"    },
}

export const CATEGORY_STYLES: Record<string, { badge: string; bg: string; text: string }> = {
  logic:  { badge: "bg-indigo-50 text-indigo-700 border-indigo-100",   bg: "bg-indigo-600", text: "text-indigo-600" },
  word:   { badge: "bg-teal-50 text-teal-700 border-teal-100",         bg: "bg-teal-600",   text: "text-teal-600"   },
  math:   { badge: "bg-orange-50 text-orange-700 border-orange-100",   bg: "bg-orange-600", text: "text-orange-600" },
  speed:  { badge: "bg-red-50 text-red-700 border-red-100",            bg: "bg-red-600",    text: "text-red-600"    },
  memory: { badge: "bg-purple-50 text-purple-700 border-purple-100",   bg: "bg-purple-600", text: "text-purple-600" },
}

export const RANK_STYLES = [
  { label: "1st", bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200" },
  { label: "2nd", bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-200"  },
  { label: "3rd", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200"},
]

export const NAV_LINKS = [
  { href: "/",             label: "Games"       },
  { href: "/leaderboard",  label: "Leaderboard" },
  { href: "/profile",      label: "Profile"     },
]
```

---

## TASK 2 — lib/gameRegistry.ts

```ts
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
```

---

## TASK 3 — stores/recentlyPlayedStore.ts

```ts
// stores/recentlyPlayedStore.ts
// NEW FILE
"use client"
import { create } from "zustand"

export interface RecentPlay {
  gameId: string; title: string; score: number
  timeTaken: number; playedAt: string; maxScore: number
}

interface Store {
  recent:  RecentPlay[]
  load:    () => void
  add:     (p: RecentPlay) => void
  get:     (n?: number) => RecentPlay[]
  clear:   () => void
}

const KEY = "taptap_recent"

export const useRecentlyPlayedStore = create<Store>((set, get) => ({
  recent: [],
  load:   () => { try { const r=localStorage.getItem(KEY); if(r) set({recent:JSON.parse(r)}) } catch{} },
  add:    (p) => {
    const u = [p, ...get().recent.filter(r=>r.gameId!==p.gameId)].slice(0,10)
    set({recent:u}); try{localStorage.setItem(KEY,JSON.stringify(u))}catch{}
  },
  get:    (n=5) => get().recent.slice(0,n),
  clear:  () => { set({recent:[]}); try{localStorage.removeItem(KEY)}catch{} }
}))
```

---

## TASK 4 — stores/personalBestStore.ts

```ts
// stores/personalBestStore.ts
// REPLACE entire file
"use client"
import { create } from "zustand"

export interface PersonalBest {
  score: number; timeTaken: number; date: string
}

interface Store {
  bests:    Record<string, PersonalBest>
  load:     () => void
  get:      (id: string) => PersonalBest | null
  getAll:   () => Record<string, PersonalBest>
  set_:     (id: string, score: number, time: number) => boolean
  clear:    () => void
}

const KEY = "taptap_bests"

export const usePersonalBestStore = create<Store>((set, get) => ({
  bests: {},
  load:  () => { try { const r=localStorage.getItem(KEY); if(r) set({bests:JSON.parse(r)}) } catch{} },
  get:   (id) => get().bests[id]??null,
  getAll:() => get().bests,
  set_:  (id, score, time) => {
    const ex = get().bests[id]
    const ok = !ex || score > ex.score
    if (ok) {
      const u = {...get().bests, [id]: {score, timeTaken:time, date:new Date().toISOString()}}
      set({bests:u}); try{localStorage.setItem(KEY,JSON.stringify(u))}catch{}
    }
    return ok
  },
  clear: () => { set({bests:{}}); try{localStorage.removeItem(KEY)}catch{} }
}))
```

---

## TASK 5 — stores/uiStore.ts

```ts
// stores/uiStore.ts
// NEW FILE
"use client"
import { create } from "zustand"

interface UIStore {
  toasts:    { id: string; message: string; type: "success"|"error"|"info" }[]
  addToast:  (message: string, type?: "success"|"error"|"info") => void
  rmToast:   (id: string) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  toasts: [],
  addToast: (message, type="info") => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, {id, message, type}] }))
    setTimeout(() => get().rmToast(id), 3000)
  },
  rmToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}))
```

---

## TASK 6 — components/layout/Navbar.tsx

Shared sticky navbar used on every page.

```tsx
// components/layout/Navbar.tsx
// NEW FILE
"use client"
import Link       from "next/link"
import { usePathname } from "next/navigation"
import { NAV_LINKS }   from "@/lib/constants"
import { GAME_REGISTRY } from "@/lib/gameRegistry"

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-700 leading-tight">Kratos Engine</p>
            <p className="text-xs text-gray-400 leading-tight">League 1 · 2026</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                ${path===l.href
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700
            rounded-full font-medium border border-indigo-100">
            {GAME_REGISTRY.length} games
          </span>
        </div>
      </div>
    </nav>
  )
}
```

---

## TASK 7 — components/layout/Footer.tsx

```tsx
// components/layout/Footer.tsx
// NEW FILE
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-gray-400">
        <div>
          <p className="font-medium text-gray-500 mb-1">Kratos Engine</p>
          <p>JSON-driven · State-Action-Win · Plugin registry</p>
          <p className="mt-1">Built with React, Zustand, Firebase, Next.js</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-500 mb-1">Kratos Hackathon 2026</p>
          <p>League 1 · Engine League</p>
          <p className="mt-1">Deadline: March 31, 2026</p>
        </div>
      </div>
    </footer>
  )
}
```

---

## TASK 8 — Add Navbar + Footer to app/layout.tsx

```tsx
// app/layout.tsx
// ADD Navbar and Footer to the root layout

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kratos Engine",
  description: "JSON-driven game engine — Kratos Hackathon 2026",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
```

**Checkpoint:** All pages now show the shared navbar with active link highlighting. Footer appears on every page.

---

## ═══════════════════════════════════
## PHASE 2 — HOME SCREEN
## ═══════════════════════════════════

---

## TASK 9 — components/home/FeaturedBanner.tsx

```tsx
// components/home/FeaturedBanner.tsx
// NEW FILE
"use client"
import Link from "next/link"
import { GAME_REGISTRY } from "@/lib/gameRegistry"

export default function FeaturedBanner() {
  const featured = GAME_REGISTRY.find(g => g.isFeatured)
  if (!featured) return null
  return (
    <div className="bg-indigo-600 rounded-2xl p-6 mb-8 flex items-center justify-between">
      <div>
        <span className="text-indigo-200 text-xs font-medium uppercase tracking-wide">
          Featured game
        </span>
        <h2 className="text-white text-xl font-semibold mt-1 mb-1">{featured.title}</h2>
        <p className="text-indigo-200 text-sm max-w-xs">{featured.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-indigo-200">{featured.maxScore} pts max</span>
          <span className="text-indigo-400">·</span>
          <span className="text-xs text-indigo-200">{Math.floor(featured.timeLimit/60)} min</span>
          <span className="text-indigo-400">·</span>
          <span className="text-xs text-indigo-200 capitalize">{featured.difficulty}</span>
        </div>
      </div>
      <Link href={`/play/${featured.id}`}
        className="shrink-0 bg-white text-indigo-700 px-5 py-2.5 rounded-xl
          text-sm font-semibold hover:bg-indigo-50 transition-colors">
        Play now
      </Link>
    </div>
  )
}
```

---

## TASK 10 — components/home/HeroStats.tsx

```tsx
// components/home/HeroStats.tsx
// NEW FILE
"use client"
import { useEffect, useState }       from "react"
import { usePersonalBestStore }      from "@/stores/personalBestStore"
import { useRecentlyPlayedStore }    from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY }             from "@/lib/gameRegistry"

export default function HeroStats() {
  const [m, setM] = useState(false)
  const { load, getAll } = usePersonalBestStore()
  const { load: lRecent, recent } = useRecentlyPlayedStore()
  useEffect(() => { load(); lRecent(); setM(true) }, [])

  const bests       = m ? getAll() : {}
  const played      = Object.keys(bests).length
  const topScore    = m ? Math.max(0, ...Object.values(bests).map(b=>b.score)) : 0

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label:"Games available", val: GAME_REGISTRY.length, color:"text-indigo-600", sub:"ready to play"   },
        { label:"Games completed", val: played,               color:"text-teal-600",   sub:"out of " + GAME_REGISTRY.length },
        { label:"Your best score", val: topScore,             color:"text-amber-600",  sub:"across all games" },
      ].map(s => (
        <div key={s.label}
          className="bg-white rounded-xl border border-gray-200 p-5 text-center
            hover:border-indigo-200 transition-colors">
          <p className={`text-3xl font-semibold tabular-nums ${s.color}`}>{s.val}</p>
          <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## TASK 11 — components/home/RecentlyPlayed.tsx

```tsx
// components/home/RecentlyPlayed.tsx
// NEW FILE
"use client"
import { useEffect }              from "react"
import Link                       from "next/link"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"

export default function RecentlyPlayed() {
  const { load, get } = useRecentlyPlayedStore()
  useEffect(() => { load() }, [])
  const recent = get(4)
  if (!recent.length) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Continue playing</h2>
        <span className="text-xs text-gray-400">{recent.length} recent</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {recent.map(r => {
          const pct = Math.min(100, Math.round((r.score/r.maxScore)*100))
          return (
            <Link key={r.gameId} href={`/play/${r.gameId}`}
              className="bg-white border border-gray-200 rounded-xl p-3
                hover:border-indigo-200 transition-all group">
              <p className="text-xs font-medium text-gray-700 mb-2 group-hover:text-indigo-700
                transition-colors truncate">{r.title}</p>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-base font-semibold text-indigo-600">{r.score}</span>
                <span className="text-xs text-gray-400">{r.timeTaken}s</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{width:`${pct}%`}}/>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {new Date(r.playedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

---

## TASK 12 — components/home/SearchBar.tsx

```tsx
// components/home/SearchBar.tsx
// NEW FILE
"use client"
interface Props { value:string; onChange:(v:string)=>void }
export default function SearchBar({value,onChange}:Props) {
  return (
    <div className="relative flex-1 max-w-xs">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)}
        placeholder="Search games or tags..."
        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white
          text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400
          focus:ring-2 focus:ring-indigo-50 transition-all"/>
      {value && (
        <button onClick={()=>onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300
            hover:text-gray-500 transition-colors text-base leading-none">×</button>
      )}
    </div>
  )
}
```

---

## TASK 13 — components/home/CategoryFilter.tsx

```tsx
// components/home/CategoryFilter.tsx
// NEW FILE
"use client"
import { Category, CATEGORIES } from "@/lib/gameRegistry"
import { CATEGORY_STYLES }      from "@/lib/constants"

const INACTIVE = "text-gray-500 border-gray-200 bg-white hover:border-indigo-300 hover:text-indigo-600"
const ACTIVE_ALL = "bg-indigo-600 text-white border-indigo-600"

interface Props { active:Category; counts:Record<string,number>; onChange:(c:Category)=>void }
export default function CategoryFilter({active,counts,onChange}:Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(cat => {
        const count = counts[cat]??0
        if (cat!=="all" && count===0) return null
        const isActive = active===cat
        const style = cat==="all"
          ? (isActive ? ACTIVE_ALL : INACTIVE)
          : (isActive
            ? CATEGORY_STYLES[cat]?.badge ?? ACTIVE_ALL
            : INACTIVE)
        return (
          <button key={cat} onClick={()=>onChange(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${style}`}>
            {cat.charAt(0).toUpperCase()+cat.slice(1)}
            <span className={`ml-1.5 tabular-nums ${isActive?"opacity-70":"opacity-40"}`}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
```

---

## TASK 14 — components/home/SortControl.tsx

```tsx
// components/home/SortControl.tsx
// NEW FILE
"use client"
import { SortOption, SORT_OPTIONS } from "@/lib/gameRegistry"
const LABELS: Record<SortOption,string> = {
  featured:"Featured first", score:"Highest score", time:"Shortest time",
  difficulty:"Easiest first", newest:"Newest"
}
interface Props { value:SortOption; onChange:(s:SortOption)=>void }
export default function SortControl({value,onChange}:Props) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-gray-400">Sort</span>
      <select value={value} onChange={e=>onChange(e.target.value as SortOption)}
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white
          text-gray-600 outline-none focus:border-indigo-400 cursor-pointer transition-colors">
        {SORT_OPTIONS.map(o=><option key={o} value={o}>{LABELS[o]}</option>)}
      </select>
    </div>
  )
}
```

---

## TASK 15 — components/home/GameCard.tsx

```tsx
// components/home/GameCard.tsx
// NEW FILE
"use client"
import Link from "next/link"
import { GameMeta, formatTime }  from "@/lib/gameRegistry"
import { PersonalBest }          from "@/stores/personalBestStore"
import { DIFFICULTY_STYLES, CATEGORY_STYLES } from "@/lib/constants"

interface Props { game:GameMeta; best?:PersonalBest|null; isRecent?:boolean }

export default function GameCard({game,best,isRecent}:Props) {
  const pct     = best ? Math.min(100,Math.round((best.score/game.maxScore)*100)) : 0
  const catStyle = CATEGORY_STYLES[game.category]
  const difStyle = DIFFICULTY_STYLES[game.difficulty]

  return (
    <div className={`bg-white rounded-xl border flex flex-col overflow-hidden
      hover:shadow-sm transition-all
      ${isRecent ? "border-indigo-200" : "border-gray-200 hover:border-indigo-200"}`}>

      {/* Header badges */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catStyle?.badge??""}`}>
            {game.category}
          </span>
          {game.isNew    && <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">New</span>}
          {game.isFeatured && <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100">Featured</span>}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difStyle.badge}`}>
          {game.difficulty}
        </span>
      </div>

      {/* Title + description */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-gray-800 text-sm mb-1">{game.title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{game.description}</p>
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap px-4 pb-3">
        {game.tags.map(t=>(
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400
            rounded border border-gray-100">{t}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2.5
        border-t border-gray-50 bg-gray-50">
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-gray-400">Max score</p>
            <p className="text-xs font-semibold text-gray-700">{game.maxScore}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Time limit</p>
            <p className="text-xs font-semibold text-gray-700">{formatTime(game.timeLimit)}</p>
          </div>
        </div>
        {best
          ? <div className="text-right"><p className="text-xs text-gray-400">Your best</p><p className="text-xs font-semibold text-indigo-600">{best.score} pts</p></div>
          : <p className="text-xs text-gray-300">Not played yet</p>
        }
      </div>

      {/* Progress bar */}
      {best && (
        <div className="px-4 py-2 border-t border-gray-50">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Score progress</span>
            <span className="text-xs text-indigo-500 font-medium">{pct}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{width:`${pct}%`}}/>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-4 pt-3">
        <Link href={`/play/${game.id}`}
          className={`block text-center text-sm px-4 py-2 rounded-lg
            font-medium transition-colors
            ${best
              ? "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
              : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {best ? "Play Again" : "Play"}
        </Link>
      </div>
    </div>
  )
}
```

---

## TASK 16 — components/home/EmptyState.tsx

```tsx
// components/home/EmptyState.tsx
// NEW FILE
"use client"
interface Props { query:string; category:string; onReset:()=>void }
export default function EmptyState({query,category,onReset}:Props) {
  return (
    <div className="col-span-3 flex flex-col items-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center
        justify-center text-2xl text-gray-300">?</div>
      <div>
        <p className="text-sm font-medium text-gray-600">No games found
          {query ? ` for "${query}"` : ""}
          {category!=="all" ? ` in ${category}` : ""}
        </p>
        <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
      </div>
      <button onClick={onReset}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
        Clear all filters
      </button>
    </div>
  )
}
```

---

## TASK 17 — app/page.tsx (Home Screen)

```tsx
// app/page.tsx
// REPLACE entire file
"use client"
import { useState, useEffect, useMemo } from "react"
import { GAME_REGISTRY, filterGames, getGameCounts, Category, SortOption } from "@/lib/gameRegistry"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import FeaturedBanner  from "@/components/home/FeaturedBanner"
import HeroStats       from "@/components/home/HeroStats"
import RecentlyPlayed  from "@/components/home/RecentlyPlayed"
import SearchBar       from "@/components/home/SearchBar"
import CategoryFilter  from "@/components/home/CategoryFilter"
import SortControl     from "@/components/home/SortControl"
import GameCard        from "@/components/home/GameCard"
import EmptyState      from "@/components/home/EmptyState"

export default function Home() {
  const [category, setCategory] = useState<Category>("all")
  const [query,    setQuery]    = useState("")
  const [sort,     setSort]     = useState<SortOption>("featured")
  const [mounted,  setMounted]  = useState(false)

  const { load, getAll } = usePersonalBestStore()
  useEffect(() => { load(); setMounted(true) }, [])

  const bests    = mounted ? getAll() : {}
  const counts   = useMemo(() => getGameCounts(GAME_REGISTRY), [])
  const filtered = useMemo(() => filterGames(GAME_REGISTRY, category, query, sort), [category,query,sort])
  const reset    = () => { setCategory("all"); setQuery(""); setSort("featured") }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <FeaturedBanner />
      <HeroStats />
      <RecentlyPlayed />

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-3">
          <SearchBar value={query} onChange={setQuery} />
          <SortControl value={sort} onChange={setSort} />
        </div>
        <CategoryFilter active={category} counts={counts} onChange={setCategory} />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">
          {filtered.length === GAME_REGISTRY.length
            ? `${filtered.length} games`
            : `${filtered.length} of ${GAME_REGISTRY.length} games`}
          {query ? ` matching "${query}"` : ""}
        </p>
        {(query||category!=="all") && (
          <button onClick={reset} className="text-xs text-indigo-600 hover:text-indigo-800">
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.length===0
          ? <EmptyState query={query} category={category} onReset={reset}/>
          : filtered.map(g => (
              <GameCard key={g.id} game={g} best={bests[g.id]??null}/>
            ))
        }
      </div>
    </div>
  )
}
```

**Checkpoint:** Home page renders featured banner, hero stats, recently played (empty on first load), search + filter + sort controls, game cards with badges, and empty state when no results.

---

## ═══════════════════════════════════
## PHASE 3 — PLAY SCREEN
## ═══════════════════════════════════

---

## TASK 18 — components/play/GameHeader.tsx

```tsx
// components/play/GameHeader.tsx
// NEW FILE
"use client"
import { useRouter }    from "next/navigation"
import { JSONConfig }   from "@/lib/types"
import { CATEGORY_STYLES, DIFFICULTY_STYLES } from "@/lib/constants"

interface Props { config: JSONConfig; onQuit: () => void }
export default function GameHeader({ config, onQuit }: Props) {
  const catStyle = CATEGORY_STYLES[config.category??"logic"]
  const difStyle = DIFFICULTY_STYLES[config.difficulty??"easy"]
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3
      flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-gray-800">{config.title}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${catStyle?.badge??""}`}>
          {config.category}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difStyle.badge}`}>
          {config.difficulty}
        </span>
      </div>
      <button onClick={onQuit}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5
          rounded-lg hover:bg-red-50">
        Quit game
      </button>
    </div>
  )
}
```

---

## TASK 19 — components/play/SessionSidebar.tsx

```tsx
// components/play/SessionSidebar.tsx
// NEW FILE
"use client"
import { useSessionStore }      from "@/stores/sessionStore"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useGameStore }         from "@/stores/gameStore"
import { calculateScore }       from "@/engine/ScoreCalculator"
import Timer                    from "@/components/Timer"

interface Props { gameId: string; onHint?: () => void; hintCost: number }
export default function SessionSidebar({ gameId, onHint, hintCost }: Props) {
  const { status, timeElapsed, score }  = useSessionStore()
  const { state, config }              = useGameStore()
  const { get }                        = usePersonalBestStore()
  const best                           = get(gameId)

  const liveScore = status === "complete"
    ? score
    : (config && state ? calculateScore(config, timeElapsed, state) : 0)

  return (
    <div className="w-48 border-l border-gray-200 bg-white flex flex-col gap-0">

      {/* Timer */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time</p>
        <Timer />
        <p className="text-xs text-gray-400 mt-1">
          {status === "playing" ? "remaining" : status === "complete" ? "final" : "—"}
        </p>
      </div>

      {/* Score */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Score</p>
        <p className="text-2xl font-semibold text-indigo-600 tabular-nums">{liveScore}</p>
        <p className="text-xs text-gray-400 mt-0.5">of {config?.scoring.base ?? 0} max</p>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Errors</p>
            <p className={`text-xl font-semibold tabular-nums
              ${(state?.meta.errors??0) > 0 ? "text-red-500" : "text-gray-300"}`}>
              {state?.meta.errors ?? 0}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Hints</p>
            <p className="text-xl font-semibold tabular-nums text-gray-700">
              {state?.meta.hints ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Hint button */}
      {onHint && status === "playing" && (
        <div className="p-4 border-b border-gray-100">
          <button onClick={onHint}
            className="w-full text-xs py-2 rounded-lg border border-amber-200
              bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium">
            Use hint
            <span className="block text-amber-500 font-normal">−{hintCost} pts</span>
          </button>
        </div>
      )}

      {/* Personal best */}
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Personal best</p>
        {best
          ? <>
              <p className="text-base font-semibold text-indigo-500">{best.score} pts</p>
              <p className="text-xs text-gray-400">{best.timeTaken}s</p>
            </>
          : <p className="text-xs text-gray-300">Not set yet</p>
        }
      </div>
    </div>
  )
}
```

---

## TASK 20 — components/play/KeyboardHint.tsx

```tsx
// components/play/KeyboardHint.tsx
// NEW FILE
interface Props { renderer: string }
const KBD = ({c}:{c:string}) => (
  <kbd className="text-xs px-1.5 py-0.5 bg-gray-100 border border-gray-200
    rounded text-gray-500 font-mono">{c}</kbd>
)
export default function KeyboardHint({ renderer }: Props) {
  if (renderer !== "grid") return null
  return (
    <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="←↑→↓"/> navigate
      </span>
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="1–9"/> fill cell
      </span>
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="⌫"/> erase
      </span>
    </div>
  )
}
```

---

## TASK 21 — app/play/[gameId]/page.tsx (Play Screen)

```tsx
// app/play/[gameId]/page.tsx
// REPLACE entire file
"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter }             from "next/navigation"
import { loadConfig }           from "@/engine/GameLoader"
import { getGameLogic, getRenderer } from "@/engine/GameRegistry"
import { calculateScore }       from "@/engine/ScoreCalculator"
import { submitScore }          from "@/engine/ScoreSubmitter"
import { useGameStore }         from "@/stores/gameStore"
import { useSessionStore }      from "@/stores/sessionStore"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"
import { JSONConfig }           from "@/lib/types"
import GameHeader               from "@/components/play/GameHeader"
import SessionSidebar           from "@/components/play/SessionSidebar"
import KeyboardHint             from "@/components/play/KeyboardHint"

export default function PlayPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const [config,    setConfig]    = useState<JSONConfig|null>(null)
  const [error,     setError]     = useState<string|null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [selCell,   setSelCell]   = useState<[number,number]|null>(null)

  const { state, setGame, dispatch, reset: rG } = useGameStore()
  const { startSession, stopSession, status,
          timeElapsed, setScore, reset: rS }     = useSessionStore()
  const { load: lB, set_: setBest }              = usePersonalBestStore()
  const { load: lR, add: addRecent }             = useRecentlyPlayedStore()

  useEffect(() => {
    lB(); lR()
    async function boot() {
      try {
        rG(); rS(); setSubmitted(false); setError(null)
        const cfg   = await loadConfig(gameId)
        const logic = getGameLogic(cfg.type)
        setGame(cfg, logic)
        setConfig(cfg)
        startSession(cfg.timer.seconds)
      } catch(e:any) { setError(e.message) }
    }
    boot()
    return () => rS()
  }, [gameId])

  // Win condition
  useEffect(() => {
    if (!state||!config||status!=="playing"||submitted) return
    const logic = getGameLogic(config.type)
    if (logic.winCondition(state)) {
      stopSession()
      const final = calculateScore(config, timeElapsed, state)
      setScore(final)
      setSubmitted(true)
      setBest(gameId, final, timeElapsed)
      addRecent({ gameId, title:config.title, score:final,
                  timeTaken:timeElapsed, playedAt:new Date().toISOString(),
                  maxScore:config.scoring.base })
      submitScore({ userId:"guest", gameId, score:final, timeTaken:timeElapsed })
      router.push(`/results/${gameId}`)
    }
  }, [state])

  // Keyboard support
  const onKey = useCallback((e:KeyboardEvent) => {
    if (status!=="playing"||!config||config.renderer!=="grid") return
    const n = parseInt(e.key)
    if (n>=1&&n<=9&&selCell)
      dispatch({type:"PLACE_NUMBER",row:selCell[0],col:selCell[1],value:n})
    else if ((e.key==="Backspace"||e.key==="Delete")&&selCell)
      dispatch({type:"ERASE",row:selCell[0],col:selCell[1]})
    else if (selCell) {
      const [r,c] = selCell
      if (e.key==="ArrowRight") setSelCell([r,Math.min(8,c+1)])
      if (e.key==="ArrowLeft")  setSelCell([r,Math.max(0,c-1)])
      if (e.key==="ArrowDown")  setSelCell([Math.min(8,r+1),c])
      if (e.key==="ArrowUp")    setSelCell([Math.max(0,r-1),c])
    }
  }, [status,config,selCell,dispatch])

  useEffect(() => {
    window.addEventListener("keydown",onKey)
    return () => window.removeEventListener("keydown",onKey)
  }, [onKey])

  const handleQuit = () => { rS(); rG(); router.push("/") }

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">!</div>
      <p className="text-sm font-medium text-red-600">{error}</p>
      <button onClick={()=>router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-800">← Back to games</button>
    </div>
  )

  if (!config||!state) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-600
        border-t-transparent animate-spin"/>
      <p className="text-sm text-gray-400">Loading {gameId}...</p>
      <p className="text-xs text-gray-300">Fetching /configs/{gameId}.json</p>
    </div>
  )

  const Renderer = getRenderer(config.renderer)

  return (
    <div className="flex flex-col" style={{height:"calc(100vh - 57px)"}}>
      <GameHeader config={config} onQuit={handleQuit}/>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="flex flex-col items-center">
            <Renderer
              prefilled={config.config.prefilled??[]}
              config={config.config}
              selectedCell={selCell}
              onCellSelect={setSelCell}
            />
            <KeyboardHint renderer={config.renderer}/>
          </div>
        </div>
        <SessionSidebar
          gameId={gameId}
          hintCost={config.scoring.hintPenalty??100}
          onHint={() => dispatch({type:"USE_HINT"})}
        />
      </div>
    </div>
  )
}
```

**Checkpoint:** Play page loads game. Header shows title + badges. Sidebar shows live timer, score, errors, hints, personal best. Keyboard navigation works. On win, redirects to `/results/[gameId]`.

---

## ═══════════════════════════════════
## PHASE 4 — RESULTS SCREEN
## ═══════════════════════════════════

---

## TASK 22 — components/results/ScoreHero.tsx

```tsx
// components/results/ScoreHero.tsx
// NEW FILE
"use client"
interface Props {
  score: number; maxScore: number; rank: number|null
  isNewBest: boolean; title: string
}
export default function ScoreHero({ score, maxScore, rank, isNewBest, title }: Props) {
  const pct = Math.min(100, Math.round((score/maxScore)*100))
  return (
    <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white mb-6">
      {isNewBest && (
        <div className="inline-block bg-amber-400 text-amber-900 text-xs font-bold
          px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          New personal best!
        </div>
      )}
      <p className="text-indigo-200 text-sm mb-2">{title}</p>
      <p className="text-6xl font-bold tabular-nums mb-1">{score}</p>
      <p className="text-indigo-200 text-sm">out of {maxScore} points</p>
      <div className="mt-5 h-2 bg-indigo-500 rounded-full overflow-hidden max-w-xs mx-auto">
        <div className="h-full bg-white rounded-full transition-all duration-700"
          style={{width:`${pct}%`}}/>
      </div>
      <p className="text-indigo-200 text-xs mt-2">{pct}% of max score</p>
      {rank && (
        <div className="mt-4 inline-flex items-center gap-2 bg-indigo-500
          px-4 py-2 rounded-full text-sm">
          <span className="text-indigo-200">Your rank</span>
          <span className="font-bold">#{rank}</span>
        </div>
      )}
    </div>
  )
}
```

---

## TASK 23 — components/results/ScoreBreakdown.tsx

```tsx
// components/results/ScoreBreakdown.tsx
// REPLACE entire file
"use client"
import { useEffect, useState } from "react"
import { JSONConfig }          from "@/lib/types"
import { GameState }           from "@/lib/types"

interface Props {
  config: JSONConfig; timeElapsed: number
  state: GameState;  finalScore: number
}

export default function ScoreBreakdown({ config, timeElapsed, state, finalScore }: Props) {
  const [visible, setVisible] = useState(0)
  const s = config.scoring

  const rows = [
    { label: "Base score",                  val: s.base,                          positive: true  },
    { label: `Time penalty  (${timeElapsed}s × ${s.timePenalty})`, val: -(timeElapsed*(s.timePenalty||0)), positive: false },
    ...(state.meta.errors>0&&s.errorPenalty ? [{ label:`Error penalty  (${state.meta.errors} × ${s.errorPenalty})`, val:-(state.meta.errors*s.errorPenalty), positive:false }] : []),
    ...(state.meta.hints>0&&s.hintPenalty   ? [{ label:`Hint penalty  (${state.meta.hints} × ${s.hintPenalty})`,    val:-(state.meta.hints*s.hintPenalty),   positive:false }] : []),
  ]

  useEffect(() => {
    if (visible >= rows.length+1) return
    const t = setTimeout(() => setVisible(v=>v+1), 350)
    return () => clearTimeout(t)
  }, [visible, rows.length])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
        Score breakdown
      </p>
      <div className="space-y-2">
        {rows.slice(0, visible).map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm
            transition-all duration-300">
            <span className="text-gray-500">{r.label}</span>
            <span className={`font-semibold tabular-nums
              ${r.positive ? "text-gray-800" : "text-red-500"}`}>
              {r.val > 0 ? `+${r.val}` : r.val}
            </span>
          </div>
        ))}
        {visible > rows.length && (
          <div className="flex justify-between items-center pt-3 mt-2
            border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-800">Final score</span>
            <span className="text-xl font-bold text-indigo-600 tabular-nums">{finalScore}</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## TASK 24 — app/results/[gameId]/page.tsx (Results Screen)

```tsx
// app/results/[gameId]/page.tsx
// NEW FILE
"use client"
import { useEffect, useState }  from "react"
import { useParams, useRouter } from "next/navigation"
import Link                     from "next/link"
import { useSessionStore }      from "@/stores/sessionStore"
import { useGameStore }         from "@/stores/gameStore"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY }        from "@/lib/gameRegistry"
import ScoreHero                from "@/components/results/ScoreHero"
import ScoreBreakdown           from "@/components/results/ScoreBreakdown"
import Leaderboard              from "@/components/Leaderboard"

export default function ResultsPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const { score, timeElapsed, status }   = useSessionStore()
  const { state, config }               = useGameStore()
  const { load, get }                   = usePersonalBestStore()
  const { load: lR, get: getRecent }    = useRecentlyPlayedStore()

  const [isNewBest, setIsNewBest] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    load(); lR(); setMounted(true)
    const best = get(gameId)
    setIsNewBest(best?.score === score && score > 0)
  }, [])

  const gameMeta = GAME_REGISTRY.find(g => g.id === gameId)

  // If navigated directly (no session), redirect home
  if (mounted && !config && !state) {
    router.replace("/")
    return null
  }

  if (!config || !state || !gameMeta) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent
        rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <ScoreHero
        score={score}
        maxScore={config.scoring.base}
        rank={null}
        isNewBest={isNewBest}
        title={config.title}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ScoreBreakdown
          config={config}
          timeElapsed={timeElapsed}
          state={state}
          finalScore={score}
        />
        <div className="flex flex-col gap-4">
          {/* Time card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Session stats
            </p>
            <div className="space-y-2">
              {[
                { label:"Time taken",  val:`${timeElapsed}s`          },
                { label:"Errors made", val:state.meta.errors           },
                { label:"Hints used",  val:state.meta.hints            },
                { label:"Moves made",  val:state.moves?.length ?? 0    },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="font-medium text-gray-700">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personal best card */}
          {mounted && (() => {
            const best = get(gameId)
            return best ? (
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-3">
                  Personal best
                </p>
                <p className="text-2xl font-bold text-indigo-700">{best.score}</p>
                <p className="text-xs text-indigo-400 mt-1">{best.timeTaken}s · {new Date(best.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
              </div>
            ) : null
          })()}
        </div>
      </div>

      {/* Leaderboard preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-700">Top scores</p>
          <Link href={`/leaderboard/${gameId}`}
            className="text-xs text-indigo-600 hover:text-indigo-800">
            View full →
          </Link>
        </div>
        <Leaderboard gameId={gameId}/>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push(`/play/${gameId}`)}
          className="flex-1 py-3 rounded-xl border-2 border-indigo-200
            text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors">
          Play Again
        </button>
        <button onClick={() => router.push("/")}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white
            font-semibold text-sm hover:bg-indigo-700 transition-colors">
          All Games
        </button>
        <Link href={`/leaderboard/${gameId}`}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700
            font-semibold text-sm hover:bg-gray-200 transition-colors text-center">
          Leaderboard
        </Link>
      </div>
    </div>
  )
}
```

**Checkpoint:** After completing a game, redirects to `/results/sudoku-easy`. Score hero shows with progress bar. Breakdown animates. Session stats show. Action buttons work.

---

## ═══════════════════════════════════
## PHASE 5 — LEADERBOARD SCREEN
## ═══════════════════════════════════

---

## TASK 25 — components/leaderboard/LeaderboardFilters.tsx

```tsx
// components/leaderboard/LeaderboardFilters.tsx
// NEW FILE
"use client"
const FILTERS = ["all time","this week","today"] as const
type Filter = typeof FILTERS[number]
interface Props { active:Filter; onChange:(f:Filter)=>void; total:number }
export default function LeaderboardFilters({active,onChange,total}:Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={()=>onChange(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
              ${active===f
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">{total} players</p>
    </div>
  )
}
```

---

## TASK 26 — app/leaderboard/[gameId]/page.tsx (Leaderboard Screen)

```tsx
// app/leaderboard/[gameId]/page.tsx
// REPLACE entire file
"use client"
import { useEffect, useState }  from "react"
import { useParams, useRouter } from "next/navigation"
import Link                     from "next/link"
import { db }                   from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { GAME_REGISTRY }        from "@/lib/gameRegistry"
import { usePersonalBestStore } from "@/stores/personalBestStore"
import { DIFFICULTY_STYLES }    from "@/lib/constants"

interface Entry { userId:string; score:number; timeTaken:number; createdAt?:any }

export default function LeaderboardPage() {
  const params  = useParams()
  const router  = useRouter()
  const gameId  = params.gameId as string

  const [entries,  setEntries]  = useState<Entry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [timeFilter, setTime]   = useState("all time")
  const [mounted, setMounted]   = useState(false)

  const { load, get } = usePersonalBestStore()
  useEffect(() => { load(); setMounted(true) }, [])

  const gameMeta = GAME_REGISTRY.find(g => g.id === gameId)
  const myBest   = mounted ? get(gameId) : null

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const q = query(
          collection(db,"scores"),
          where("gameId","==",gameId),
          orderBy("score","desc"),
          orderBy("timeTaken","asc"),
          limit(20)
        )
        const snap = await getDocs(q)
        setEntries(snap.docs.map(d=>d.data() as Entry))
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch_()
  }, [gameId, timeFilter])

  const myRank = myBest
    ? entries.findIndex(e => e.score <= myBest.score) + 1
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">
            {gameMeta?.title ?? gameId} — Leaderboard
          </h1>
          <p className="text-sm text-gray-400">Sorted by score · time as tie-breaker</p>
        </div>
        {gameMeta && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
            ${DIFFICULTY_STYLES[gameMeta.difficulty].badge}`}>
            {gameMeta.difficulty}
          </span>
        )}
      </div>

      {/* My best banner */}
      {myBest && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6
          flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-500 font-medium mb-0.5">Your personal best</p>
            <p className="text-2xl font-bold text-indigo-700">{myBest.score} pts</p>
            <p className="text-xs text-indigo-400">{myBest.timeTaken}s · {new Date(myBest.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
          </div>
          {myRank && (
            <div className="text-center">
              <p className="text-xs text-indigo-400 mb-1">Your rank</p>
              <p className="text-3xl font-bold text-indigo-700">#{myRank}</p>
            </div>
          )}
        </div>
      )}

      {/* Time filter */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {["all time","this week","today"].map(f => (
            <button key={f} onClick={()=>setTime(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
                ${timeFilter===f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">{entries.length} players</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-0 px-5 py-3 bg-gray-50
          border-b border-gray-100 text-xs text-gray-400 font-medium">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Player</span>
          <span className="col-span-3 text-right">Score</span>
          <span className="col-span-3 text-right">Time</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent
              rounded-full animate-spin"/>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No scores yet. Be the first to play!
          </div>
        ) : (
          entries.map((e, i) => {
            const isMe = myBest?.score === e.score && myBest?.timeTaken === e.timeTaken
            const medalColors = ["text-amber-600","text-gray-500","text-orange-600"]
            return (
              <div key={i}
                className={`grid grid-cols-12 gap-0 px-5 py-3 items-center
                  border-b border-gray-50 last:border-0 text-sm transition-colors
                  ${isMe ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                <span className={`col-span-1 font-semibold
                  ${i<3 ? medalColors[i] : "text-gray-400"}`}>
                  {i+1}
                </span>
                <div className="col-span-5 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                    text-xs font-semibold
                    ${isMe
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600"}`}>
                    {e.userId.slice(0,2).toUpperCase()}
                  </div>
                  <span className={`font-medium ${isMe?"text-indigo-700":"text-gray-700"}`}>
                    {isMe ? "You" : e.userId}
                  </span>
                </div>
                <span className={`col-span-3 text-right font-semibold
                  ${isMe ? "text-indigo-700" : "text-gray-800"}`}>
                  {e.score}
                </span>
                <span className="col-span-3 text-right text-gray-400">
                  {e.timeTaken}s
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push(`/play/${gameId}`)}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium
            text-sm hover:bg-indigo-700 transition-colors">
          Play Again
        </button>
        <button onClick={() => router.push("/")}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600
            font-medium text-sm hover:bg-gray-50 transition-colors">
          All Games
        </button>
      </div>
    </div>
  )
}
```

**Checkpoint:** Leaderboard shows ranked list. My best banner appears after playing. Time filter buttons visible. Play Again + All Games buttons work.

---

## ═══════════════════════════════════
## PHASE 6 — PROFILE SCREEN
## ═══════════════════════════════════

---

## TASK 27 — app/profile/page.tsx (Profile Screen)

```tsx
// app/profile/page.tsx
// NEW FILE
"use client"
import { useEffect, useState }    from "react"
import Link                       from "next/link"
import { usePersonalBestStore }   from "@/stores/personalBestStore"
import { useRecentlyPlayedStore } from "@/stores/recentlyPlayedStore"
import { GAME_REGISTRY }          from "@/lib/gameRegistry"
import { DIFFICULTY_STYLES }      from "@/lib/constants"

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const { load: lB, getAll }  = usePersonalBestStore()
  const { load: lR, get }     = useRecentlyPlayedStore()

  useEffect(() => { lB(); lR(); setMounted(true) }, [])

  const bests  = mounted ? getAll() : {}
  const recent = mounted ? get(10)  : []

  const gamesPlayed    = Object.keys(bests).length
  const totalScore     = Object.values(bests).reduce((s,b) => s+b.score, 0)
  const bestScore      = Math.max(0, ...Object.values(bests).map(b=>b.score))
  const avgTime        = recent.length
    ? Math.round(recent.reduce((s,r) => s+r.timeTaken, 0) / recent.length)
    : 0

  const achievements = [
    { label:"First play",    earned: gamesPlayed>=1,  desc:"Complete your first game"    },
    { label:"All games",     earned: gamesPlayed>=GAME_REGISTRY.length, desc:"Play every game at least once" },
    { label:"High scorer",   earned: bestScore>=900,  desc:"Score 900+ in any game"      },
    { label:"Speed runner",  earned: avgTime>0&&avgTime<90, desc:"Average under 90 seconds" },
    { label:"Dedicated",     earned: recent.length>=5, desc:"Play 5 or more games"       },
    { label:"Perfectionist", earned: Object.values(bests).some(b=>b.score>=950), desc:"Score 950+ in any game" },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6
        flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center
          justify-center text-white text-2xl font-bold">
          G
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">Guest Player</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kratos Engine · League 1</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Member since</p>
          <p className="text-sm font-medium text-gray-600">March 2026</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label:"Games played",  val:gamesPlayed, color:"text-indigo-600" },
          { label:"Total score",   val:totalScore,  color:"text-teal-600"   },
          { label:"Best score",    val:bestScore,   color:"text-amber-600"  },
          { label:"Avg time (s)",  val:avgTime||"—",color:"text-purple-600" },
        ].map(s => (
          <div key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Personal bests per game */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Personal bests</h2>
          <span className="text-xs text-gray-400">{gamesPlayed} games</span>
        </div>
        {GAME_REGISTRY.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No games played yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {GAME_REGISTRY.map(g => {
              const best = bests[g.id]
              const pct  = best ? Math.min(100,Math.round((best.score/g.maxScore)*100)) : 0
              return (
                <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-700">{g.title}</p>
                      <span className={`text-xs font-medium px-2 py-0 rounded-full border
                        ${DIFFICULTY_STYLES[g.difficulty].badge}`}>
                        {g.difficulty}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    {best
                      ? <>
                          <p className="text-sm font-semibold text-indigo-600">{best.score} pts</p>
                          <p className="text-xs text-gray-400">{best.timeTaken}s</p>
                        </>
                      : <Link href={`/play/${g.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Play now →
                        </Link>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Achievements</h2>
          <span className="text-xs text-gray-400">
            {achievements.filter(a=>a.earned).length} / {achievements.length} earned
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {achievements.map(a => (
            <div key={a.label}
              className={`rounded-xl border p-4 text-center transition-all
                ${a.earned
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-100 bg-gray-50 opacity-50"}`}>
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center
                justify-center text-lg
                ${a.earned ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                {a.earned ? "✓" : "?"}
              </div>
              <p className={`text-xs font-semibold mb-1
                ${a.earned ? "text-indigo-800" : "text-gray-500"}`}>
                {a.label}
              </p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Play history</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map((r,i) => {
              const meta = GAME_REGISTRY.find(g=>g.id===r.gameId)
              const pct  = Math.min(100,Math.round((r.score/(meta?.maxScore??1000))*100))
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">{r.title}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(r.playedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full"
                        style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <p className="text-sm font-semibold text-indigo-600">{r.score}</p>
                    <p className="text-xs text-gray-400">{r.timeTaken}s</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Checkpoint:** Profile page shows avatar, stats, personal bests for all games with progress bars, 6 achievements with earned/locked states, and play history.

---

## ═══════════════════════════════════
## PHASE 7 — FINAL VERIFICATION
## ═══════════════════════════════════

---

## TASK 28 — Verify All Screens

```bash
# 1. Build check
npm run build

# ── Home ──────────────────────────────────────
# 2. /
# Featured banner shows a game
# Hero stats render (0 played initially)
# Recently played hidden on first visit
# Search filters by title and tag
# Category filter shows counts, hides empty cats
# Sort works for all 5 options
# Empty state shows + "Clear filters" button works
# Game cards show difficulty + category badges
# Play button → "Play Again" after first completion

# ── Play ──────────────────────────────────────
# 3. /play/sudoku-easy
# Loading spinner shown while config fetches
# GameHeader shows title + category + difficulty badges
# Session sidebar shows timer, live score, errors, hints, personal best
# Keyboard: 1-9 fills selected cell
# Keyboard: ←↑→↓ moves selection
# Keyboard: ⌫ erases cell
# On win → redirects to /results/sudoku-easy

# 4. /play/word-builder-medium
# Same header + sidebar
# Letter tiles clickable
# Submit/Clear buttons work
# Found words turn green

# ── Results ───────────────────────────────────
# 5. /results/sudoku-easy (after playing)
# Score hero shows with progress bar
# Score breakdown animates step by step
# Session stats show correct values
# Personal best card shows
# Leaderboard preview shows
# Play Again + All Games + Leaderboard buttons all work
# "New personal best!" banner on first play

# ── Leaderboard ───────────────────────────────
# 6. /leaderboard/sudoku-easy
# My best banner shows with rank if applicable
# Time filter buttons toggle
# Table shows ranked entries with avatar circles
# Your row highlighted in indigo
# Play Again + All Games buttons work

# ── Profile ───────────────────────────────────
# 7. /profile
# Stats cards show correct counts
# Personal bests table shows all games
# Unplayed games show "Play now →" link
# Achievements lock/unlock correctly based on stats
# Play history shows after playing games
# Progress bars fill relative to max score

# ── Navigation ────────────────────────────────
# 8. Navbar
# Active link highlighted on every page
# Logo links back to home
# Game count badge updates if you add games

# ── Persistence ───────────────────────────────
# 9. Refresh any page after playing
# Recently played persists
# Personal bests persist
# Profile stats still show


---

## Final Submission Checklist

- [ ] `npm run build` zero errors
- [ ] Home — featured banner, hero stats, recently played, search, filter, sort, game cards, empty state
- [ ] Play — loading state, game header, keyboard support, session sidebar with live score, personal best
- [ ] Results — score hero, animated breakdown, session stats, leaderboard preview, actions
- [ ] Leaderboard — my best banner, time filter, ranked table with my row highlighted, actions
- [ ] Profile — stats, personal bests per game, achievements, play history
- [ ] Navbar on every page with active link
- [ ] Footer on every page
- [ ] All localStorage data persists on refresh
