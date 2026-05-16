import { Shield, Bell, Clock } from 'lucide-react'

export default function Navbar({ title = 'Dashboard' }) {
  const now = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <header className="h-14 border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg font-semibold text-cyber-text tracking-wide">{title}</h1>
        <span className="text-cyber-muted/50 font-mono text-xs">//</span>
        <span className="text-cyber-accent/70 font-mono text-xs">AUTOMATED IOC ENRICHMENT</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-cyber-muted text-xs font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{now} UTC</span>
        </div>
        <button className="w-8 h-8 rounded-lg border border-cyber-border hover:border-cyber-accent/40 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-cyber-muted" />
        </button>
      </div>
    </header>
  )
}
