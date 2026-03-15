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
