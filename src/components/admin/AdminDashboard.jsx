import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboard } from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Empleados', path: '/admin/employees', icon: 'users' },
  { label: 'Historial', path: '/admin/export', icon: 'history' },
  { label: 'Configuración', path: '/admin/location', icon: 'settings' },
  { label: 'Fallidos', path: '/admin/failed-attempts', icon: 'warning' },
  { label: 'Exportar', path: '/admin/export', icon: 'export' },
]

function NavIcon({ name }) {
  const icons = {
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    history: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    export: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  }
  return icons[name] || null
}

export default function AdminDashboard() {
  const { adminUser, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getDashboard()
      setDashboard(res.data)
      setLastRefresh(new Date())
      setError(null)
    } catch {
      setError('No se pudo cargar el dashboard. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  const todayAttendances = dashboard?.todayAttendances || dashboard?.today_attendances || []
  const totalEntries = dashboard?.totalEntries ?? dashboard?.total_entries ?? todayAttendances.filter(a => (a.type || a.attendance_type || '').toUpperCase() === 'ENTRY').length
  const totalExits = dashboard?.totalExits ?? dashboard?.total_exits ?? todayAttendances.filter(a => (a.type || a.attendance_type || '').toUpperCase() === 'EXIT').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Panel Administrativo</h1>
            <p className="text-xs text-gray-500">{adminUser?.username || adminUser?.name || 'Administrador'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              aria-label="Actualizar"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Hoy - {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            {lastRefresh && (
              <span className="text-xs text-gray-400">
                Actualizado {lastRefresh.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{loading ? '-' : todayAttendances.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total marcaciones</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{loading ? '-' : totalEntries}</p>
              <p className="text-xs text-gray-500 mt-1">Entradas</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-orange-500">{loading ? '-' : totalExits}</p>
              <p className="text-xs text-gray-500 mt-1">Salidas</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Gestión</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                className="card flex flex-col items-center gap-2 py-4 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <NavIcon name={item.icon} />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's attendance list */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Marcaciones de hoy</h2>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Cargando...</p>
            </div>
          ) : todayAttendances.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 py-10 text-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              <p className="text-gray-500 font-medium">Sin marcaciones hoy</p>
              <p className="text-sm text-gray-400">Las marcaciones aparecerán aquí en tiempo real.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAttendances.slice(0, 20).map((record, idx) => {
                const type = (record.type || record.attendance_type || '').toUpperCase()
                const isEntry = type === 'ENTRY'
                const employeeName = record.employee?.name || record.employee_name || record.user?.name || 'Empleado'
                const employeeEmail = record.employee?.email || record.employee_email || record.user?.email || ''

                return (
                  <div key={record.id || idx} className="card flex items-center gap-3 py-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isEntry ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {isEntry ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{employeeName}</p>
                      <p className="text-xs text-gray-500 truncate">{employeeEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={isEntry ? 'badge-entry' : 'badge-exit'}>
                        {isEntry ? 'Entrada' : 'Salida'}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(record.timestamp || record.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
