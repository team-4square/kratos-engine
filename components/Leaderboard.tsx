"use client"
import { useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { useLeaderboardStore } from "@/stores/leaderboardStore"

export default function Leaderboard({ gameId }: { gameId: string }) {
  const { entries, loading, setEntries, setLoading } = useLeaderboardStore()

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const q = query(
          collection(db, "scores"),
          where("gameId", "==", gameId),
          orderBy("score", "desc"),
          orderBy("timeTaken", "asc"),
          limit(10)
        )
        const snap = await getDocs(q)
        setEntries(snap.docs.map(d => d.data() as any))
      } catch (e) {
        console.error("Leaderboard fetch failed:", e)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [gameId])

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!entries.length) return <p className="text-sm text-gray-400">No scores yet.</p>

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg text-sm">
          <span className="w-6 font-semibold text-gray-400">{i + 1}</span>
          <span className="flex-1 text-gray-700">{e.userId}</span>
          <span className="font-semibold text-indigo-600">{e.score}</span>
          <span className="text-gray-400 w-14 text-right">{e.timeTaken}s</span>
        </div>
      ))}
    </div>
  )
}
