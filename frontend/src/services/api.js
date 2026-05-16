import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1', timeout: 120000 })

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'API Error'
    return Promise.reject(new Error(msg))
  }
)

export const enrichFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/enrich', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return res.data
}

export const enrichText = async (text) => {
  const res = await api.post('/enrich/text', { text })
  return res.data
}

export const downloadCSV = (analysisId) =>
  window.open(`/api/v1/report/${analysisId}/csv`, '_blank')

export const downloadMarkdown = (analysisId) =>
  window.open(`/api/v1/report/${analysisId}/markdown`, '_blank')

export const getHistory = async () => {
  const res = await api.get('/history')
  return res.data
}

export const healthCheck = async () => {
  const res = await api.get('/health')
  return res.data
}
