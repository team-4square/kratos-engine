"use client"
import { useSessionStore } from "@/stores/sessionStore"

export default function Timer() {
  const timer  = useSessionStore(s => s.timer)
  const status = useSessionStore(s => s.status)
  const mins   = Math.floor(timer / 60).toString().padStart(2, "0")
  const secs   = (timer % 60).toString().padStart(2, "0")
  return (
    <div className={`text-3xl font-mono font-semibold tabular-nums
      ${timer <= 30 && status === "playing" ? "text-red-500" : "text-gray-800"}`}>
      {mins}:{secs}
    </div>
  )
}
