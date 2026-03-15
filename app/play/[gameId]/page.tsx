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
          onHint={() => dispatch({type:"USE_HINT", config})}
        />
      </div>
    </div>
  )
}
