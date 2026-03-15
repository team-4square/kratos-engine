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
