import { JSONConfig } from "@/lib/types"

export async function loadConfig(gameId: string): Promise<JSONConfig> {
  const res = await fetch(`/configs/${gameId}.json`)
  if (!res.ok) throw new Error(`Config not found for gameId: "${gameId}"`)

  const config: JSONConfig = await res.json()

  const required = ["gameId","type","title","timer","scoring","config"]
  for (const field of required) {
    if (!(field in config)) throw new Error(`GameLoader: missing required field "${field}"`)
  }
  if (!config.timer.mode)    throw new Error(`GameLoader: missing timer.mode`)
  if (!config.timer.seconds) throw new Error(`GameLoader: missing timer.seconds`)
  if (!config.scoring.base)  throw new Error(`GameLoader: missing scoring.base`)

  return config
}
