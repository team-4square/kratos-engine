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
