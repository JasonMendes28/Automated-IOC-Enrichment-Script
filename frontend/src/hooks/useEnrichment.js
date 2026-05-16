/**
 * hooks/useEnrichment.js
 * ──────────────────────
 * Custom hook that manages enrichment state:
 *   – uploads a file or submits a text IOC list
 *   – tracks loading, progress, error, and results
 *   – exposes filter/search helpers
 */

import { useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { uploadIOCFile, enrichIOCList } from '../services/api'

export function useEnrichment() {
  const [results,    setResults]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [error,      setError]      = useState(null)
  const [sessionId,  setSessionId]  = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  // ── Submission helpers ──────────────────────────────────────────────────────

  const submitFile = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setProgress(0)
    const toastId = toast.loading('Uploading and enriching IOCs…')

    try {
      const data = await uploadIOCFile(file, setProgress)
      setResults(data)
      setSessionId(data.session_id)
      toast.success(
        `Enrichment complete — ${data.total} IOCs analysed`,
        { id: toastId }
      )
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [])

  const submitText = useCallback(async (rawText) => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) {
      toast.error('No IOCs found in input.')
      return
    }
    setLoading(true)
    setError(null)
    const toastId = toast.loading('Enriching IOCs…')
    try {
      const data = await enrichIOCList(lines)
      setResults(data)
      setSessionId(data.session_id)
      toast.success(`${data.total} IOCs enriched`, { id: toastId })
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults(null)
    setError(null)
    setProgress(0)
    setSessionId(null)
    setSearchTerm('')
    setTypeFilter('all')
    setLevelFilter('all')
  }, [])

  // ── Filtered results ────────────────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    if (!results?.results) return []
    return results.results.filter((ioc) => {
      const matchSearch =
        !searchTerm ||
        ioc.ioc_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ioc.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchType =
        typeFilter === 'all' || ioc.ioc_type === typeFilter
      const matchLevel =
        levelFilter === 'all' || ioc.threat_level === levelFilter
      return matchSearch && matchType && matchLevel
    })
  }, [results, searchTerm, typeFilter, levelFilter])

  return {
    results,
    filteredResults,
    loading,
    progress,
    error,
    sessionId,
    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    levelFilter, setLevelFilter,
    submitFile,
    submitText,
    clear,
  }
}
