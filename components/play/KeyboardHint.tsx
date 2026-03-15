// components/play/KeyboardHint.tsx
// NEW FILE
interface Props { renderer: string }
const KBD = ({c}:{c:string}) => (
  <kbd className="text-xs px-1.5 py-0.5 bg-gray-100 border border-gray-200
    rounded text-gray-500 font-mono">{c}</kbd>
)
export default function KeyboardHint({ renderer }: Props) {
  if (renderer !== "grid") return null
  return (
    <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="←↑→↓"/> navigate
      </span>
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="1–9"/> fill cell
      </span>
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <KBD c="⌫"/> erase
      </span>
    </div>
  )
}
