import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, AlertTriangle } from 'lucide-react'

export default function DropZone({ onFile, loading }) {
  const [file, setFile] = useState(null)
  const [textMode, setTextMode] = useState(false)
  const [rawText, setRawText] = useState('')

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: loading,
  })

  const handleSubmit = () => {
    if (file) onFile(file)
  }

  const handleTextSubmit = () => {
    if (rawText.trim()) {
      // Create a blob file from text
      const blob = new Blob([rawText], { type: 'text/plain' })
      const f = new File([blob], 'manual_input.txt', { type: 'text/plain' })
      onFile(f)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {['File Upload', 'Paste IOCs'].map((mode, i) => (
          <button
            key={mode}
            onClick={() => setTextMode(i === 1)}
            className={`px-4 py-2 rounded-lg text-sm font-mono border transition-all ${
              textMode === (i === 1)
                ? 'bg-cyber-accent/10 border-cyber-accent/40 text-cyber-accent'
                : 'border-cyber-border text-cyber-muted hover:border-cyber-border/60'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {!textMode ? (
        <>
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-cyber-accent bg-cyber-accent/5 shadow-[0_0_30px_rgba(0,212,255,0.1)]'
                : file
                ? 'border-cyber-green/50 bg-cyber-green/5'
                : 'border-cyber-border hover:border-cyber-accent/40 hover:bg-cyber-card/30'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-3">
                <FileText className="w-12 h-12 text-cyber-green mx-auto" />
                <div>
                  <p className="text-cyber-green font-mono font-semibold">{file.name}</p>
                  <p className="text-cyber-muted text-sm font-mono mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  className="text-cyber-muted hover:text-cyber-red transition-colors"
                >
                  <X className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full border border-cyber-accent/20 bg-cyber-accent/5 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-cyber-accent" />
                </div>
                <div>
                  <p className="text-cyber-text font-semibold">Drop your IOC file here</p>
                  <p className="text-cyber-muted text-sm font-mono mt-1">or click to browse</p>
                </div>
                <p className="text-cyber-muted/60 text-xs font-mono">Supports .txt and .csv files • One IOC per line</p>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyber-accent text-cyber-bg font-display font-bold text-base tracking-wider uppercase hover:bg-cyber-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
            >
              {loading ? '🔄 Enriching...' : '🛡️ Enrich IOCs'}
            </button>
          )}
        </>
      ) : (
        <>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={`Paste your IOCs here — one per line:\n\n8.8.8.8\nevil-domain.com\nhttps://malware.example.com/payload\nabc123def456...`}
            rows={10}
            className="w-full bg-cyber-card border border-cyber-border rounded-xl p-4 text-cyber-text font-mono text-sm placeholder-cyber-muted/50 focus:border-cyber-accent/50 focus:outline-none focus:ring-1 focus:ring-cyber-accent/20 resize-none transition-all"
          />
          <button
            onClick={handleTextSubmit}
            disabled={loading || !rawText.trim()}
            className="w-full py-3 rounded-xl bg-cyber-accent text-cyber-bg font-display font-bold text-base tracking-wider uppercase hover:bg-cyber-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            {loading ? '🔄 Enriching...' : '🛡️ Analyze IOCs'}
          </button>
        </>
      )}

      {/* Sample format hint */}
      <div className="glass-card rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-cyber-yellow shrink-0 mt-0.5" />
          <div>
            <p className="text-cyber-subtext text-xs font-mono font-semibold mb-1">EXPECTED FORMAT</p>
            <div className="text-cyber-muted text-xs font-mono space-y-0.5">
              <div># Comments are ignored</div>
              <div className="text-cyber-green">185.220.101.45</div>
              <div className="text-cyber-green">malicious-domain.ru</div>
              <div className="text-cyber-green">https://phishing-site.com/login</div>
              <div className="text-cyber-green">d41d8cd98f00b204e9800998ecf8427e</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
