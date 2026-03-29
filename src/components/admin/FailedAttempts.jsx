import { useState, useEffect, useCallback } from 'react'
import { getFailedAttempts } from '../../utils/api'
import Navbar from '../shared/Navbar'

const PAGE_SIZE = 20

export default function FailedAttempts() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const fetchAttempts = useCallback(
    async (pageNum, filters) => {
      setLoading(true)
      setError(null)
      try {
        const params = { page: pageNum, limit: PAGE_SIZE }
        if (filters.startDate) params.startDate = filters.startDate
        if (filters.endDate) params.endDate = filters.endDate
        const res = await getFailedAttempts(params)
        const data = res.data
        const fetched = data.attempts || data.failedAttempts || data.records || data || []
        setAttempts(Array.isArray(fetched) ? fetched : [])
        setTotal(data.total || fetched.length || 0)
        setTotalPages(data.totalPages || Math.ceil((data.total || fetched.length) / PAGE_SIZE) || 1)
      } catch {
        setError('No se pudo cargar los intentos fallidos.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchAttempts(page, { startDate, endDate })
  }, [page])

  const handleFilter = (e) => {
    e.preventDefault()
    setPage(1)
    fetchAttempts(1, { startDate, endDate })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDistanceBadgeClass = (distance) => {
    if (!distance && distance !== 0) return 'bg-gray-100 text-gray-600'
    if (distance > 500) return 'bg-red-100 text-red-700'
    if (distance > 200) return 'bg-orange-100 text-orange-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const getReasonLabel = (reason) => {
    const r = (reason || '').toLowerCase()
    if (r.includes('distance') || r.includes('distancia') || r.includes('range')) return 'Fuera de rango'
    if (r.includes('auth') || r.includes('token')) return 'Sin autorización'
    if (r.includes('biometric') || r.includes('webauthn') || r.includes('finger')) return 'Fallo biométrico'
    if (r.includes('location') || r.includes('gps') || r.includes('geo')) return 'Error de ubicación'
    return reason || 'Desconocido'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Intentos Fallidos" backTo="/admin" />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Filter */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Filtrar por fecha</h2>
          <form onSubmit={handleFilter} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-sm py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field text-sm py-2"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary py-2.5 text-sm">
              Filtrar
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && (
          <p className="text-sm text-gray-500 px-1">
            {total} intento{total !== 1 ? 's' : ''} fallido{total !== 1 ? 's' : ''}
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando intentos fallidos...</p>
          </div>
        )}

        {!loading && attempts.length === 0 && !error && (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 font-medium">Sin intentos fallidos</p>
            <p className="text-sm text-gray-400">No hay intentos fallidos para el período seleccionado.</p>
          </div>
        )}

        {!loading && attempts.length > 0 && (
          <div className="space-y-3">
            {attempts.map((attempt, idx) => {
              const employeeName =
                attempt.employee?.name ||
                attempt.employee_name ||
                attempt.user?.name ||
                attempt.email ||
                'Desconocido'
              const employeeEmail =
                attempt.employee?.email ||
                attempt.employee_email ||
                attempt.user?.email ||
                attempt.email ||
                ''
              const lat = attempt.latitude || attempt.lat
              const lon = attempt.longitude || attempt.lon || attempt.lng
              const distance = attempt.distance
              const reason = attempt.reason || attempt.error || attempt.failure_reason

              return (
                <div key={attempt.id || idx} className="card border-l-4 border-red-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900 truncate">{employeeName}</p>
                      </div>
                      {employeeEmail && (
                        <p className="text-xs text-gray-500 mb-2 truncate">{employeeEmail}</p>
                      )}

                      <p className="text-xs text-gray-600 mb-2">
                        {formatDateTime(attempt.timestamp || attempt.created_at || attempt.date)}
                      </p>

                      {/* Reason */}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 rounded-lg mb-2">
                        <span className="text-xs text-red-700 font-medium">{getReasonLabel(reason)}</span>
                      </div>

                      {/* Location */}
                      {lat !== undefined && lon !== undefined && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {parseFloat(lat).toFixed(6)}, {parseFloat(lon).toFixed(6)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Ver en Maps
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Distance badge */}
                    {(distance !== null && distance !== undefined) && (
                      <div className={`shrink-0 px-2.5 py-1.5 rounded-xl text-center ${getDistanceBadgeClass(distance)}`}>
                        <p className="text-sm font-bold">{Math.round(distance)}</p>
                        <p className="text-xs">metros</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary py-2 px-4 text-sm w-auto disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary py-2 px-4 text-sm w-auto disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
