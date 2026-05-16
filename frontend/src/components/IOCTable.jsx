import { useState } from 'react'
import { Search, ChevronUp, ChevronDown, Globe, ExternalLink } from 'lucide-react'
import ThreatBadge from './ThreatBadge.jsx'
import ScoreBar from './ScoreBar.jsx'
import { iocTypeIcon, formatDate } from '../utils/helpers.js'

export default function IOCTable({ results = [] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortField, setSortField] = useState('threat_score')
  const [sortDir, setSortDir] = useState('desc')
  const [expanded, setExpanded] = useState(null)

  const FILTERS = ['all', 'malicious', 'suspicious', 'safe']

  const filtered = results
    .filter(r => filter === 'all' || r.threat_level === filter)
    .filter(r =>
      !search ||
      r.value.toLowerCase().includes(search.toLowerCase()) ||
      r.ioc_type.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] ?? 0
      const bVal = b[sortField] ?? 0
      return sortDir === 'asc'
        ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
        : (bVal < aVal ? -1 : bVal > aVal ? 1 : 0)
    })

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-cyber-accent" />
      : <ChevronDown className="w-3 h-3 text-cyber-accent" />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search IOCs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cyber-card border border-cyber-border rounded-lg text-cyber-text text-sm font-mono placeholder-cyber-muted focus:border-cyber-accent/50 focus:outline-none focus:ring-1 focus:ring-cyber-accent/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                filter === f
                  ? f === 'all' ? 'bg-cyber-accent/10 border-cyber-accent/40 text-cyber-accent'
                    : f === 'malicious' ? 'badge-malicious' : f === 'suspicious' ? 'badge-suspicious' : 'badge-safe'
                  : 'border-cyber-border text-cyber-muted hover:border-cyber-border/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-cyber-muted text-xs font-mono">
        Showing <span className="text-cyber-accent">{filtered.length}</span> of {results.length} IOCs
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-card/50">
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider">
                  <button onClick={() => toggleSort('value')} className="flex items-center gap-1 hover:text-cyber-text transition-colors">
                    Indicator <SortIcon field="value" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider">Threat</th>
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider w-40">
                  <button onClick={() => toggleSort('threat_score')} className="flex items-center gap-1 hover:text-cyber-text transition-colors">
                    Score <SortIcon field="threat_score" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider">Country</th>
                <th className="text-left px-4 py-3 text-cyber-muted text-xs font-mono uppercase tracking-wider">VT Hits</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ioc, i) => (
                <>
                  <tr
                    key={ioc.id}
                    onClick={() => setExpanded(expanded === ioc.id ? null : ioc.id)}
                    className={`border-b border-cyber-border/30 hover:bg-cyber-card/40 cursor-pointer transition-colors ${
                      i % 2 === 0 ? '' : 'bg-cyber-card/10'
                    }`}
                  >
                    <td className="px-4 py-3 text-lg">{iocTypeIcon(ioc.ioc_type)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-cyber-text max-w-xs truncate">{ioc.value}</td>
                    <td className="px-4 py-3"><ThreatBadge level={ioc.threat_level} /></td>
                    <td className="px-4 py-3 w-40"><ScoreBar score={ioc.threat_score} /></td>
                    <td className="px-4 py-3 text-cyber-subtext text-xs font-mono">{ioc.country || '—'}</td>
                    <td className="px-4 py-3">
                      {ioc.vt_malicious > 0
                        ? <span className="text-cyber-red text-xs font-mono font-bold">{ioc.vt_malicious}/{ioc.vt_total_engines}</span>
                        : <span className="text-cyber-muted text-xs font-mono">0/{ioc.vt_total_engines || 0}</span>
                      }
                    </td>
                  </tr>
                  {expanded === ioc.id && (
                    <tr key={`${ioc.id}-exp`} className="bg-cyber-card/30">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                          <div className="space-y-2">
                            <div className="text-cyber-accent font-semibold uppercase tracking-wider mb-2">VirusTotal</div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Malicious:</span><span className="text-cyber-red">{ioc.vt_malicious}</span></div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Suspicious:</span><span className="text-cyber-yellow">{ioc.vt_suspicious}</span></div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Total Engines:</span><span className="text-cyber-text">{ioc.vt_total_engines}</span></div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-cyber-accent font-semibold uppercase tracking-wider mb-2">AbuseIPDB</div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Abuse Score:</span><span className="text-cyber-yellow">{ioc.abuseipdb_score}%</span></div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Reports:</span><span className="text-cyber-text">{ioc.abuseipdb_reports}</span></div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-cyber-accent font-semibold uppercase tracking-wider mb-2">AlienVault OTX</div>
                            <div className="flex justify-between"><span className="text-cyber-muted">Pulses:</span><span className="text-cyber-text">{ioc.otx_pulses}</span></div>
                            <div className="flex justify-between"><span className="text-cyber-muted">ASN:</span><span className="text-cyber-text">{ioc.asn || '—'}</span></div>
                            {ioc.tags.length > 0 && (
                              <div>
                                <span className="text-cyber-muted">Tags: </span>
                                {ioc.tags.map(t => (
                                  <span key={t} className="inline-block bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 rounded px-1.5 py-0.5 text-xs mr-1 mt-1">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-cyber-muted font-mono">
              <div className="text-4xl mb-3">🔍</div>
              <div>No IOCs match your filter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
