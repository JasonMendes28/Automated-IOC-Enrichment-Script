import { useEffect, useState } from 'react'
import { FileText, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { getHistory } from '../services/api.js'
import { formatDate } from '../utils/helpers.js'

export default function ReportsPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-cyber-text flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyber-accent" />
          Analysis Reports
        </h2>
        <p className="text-cyber-muted text-sm font-mono mt-1">History of all enrichment analyses (last 50)</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-accent" />
            <span className="font-display font-semibold text-cyber-text">Analysis History</span>
          </div>
          <span className="text-cyber-muted text-xs font-mono">{history.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyber-accent animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-cyber-muted font-mono">
            <div className="text-5xl mb-4">📂</div>
            <div className="text-lg font-semibold text-cyber-subtext mb-2">No reports yet</div>
            <div className="text-sm">Run an analysis to see reports here</div>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border/30">
            {history.map((h, i) => (
              <div key={h.analysis_id} className="px-6 py-5 flex items-center justify-between hover:bg-cyber-card/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyber-accent/5 border border-cyber-accent/20 flex items-center justify-center text-sm font-mono text-cyber-accent font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-cyber-text font-mono text-sm font-semibold">{h.filename}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-cyber-muted text-xs font-mono">{formatDate(h.analyzed_at)}</span>
                      <span className="text-cyber-muted/40 font-mono text-xs">•</span>
                      <span className="text-cyber-muted text-xs font-mono">{h.total_iocs} IOCs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Threat breakdown */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {h.malicious > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-cyber-red" />
                        <span className="text-cyber-red font-bold">{h.malicious}</span>
                      </div>
                    )}
                    {h.suspicious > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-yellow-400">{h.suspicious}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green" />
                      <span className="text-cyber-green">{h.safe}</span>
                    </div>
                  </div>

                  {/* Severity indicator */}
                  <div className={`w-2 h-2 rounded-full ${
                    h.malicious > 0 ? 'bg-cyber-red animate-pulse' :
                    h.suspicious > 0 ? 'bg-yellow-400' : 'bg-cyber-green'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-4 h-4 text-cyber-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-cyber-subtext text-xs font-mono font-semibold">REPORT STORAGE</p>
          <p className="text-cyber-muted text-xs font-mono mt-1">
            CSV and Markdown reports are saved to <code className="text-cyber-accent">backend/app/reports/</code>.
            Download links are available immediately after each analysis on the Upload page.
          </p>
        </div>
      </div>
    </div>
  )
}
