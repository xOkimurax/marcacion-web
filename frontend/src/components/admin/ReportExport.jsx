import { useState, useEffect, useCallback } from 'react'
import { getEmployees, getFullHistory, exportReport } from '../../utils/api'
import Navbar from '../shared/Navbar'

const PAGE_SIZE = 20

export default function ReportExport() {
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [exportError, setExportError] = useState(null)

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedEmployee, setSelectedEmployee] = useState('')

  useEffect(() => {
    getEmployees()
      .then((res) => {
        const data = res.data.employees || res.data || []
        setEmployees(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  const fetchRecords = useCallback(
    async (pageNum) => {
      setLoading(true)
      setError(null)
      try {
        const params = { page: pageNum, limit: PAGE_SIZE, startDate, endDate }
        if (selectedEmployee) params.employeeId = selectedEmployee
        const res = await getFullHistory(params)
        const data = res.data
        const fetched = data.records || data.attendances || data || []
        setRecords(Array.isArray(fetched) ? fetched : [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || Math.ceil((data.total || fetched.length) / PAGE_SIZE) || 1)
      } catch {
        setError('No se pudo cargar el historial.')
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, selectedEmployee]
  )

  useEffect(() => {
    fetchRecords(page)
  }, [page])

  const handleFilter = (e) => {
    e.preventDefault()
    setPage(1)
    fetchRecords(1)
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const params = { startDate, endDate }
      if (selectedEmployee) params.employeeId = selectedEmployee
      const res = await exportReport(params)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_asistencia_${startDate}_${endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setExportError('No se pudo exportar el reporte. Intenta nuevamente.')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeLabel = (type) => {
    const t = (type || '').toUpperCase()
    return t === 'ENTRY' ? 'Entrada' : t === 'EXIT' ? 'Salida' : type || '-'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Exportar Reportes" backTo="/admin" />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Filter form */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Filtros</h2>
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empleado (opcional)</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">Todos los empleados</option>
                {employees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name || emp.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-2.5 text-sm">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || loading}
                className="btn-secondary py-2.5 text-sm"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {exportError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{exportError}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Total */}
        {!loading && (
          <p className="text-sm text-gray-500 px-1">
            {total} registro{total !== 1 ? 's' : ''} en total
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando registros...</p>
          </div>
        )}

        {/* Preview table - desktop */}
        {!loading && records.length > 0 && (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {records.map((record, idx) => {
                const type = (record.type || record.attendance_type || '').toUpperCase()
                const isEntry = type === 'ENTRY'
                const employeeName = record.employee?.name || record.employee_name || record.user?.name || '-'

                return (
                  <div key={record.id || idx} className="card flex items-center gap-3 py-3">
                    <div className={`w-2 self-stretch rounded-full shrink-0 ${isEntry ? 'bg-green-400' : 'bg-orange-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(record.timestamp || record.created_at)} - {formatTime(record.timestamp || record.created_at)}
                      </p>
                      <span className={isEntry ? 'badge-entry' : 'badge-exit'}>
                        {getTypeLabel(type)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Válido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record, idx) => {
                      const type = (record.type || record.attendance_type || '').toUpperCase()
                      const isEntry = type === 'ENTRY'
                      const isValid = record.valid !== false && record.is_valid !== false
                      const employeeName = record.employee?.name || record.employee_name || record.user?.name || '-'
                      const ts = record.timestamp || record.created_at

                      return (
                        <tr key={record.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{employeeName}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(ts)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatTime(ts)}</td>
                          <td className="px-4 py-3">
                            <span className={isEntry ? 'badge-entry' : 'badge-exit'}>
                              {getTypeLabel(type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={isValid ? 'badge-valid' : 'badge-invalid'}>
                              {isValid ? 'Sí' : 'No'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && records.length === 0 && !error && (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">Sin registros</p>
            <p className="text-sm text-gray-400">No hay registros para el período seleccionado.</p>
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
