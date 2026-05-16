import { useState } from 'react'
import { Shield, Download, RefreshCw, AlertTriangle } from 'lucide-react'
import DropZone from '../components/DropZone.jsx'
import IOCTable from '../components/IOCTable.jsx'
import StatCard from '../components/StatCard.jsx'
import LoadingSkeleton from '../components/LoadingSkeleton.jsx'
import { useAnalysis } from '../hooks/useAnalysis.js'
import { downloadCSV, downloadMarkdown } from '../services/api.js'

export default function UploadPage() {
  const { analysis, loading, progress, error, analyzeFile, clearAnalysis } = useAnalysis()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-cyber-text flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-accent" />
            IOC Enrichment
          </h2>
          <p className="text-cyber-muted text-sm font-mono mt-1">Upload file or paste IOCs for automated threat enrichment</p>
        </div>
        {analysis && (
          <button
            onClick={clearAnalysis}
            className="flex items-center gap-2 px-4 py-2 border border-cyber-border rounded-lg text-cyber-muted hover:text-cyber-text hover:border-cyber-border/60 text-sm font-mono transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>
        )}
      </div>

      {!analysis && !loading && (
        <div className="max-w-2xl">
          <DropZone onFile={analyzeFile} loading={loading} />
        </div>
      )}

      {loading && (
        <div className="max-w-2xl">
          {progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-mono text-cyber-muted mb-1">
                <span>Upload progress</span><span>{progress}%</span>
              </div>
              <div className="h-1 bg-cyber-card rounded-full overflow-hidden">
                <div className="h-full bg-cyber-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <LoadingSkeleton />
        </div>
      )}

      {error && !loading && (
        <div className="glass-card rounded-xl p-6 border-cyber-red/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0 mt-0.5" />
            <div>
              <p className="text-cyber-red font-semibold">Enrichment Failed</p>
              <p className="text-cyber-muted text-sm font-mono mt-1">{error}</p>
              <p className="text-cyber-muted text-xs font-mono mt-2">
                Ensure your backend is running and API keys are configured in <code className="text-cyber-accent">.env</code>
              </p>
            </div>
          </div>
          <button
            onClick={clearAnalysis}
            className="mt-4 px-4 py-2 border border-cyber-border rounded-lg text-cyber-muted hover:text-cyber-text text-sm font-mono transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total IOCs" value={analysis.total} color="#00d4ff" icon="🔍" />
            <StatCard label="Malicious" value={analysis.malicious} color="#ff2d55" icon="🔴" />
            <StatCard label="Suspicious" value={analysis.suspicious} color="#ffd60a" icon="🟡" />
            <StatCard label="Safe" value={analysis.safe} color="#00ff88" icon="🟢" />
            <StatCard label="Unknown" value={analysis.unknown} color="#7a9cc0" icon="⚪" />
          </div>

          {/* Download buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => downloadCSV(analysis.analysis_id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyber-card border border-cyber-border rounded-lg text-cyber-text text-sm font-mono hover:border-cyber-accent/40 hover:text-cyber-accent transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => downloadMarkdown(analysis.analysis_id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyber-card border border-cyber-border rounded-lg text-cyber-text text-sm font-mono hover:border-cyber-accent/40 hover:text-cyber-accent transition-all"
            >
              <Download className="w-4 h-4" />
              Export Markdown
            </button>
          </div>

          {/* IOC Table */}
          <IOCTable results={analysis.results} />
        </div>
      )}
    </div>
  )
}
