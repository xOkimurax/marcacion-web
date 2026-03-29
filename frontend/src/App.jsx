import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'

// Employee components
import EmployeeLogin from './components/employee/EmployeeLogin'
import EmployeeDashboard from './components/employee/EmployeeDashboard'
import EmployeeHistory from './components/employee/EmployeeHistory'

// Admin components
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'
import EmployeeManagement from './components/admin/EmployeeManagement'
import LocationConfig from './components/admin/LocationConfig'
import ReportExport from './components/admin/ReportExport'
import FailedAttempts from './components/admin/FailedAttempts'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Protected route for employees
function ProtectedEmployeeRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/employee/login" replace />
  }

  return children
}

// Protected route for admins
function ProtectedAdminRoute({ children }) {
  const { adminUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

// Root redirect
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <Navigate to={user ? '/employee' : '/employee/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Employee routes */}
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route
        path="/employee"
        element={
          <ProtectedEmployeeRoute>
            <EmployeeDashboard />
          </ProtectedEmployeeRoute>
        }
      />
      <Route
        path="/employee/history"
        element={
          <ProtectedEmployeeRoute>
            <EmployeeHistory />
          </ProtectedEmployeeRoute>
        }
      />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedAdminRoute>
            <EmployeeManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/location"
        element={
          <ProtectedAdminRoute>
            <LocationConfig />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/failed-attempts"
        element={
          <ProtectedAdminRoute>
            <FailedAttempts />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <ProtectedAdminRoute>
            <ReportExport />
          </ProtectedAdminRoute>
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
