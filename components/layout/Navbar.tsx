// components/layout/Navbar.tsx
// NEW FILE
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_LINKS } from "@/lib/constants"
import { GAME_REGISTRY } from "@/lib/gameRegistry"

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-700 leading-tight">Kratos Engine</p>
            <p className="text-xs text-gray-400 leading-tight">League 1 · 2026</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                ${path === l.href
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700
            rounded-full font-medium border border-indigo-100">
            {GAME_REGISTRY.length} games
          </span>
        </div>
      </div>
    </nav>
  )
}
