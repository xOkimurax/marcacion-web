import { useState, useEffect, useCallback } from 'react'
import { getEmployees, createEmployee, updateEmployee } from '../../utils/api'
import Navbar from '../shared/Navbar'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '' })
  const [togglingId, setTogglingId] = useState(null)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getEmployees()
      const data = res.data.employees || res.data || []
      setEmployees(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudo cargar la lista de empleados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleToggleActive = async (employee) => {
    const id = employee.id || employee._id
    setTogglingId(id)
    try {
      const currentActive = employee.active !== false && employee.is_active !== false
      await updateEmployee(id, { active: !currentActive })
      setEmployees((prev) =>
        prev.map((emp) =>
          (emp.id || emp._id) === id
            ? { ...emp, active: !currentActive, is_active: !currentActive }
            : emp
        )
      )
    } catch {
      setError('No se pudo actualizar el estado del empleado.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) {
      setAddError('Nombre y correo son requeridos.')
      return
    }
    setAddLoading(true)
    setAddError(null)
    try {
      const res = await createEmployee(newEmployee)
      const created = res.data.employee || res.data
      setEmployees((prev) => [created, ...prev])
      setNewEmployee({ name: '', email: '' })
      setShowAddForm(false)
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Error al crear el empleado.'
      setAddError(msg)
    } finally {
      setAddLoading(false)
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase()
    return (
      !q ||
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Empleados" backTo="/admin" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Success message */}
        {addSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-700 font-medium">Empleado creado exitosamente.</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="input-field pl-9"
          />
        </div>

        {/* Add employee button */}
        <button
          onClick={() => {
            setShowAddForm((v) => !v)
            setAddError(null)
          }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Cancelar' : 'Agregar empleado'}
        </button>

        {/* Add form */}
        {showAddForm && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Nuevo empleado</h2>
            {addError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-700">{addError}</p>
              </div>
            )}
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Juan Pérez"
                  className="input-field"
                  disabled={addLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))}
                  placeholder="juan.perez@empresa.com"
                  className="input-field"
                  disabled={addLoading}
                />
              </div>
              <button type="submit" disabled={addLoading} className="btn-primary py-2.5 text-sm">
                {addLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar empleado'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Count */}
        {!loading && (
          <p className="text-sm text-gray-500 px-1">
            {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? 's' : ''}
            {search ? ' encontrado' + (filteredEmployees.length !== 1 ? 's' : '') : ''}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando empleados...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredEmployees.length === 0 && !error && (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <p className="text-gray-500 font-medium">Sin empleados</p>
            <p className="text-sm text-gray-400">
              {search ? 'No hay resultados para tu búsqueda.' : 'Aún no hay empleados registrados.'}
            </p>
          </div>
        )}

        {/* Employee list */}
        {!loading && filteredEmployees.length > 0 && (
          <div className="space-y-2">
            {filteredEmployees.map((emp) => {
              const id = emp.id || emp._id
              const isActive = emp.active !== false && emp.is_active !== false
              const isToggling = togglingId === id

              return (
                <div key={id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">
                      {(emp.name || emp.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{emp.name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(emp)}
                      disabled={isToggling}
                      className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-label={isActive ? 'Desactivar' : 'Activar'}
                    >
                      {isToggling ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
