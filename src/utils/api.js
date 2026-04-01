import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://marcacion-api.matias-automatization.online'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth - InsForge OAuth
export const getOAuthUrl = () =>
  api.get('/auth/oauth/google/url')

export const verifyToken = (token) =>
  api.post('/auth/verify', { token })

export const getMe = () =>
  api.get('/auth/me')

// Attendance
export const markAttendance = (latitude, longitude) =>
  api.post('/attendance/mark', { latitude, longitude })

export const getAttendanceStatus = () =>
  api.get('/attendance/status')

export const getMyHistory = (params) =>
  api.get('/attendance/history', { params })

// Admin
export const getDashboard = () =>
  api.get('/admin/dashboard')

export const getFullHistory = (params) =>
  api.get('/admin/attendance', { params })

export const getEmployees = () =>
  api.get('/admin/employees')

export const createEmployee = (data) =>
  api.post('/admin/employees', data)

export const updateEmployee = (id, data) =>
  api.patch(`/admin/employees/${id}`, data)

export const getLocation = () =>
  api.get('/admin/location')

export const updateLocation = (data) =>
  api.put('/admin/location', data)

export const getFailedAttempts = (params) =>
  api.get('/admin/failed-attempts', { params })

export const exportReport = (params) =>
  api.get('/admin/reports', { params, responseType: 'blob' })

export default api

// Exchange InsForge code for token
export const exchangeCode = (code, pkceToken) =>
  api.post("/auth/exchange", { code, pkceToken })
