import axios from 'axios'

// Local dev: Vite proxy handles /api → localhost:8000
// Production: set VITE_API_BASE_URL=https://your-backend.railway.app/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Endpoints ─────────────────────────────────────────────────

export const getStats = () => api.get('/stats').then(r => r.data)
export const getDashboardSummary = (params) => api.get('/dashboard-summary', { params }).then(r => r.data)
export const getTransactions = (params) => api.get('/transactions', { params }).then(r => r.data)
export const getEmployees = () => api.get('/employees').then(r => r.data)
export const getProducts = () => api.get('/products').then(r => r.data)
export const getClients = () => api.get('/clients').then(r => r.data)
export const getAlerts = () => api.get('/alerts').then(r => r.data)
export const getActivityLog = () => api.get('/activity-log').then(r => r.data)
export const getRevenueTrend = (params) => api.get('/revenue-trend', { params }).then(r => r.data)
export const getRegionComparison = () => api.get('/region-comparison').then(r => r.data)
export const getProductDistribution = () => api.get('/product-distribution').then(r => r.data)
export const getCEOSummary = () => api.get('/ceo-summary').then(r => r.data)
export const getReports = (type, params) => api.get(`/reports/${type}`, { params }).then(r => r.data)

// Auth
export const authLogin = (payload) => api.post('/auth/login', payload).then(r => r.data)
export const authChangePassword = (payload) => api.post('/auth/change-password', payload).then(r => r.data)

export default api
