import { NavLink } from 'react-router-dom'
import { Shield, Upload, BarChart3, FileText, Activity, Zap } from 'lucide-react'

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'IOC Upload' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reports', icon: FileText, label: 'Reports' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-cyber-surface border-r border-cyber-border flex flex-col z-10 relative shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center animate-glow">
            <Shield className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <div className="font-display font-bold text-cyber-accent text-lg leading-none tracking-wider">IOC</div>
            <div className="font-display text-cyber-subtext text-xs tracking-widest uppercase">Platform</div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="px-4 py-3 border-b border-cyber-border/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-green/5 border border-cyber-green/20">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse-slow" />
          <span className="text-cyber-green text-xs font-mono font-medium">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-cyber-muted text-xs font-mono uppercase tracking-widest mb-3 px-3">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 shadow-[0_0_10px_rgba(0,212,255,0.1)]'
                : 'text-cyber-subtext hover:text-cyber-text hover:bg-cyber-card/60 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyber-accent' : 'text-cyber-muted group-hover:text-cyber-subtext'}`} />
                <span className="font-body">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-accent" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyber-border/50">
        <div className="flex items-center gap-2 text-cyber-muted text-xs font-mono">
          <Zap className="w-3 h-3 text-cyber-accent/50" />
          <span>VT • AbuseIPDB • OTX</span>
        </div>
        <div className="text-cyber-muted/50 text-xs font-mono mt-1">v1.0.0 • SOC Edition</div>
      </div>
    </aside>
  )
}
