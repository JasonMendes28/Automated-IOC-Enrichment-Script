import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { getHistory } from '../services/api.js'
import StatCard from '../components/StatCard.jsx'
import { formatDate } from '../utils/helpers.js'

export default function Dashboard() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    getHistory().then(setHistory).catch(() => {})
  }, [])

  const totalIOCs = history.reduce((a, h) => a + h.total_iocs, 0)
  const totalMalicious = history.reduce((a, h) => a + h.malicious, 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="glass-card rounded-xl p-6 relative overflow-hidden cyber-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-accent/5 via-transparent to-cyber-accent2/5 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-cyber-accent" />
              <span className="font-mono text-cyber-accent text-xs tracking-widest uppercase">SOC Automation Platform</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-cyber-text mb-1">
              Automated IOC Enrichment
            </h2>
            <p className="text-cyber-subtext text-sm">
              Upload your IOC file and instantly enrich indicators using VirusTotal, AbuseIPDB, and AlienVault OTX.
            </p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-2 px-5 py-3 bg-cyber-accent text-cyber-bg font-display font-bold text-sm tracking-wider uppercase rounded-lg hover:bg-cyber-accent/90 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] shrink-0"
          >
            Start Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Analyses" value={history.length} color="#00d4ff" icon="📊" sublabel="all time" />
        <StatCard label="IOCs Processed" value={totalIOCs} color="#7c3aed" icon="🔍" sublabel="across all scans" />
        <StatCard label="Threats Found" value={totalMalicious} color="#ff2d55" icon="⚠️" sublabel="malicious IOCs" />
        <StatCard
          label="Detection Rate"
          value={totalIOCs > 0 ? `${Math.round((totalMalicious / totalIOCs) * 100)}%` : '—'}
          color="#ffd60a"
          icon="🎯"
          sublabel="malicious ratio"
        />
      </div>

      {/* API sources */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'VirusTotal', desc: 'Multi-engine antivirus scanner', color: '#0070ff', icon: '🦠' },
          { name: 'AbuseIPDB', desc: 'IP reputation database', color: '#ff6b35', icon: '🌐' },
          { name: 'AlienVault OTX', desc: 'Open threat exchange pulses', color: '#00ff88', icon: '👾' },
        ].map(src => (
          <div key={src.name} className="glass-card rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: src.color }} />
            <div className="text-2xl mb-3">{src.icon}</div>
            <div className="font-display font-bold text-cyber-text">{src.name}</div>
            <div className="text-cyber-muted text-xs font-mono mt-1">{src.desc}</div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: src.color }} />
              <span className="text-xs font-mono" style={{ color: src.color }}>CONNECTED</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent analyses */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-accent" />
            <h3 className="font-display font-semibold text-cyber-text">Recent Analyses</h3>
          </div>
          <Link to="/reports" className="text-cyber-accent text-xs font-mono hover:underline">View all →</Link>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12 text-cyber-muted font-mono">
            <div className="text-4xl mb-3">📂</div>
            <div>No analyses yet — <Link to="/upload" className="text-cyber-accent underline">upload your first IOC file</Link></div>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border/30">
            {history.slice(0, 5).map(h => (
              <div key={h.analysis_id} className="px-6 py-4 flex items-center justify-between hover:bg-cyber-card/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center text-xs">📁</div>
                  <div>
                    <div className="text-cyber-text text-sm font-mono">{h.filename}</div>
                    <div className="text-cyber-muted text-xs font-mono mt-0.5">{formatDate(h.analyzed_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono">
                  <span className="text-cyber-subtext">{h.total_iocs} IOCs</span>
                  {h.malicious > 0 && <span className="text-cyber-red font-bold">{h.malicious} malicious</span>}
                  {h.suspicious > 0 && <span className="text-yellow-400">{h.suspicious} suspicious</span>}
                  <span className="text-cyber-green">{h.safe} safe</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
