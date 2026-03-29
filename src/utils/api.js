import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const loginWithGoogle = (credential) =>
  api.post('/auth/google', { credential })

export const getMe = () =>
  api.get('/auth/me')

// Attendance
export const markAttendance = (latitude, longitude) =>
  api.post('/attendance/mark', { latitude, longitude })

export const getMyHistory = (params) =>
  api.get('/attendance/history', { params })

// Admin - Dashboard
export const getDashboard = () =>
  api.get('/admin/dashboard')

// Admin - Full history
export const getFullHistory = (params) =>
  api.get('/admin/attendance', { params })

// Admin - Employees
export const getEmployees = () =>
  api.get('/admin/employees')

export const createEmployee = (data) =>
  api.post('/admin/employees', data)

export const updateEmployee = (id, data) =>
  api.put(`/admin/employees/${id}`, data)

// Admin - Location
export const getLocation = () =>
  api.get('/admin/location')

export const updateLocation = (data) =>
  api.put('/admin/location', data)

// Admin - Failed attempts
export const getFailedAttempts = (params) =>
  api.get('/admin/failed-attempts', { params })

// Admin - Export
export const exportReport = (params) =>
  api.get('/admin/export', {
    params,
    responseType: 'blob',
  })

export default api
