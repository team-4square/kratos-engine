// app/leaderboard/[gameId]/page.tsx
"use client"
import { useParams, useRouter } from "next/navigation"
import Leaderboard from "@/components/Leaderboard"

export default function LeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
        <button onClick={() => router.push(`/play/${gameId}`)}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Play Again
        </button>
      </div>
      <div className="bg-white rounded-xl border p-5">
        <Leaderboard gameId={gameId} />
      </div>
      <button onClick={() => router.push("/")} className="mt-4 text-sm text-gray-500 hover:text-gray-800">
        ← Back to games
      </button>
    </div>
  )
}
