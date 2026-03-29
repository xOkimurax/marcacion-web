import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth
import Login from './components/auth/Login'

// Employee components
import EmployeeDashboard from './components/employee/EmployeeDashboard'
import EmployeeHistory from './components/employee/EmployeeHistory'

// Admin components
import AdminDashboard from './components/admin/AdminDashboard'
import EmployeeManagement from './components/admin/EmployeeManagement'
import LocationConfig from './components/admin/LocationConfig'
import ReportExport from './components/admin/ReportExport'
import FailedAttempts from './components/admin/FailedAttempts'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Redirect unauthenticated users to /login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Redirect non-admins away from admin routes
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/employee" replace />
  return children
}

// Root: redirect based on auth state and role
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/employee" replace />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Login — redirect authenticated users to their panel */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/employee'} replace />
            : <Login />
        }
      />

      {/* Employee routes — accessible by any authenticated user (EMPLOYEE or ADMIN) */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/history"
        element={
          <ProtectedRoute>
            <EmployeeHistory />
          </ProtectedRoute>
        }
      />

      {/* Admin routes — ADMIN only */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <AdminRoute>
            <EmployeeManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/location"
        element={
          <AdminRoute>
            <LocationConfig />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/failed-attempts"
        element={
          <AdminRoute>
            <FailedAttempts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <AdminRoute>
            <ReportExport />
          </AdminRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
