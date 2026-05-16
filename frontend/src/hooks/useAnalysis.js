import { useState, useCallback } from 'react'
import { enrichFile, enrichText } from '../services/api.js'
import toast from 'react-hot-toast'

export const useAnalysis = () => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const analyzeFile = useCallback(async (file) => {
    setLoading(true); setError(null); setProgress(0)
    try {
      toast.loading('Enriching IOCs — querying threat intelligence...', { id: 'enrich' })
      const result = await enrichFile(file, setProgress)
      setAnalysis(result)
      toast.success(`${result.total} IOCs analyzed — ${result.malicious} malicious detected`, { id: 'enrich' })
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { id: 'enrich' })
    } finally { setLoading(false); setProgress(100) }
  }, [])

  const analyzeText = useCallback(async (text) => {
    setLoading(true); setError(null)
    try {
      toast.loading('Enriching IOCs...', { id: 'enrich' })
      const result = await enrichText(text)
      setAnalysis(result)
      toast.success(`${result.total} IOCs analyzed`, { id: 'enrich' })
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { id: 'enrich' })
    } finally { setLoading(false) }
  }, [])

  const clearAnalysis = useCallback(() => {
    setAnalysis(null); setError(null); setProgress(0)
  }, [])

  return { analysis, loading, progress, error, analyzeFile, analyzeText, clearAnalysis }
}
