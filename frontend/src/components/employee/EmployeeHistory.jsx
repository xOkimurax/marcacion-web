import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyHistory } from '../../utils/api'
import Navbar from '../shared/Navbar'

const PAGE_SIZE = 20

export default function EmployeeHistory() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchHistory = useCallback(
    async (pageNum, filters) => {
      setLoading(true)
      setError(null)
      try {
        const params = { page: pageNum, limit: PAGE_SIZE }
        if (filters.startDate) params.startDate = filters.startDate
        if (filters.endDate) params.endDate = filters.endDate

        const res = await getMyHistory(params)
        const data = res.data
        const fetchedRecords = data.records || data.attendances || data || []
        setRecords(Array.isArray(fetchedRecords) ? fetchedRecords : [])
        setTotal(data.total || fetchedRecords.length || 0)
        setTotalPages(data.totalPages || Math.ceil((data.total || fetchedRecords.length) / PAGE_SIZE) || 1)
      } catch {
        setError('No se pudo cargar el historial. Intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchHistory(page, { startDate, endDate })
  }, [page])

  const handleFilter = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHistory(1, { startDate, endDate })
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    setPage(1)
    fetchHistory(1, { startDate: '', endDate: '' })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeLabel = (type) => {
    const t = (type || '').toUpperCase()
    return t === 'ENTRY' ? 'Entrada' : t === 'EXIT' ? 'Salida' : type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Mi Historial" backTo="/employee" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Filter form */}
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
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-2 text-sm">
                Filtrar
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="btn-secondary py-2 text-sm"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Total */}
        {!loading && (
          <p className="text-sm text-gray-500 px-1">
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando historial...</p>
          </div>
        )}

        {/* Records */}
        {!loading && records.length === 0 && !error && (
          <div className="card flex flex-col items-center gap-3 py-12 text-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">Sin registros</p>
            <p className="text-sm text-gray-400">No hay registros de asistencia para el período seleccionado.</p>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="space-y-2">
            {records.map((record, idx) => {
              const type = (record.type || record.attendance_type || '').toUpperCase()
              const isEntry = type === 'ENTRY'
              const isValid = record.valid !== false && record.is_valid !== false

              return (
                <div key={record.id || idx} className="card flex items-center gap-3 py-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isEntry ? 'bg-green-100' : 'bg-orange-100'
                    }`}
                  >
                    {isEntry ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={isEntry ? 'badge-entry' : 'badge-exit'}>
                        {getTypeLabel(type)}
                      </span>
                      <span className={isValid ? 'badge-valid' : 'badge-invalid'}>
                        {isValid ? 'Válida' : 'Inválida'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(record.timestamp || record.created_at || record.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(record.timestamp || record.created_at || record.date)}
                    </p>
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
