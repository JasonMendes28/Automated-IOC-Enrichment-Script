import { scoreColor } from '../utils/helpers.js'

export default function ScoreBar({ score }) {
  const color = scoreColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-cyber-card rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}
