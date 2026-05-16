export default function StatCard({ label, value, color = '#00d4ff', icon, sublabel }) {
  return (
    <div className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-cyber-accent/30 transition-all duration-300">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-cyber-subtext text-xs font-mono uppercase tracking-widest">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            {icon}
          </div>
        )}
      </div>

      <div className="font-display text-4xl font-bold" style={{ color }}>
        {value}
      </div>

      {sublabel && (
        <div className="text-cyber-muted text-xs font-mono mt-2">{sublabel}</div>
      )}

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}08 0%, transparent 70%)` }} />
    </div>
  )
}
