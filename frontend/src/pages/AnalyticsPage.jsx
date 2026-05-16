import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { getHistory } from '../services/api.js'
import { BarChart3 } from 'lucide-react'

const COLORS = { malicious: '#ff2d55', suspicious: '#ffd60a', safe: '#00ff88', unknown: '#7a9cc0' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-lg px-4 py-3 border border-cyber-border text-xs font-mono">
      <p className="text-cyber-subtext mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [history, setHistory] = useState([])

  useEffect(() => { getHistory().then(setHistory).catch(() => {}) }, [])

  // Aggregate stats
  const totals = history.reduce(
    (acc, h) => ({
      malicious: acc.malicious + h.malicious,
      suspicious: acc.suspicious + h.suspicious,
      safe: acc.safe + h.safe,
      unknown: acc.unknown + (h.total_iocs - h.malicious - h.suspicious - h.safe),
    }),
    { malicious: 0, suspicious: 0, safe: 0, unknown: 0 }
  )

  const pieData = [
    { name: 'Malicious', value: totals.malicious, color: COLORS.malicious },
    { name: 'Suspicious', value: totals.suspicious, color: COLORS.suspicious },
    { name: 'Safe', value: totals.safe, color: COLORS.safe },
    { name: 'Unknown', value: totals.unknown, color: COLORS.unknown },
  ].filter(d => d.value > 0)

  const barData = history.slice(0, 8).reverse().map(h => ({
    name: h.filename.replace('.txt', '').replace('.csv', '').slice(0, 12),
    malicious: h.malicious,
    suspicious: h.suspicious,
    safe: h.safe,
  }))

  const radarData = [
    { metric: 'Detection Rate', value: history.length > 0 ? Math.round((totals.malicious / Math.max(totals.malicious + totals.safe + totals.suspicious, 1)) * 100) : 0 },
    { metric: 'Analyses Run', value: Math.min(history.length * 10, 100) },
    { metric: 'IOCs Processed', value: Math.min(history.reduce((a, h) => a + h.total_iocs, 0) / 10, 100) },
    { metric: 'Threat Coverage', value: history.length > 0 ? 85 : 0 },
    { metric: 'API Health', value: 90 },
  ]

  if (history.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full min-h-96 text-center">
        <BarChart3 className="w-16 h-16 text-cyber-muted mb-4" />
        <h3 className="font-display text-xl font-bold text-cyber-text mb-2">No Analytics Data Yet</h3>
        <p className="text-cyber-muted font-mono text-sm">Run your first IOC analysis to see charts and statistics here.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-cyber-text flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyber-accent" />
          Threat Analytics
        </h2>
        <p className="text-cyber-muted text-sm font-mono mt-1">Aggregated threat intelligence from {history.length} analyses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-cyber-text mb-4">Threat Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-cyber-subtext text-xs font-mono">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-cyber-text mb-4">Platform Health</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a3a5c" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#7a9cc0', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Radar name="Score" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.1} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        {barData.length > 0 && (
          <div className="glass-card rounded-xl p-6 lg:col-span-2">
            <h3 className="font-display font-semibold text-cyber-text mb-4">Analysis History</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#7a9cc0', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7a9cc0', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span className="text-cyber-subtext text-xs font-mono capitalize">{v}</span>} />
                <Bar dataKey="malicious" fill="#ff2d55" radius={[3, 3, 0, 0]} name="Malicious" />
                <Bar dataKey="suspicious" fill="#ffd60a" radius={[3, 3, 0, 0]} name="Suspicious" />
                <Bar dataKey="safe" fill="#00ff88" radius={[3, 3, 0, 0]} name="Safe" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
