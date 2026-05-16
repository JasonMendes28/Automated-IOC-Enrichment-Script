export const threatColor = (level) => ({
  malicious: '#ff2d55', suspicious: '#ffd60a', safe: '#00ff88', unknown: '#7a9cc0',
}[level] || '#7a9cc0')

export const threatBadgeClass = (level) => ({
  malicious: 'badge-malicious', suspicious: 'badge-suspicious',
  safe: 'badge-safe', unknown: 'badge-unknown',
}[level] || 'badge-unknown')

export const iocTypeIcon = (type) => ({
  ip: '🌐', domain: '🔗', url: '📡', hash: '#️⃣', unknown: '❓',
}[type] || '❓')

export const scoreColor = (score) => {
  if (score >= 60) return '#ff2d55'
  if (score >= 20) return '#ffd60a'
  return '#00ff88'
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
