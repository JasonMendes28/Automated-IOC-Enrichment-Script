import { threatBadgeClass } from '../utils/helpers.js'

export default function ThreatBadge({ level }) {
  const labels = {
    malicious: '🔴 MALICIOUS',
    suspicious: '🟡 SUSPICIOUS',
    safe: '🟢 SAFE',
    unknown: '⚪ UNKNOWN',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold tracking-wider ${threatBadgeClass(level)}`}>
      {labels[level] || labels.unknown}
    </span>
  )
}
