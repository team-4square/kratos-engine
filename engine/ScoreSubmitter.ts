// engine/ScoreSubmitter.ts
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ScoreSubmission } from "@/lib/types"

export async function submitScore(data: ScoreSubmission): Promise<void> {
  try {
    await addDoc(collection(db, "scores"), {
      ...data,
      createdAt: serverTimestamp()
    })
  } catch (e) {
    console.error("Score submission failed:", e)
    // Do NOT rethrow — Firebase failure must not crash the game
  }
}
