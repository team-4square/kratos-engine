import Link from "next/link"

const GAMES = [
  { id: "sudoku-easy",         title: "Sudoku Easy",  type: "Grid", difficulty: "Easy",   maxScore: 1000 },
  { id: "word-builder-medium", title: "Word Builder", type: "Word", difficulty: "Medium", maxScore: 500  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-1">TapTap Engine</h1>
        <p className="text-gray-500 text-sm mb-8">JSON-driven game engine · TapTap Hackathon 2026 · League 1</p>
        <div className="grid grid-cols-3 gap-4">
          {GAMES.map(g => (
            <div key={g.id} className="bg-white rounded-xl border p-5 flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-gray-800">{g.title}</h2>
                  <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">{g.type}</span>
                </div>
                <p className="text-xs text-gray-400">{g.difficulty} · {g.maxScore} pts max</p>
              </div>
              <Link href={`/play/${g.id}`}
                className="block text-center text-sm bg-indigo-600 text-white px-4 py-2
                  rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Play
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
