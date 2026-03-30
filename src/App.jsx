import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth
import Login from './components/auth/Login'
import Callback from './components/auth/Callback'

// Employee
import EmployeeDashboard from './components/employee/EmployeeDashboard'
import EmployeeHistory from './components/employee/EmployeeHistory'

// Admin
import AdminDashboard from './components/admin/AdminDashboard'
import EmployeeManagement from './components/admin/EmployeeManagement'
import LocationConfig from './components/admin/LocationConfig'
import ReportExport from './components/admin/ReportExport'
import FailedAttempts from './components/admin/FailedAttempts'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/employee" replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Login />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/employee" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth/callback" element={<Callback />} />

      <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/history" element={<ProtectedRoute><EmployeeHistory /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/employees" element={<AdminRoute><EmployeeManagement /></AdminRoute>} />
      <Route path="/admin/location" element={<AdminRoute><LocationConfig /></AdminRoute>} />
      <Route path="/admin/failed-attempts" element={<AdminRoute><FailedAttempts /></AdminRoute>} />
      <Route path="/admin/export" element={<AdminRoute><ReportExport /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
