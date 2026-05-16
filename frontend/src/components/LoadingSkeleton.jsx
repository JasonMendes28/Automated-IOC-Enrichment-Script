export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Scanning animation */}
      <div className="glass-card rounded-xl p-6 text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-cyber-accent/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-cyber-accent animate-spin" />
          <div className="absolute inset-2 rounded-full border border-cyber-accent/10" />
          <div className="absolute inset-0 flex items-center justify-center text-cyber-accent text-xs font-mono">🛡️</div>
        </div>
        <div>
          <p className="text-cyber-accent font-mono text-sm animate-pulse">SCANNING THREAT INTELLIGENCE FEEDS</p>
          <p className="text-cyber-muted text-xs font-mono mt-1">Querying VirusTotal • AbuseIPDB • OTX</p>
        </div>
        {/* Progress bars */}
        <div className="space-y-2 text-left max-w-sm mx-auto">
          {['VirusTotal', 'AbuseIPDB', 'AlienVault OTX'].map((api, i) => (
            <div key={api} className="flex items-center gap-3">
              <span className="text-cyber-muted text-xs font-mono w-28">{api}</span>
              <div className="flex-1 h-1 bg-cyber-card rounded-full overflow-hidden">
                <div className="h-full bg-cyber-accent rounded-full animate-pulse"
                  style={{ width: `${60 + i * 15}%`, animationDelay: `${i * 0.2}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton rows */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="w-20 h-4 bg-cyber-card rounded animate-pulse" />
          <div className="flex-1 h-4 bg-cyber-card rounded animate-pulse" />
          <div className="w-24 h-6 bg-cyber-card rounded animate-pulse" />
          <div className="w-16 h-4 bg-cyber-card rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
