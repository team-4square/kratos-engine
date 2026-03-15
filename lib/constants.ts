// lib/constants.ts
// NEW FILE

export const DIFFICULTY_STYLES = {
  easy:   { badge: "bg-green-50 text-green-700 border-green-100",   dot: "bg-green-500"  },
  medium: { badge: "bg-amber-50 text-amber-700 border-amber-100",   dot: "bg-amber-500"  },
  hard:   { badge: "bg-red-50 text-red-700 border-red-100",         dot: "bg-red-500"    },
}

export const CATEGORY_STYLES: Record<string, { badge: string; bg: string; text: string }> = {
  logic:  { badge: "bg-indigo-50 text-indigo-700 border-indigo-100",   bg: "bg-indigo-600", text: "text-indigo-600" },
  word:   { badge: "bg-teal-50 text-teal-700 border-teal-100",         bg: "bg-teal-600",   text: "text-teal-600"   },
  math:   { badge: "bg-orange-50 text-orange-700 border-orange-100",   bg: "bg-orange-600", text: "text-orange-600" },
  speed:  { badge: "bg-red-50 text-red-700 border-red-100",            bg: "bg-red-600",    text: "text-red-600"    },
  memory: { badge: "bg-purple-50 text-purple-700 border-purple-100",   bg: "bg-purple-600", text: "text-purple-600" },
}

export const RANK_STYLES = [
  { label: "1st", bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200" },
  { label: "2nd", bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-200"  },
  { label: "3rd", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200"},
]

export const NAV_LINKS = [
  { href: "/",             label: "Games"       },
  { href: "/leaderboard",  label: "Leaderboard" },
  { href: "/profile",      label: "Profile"     },
]
