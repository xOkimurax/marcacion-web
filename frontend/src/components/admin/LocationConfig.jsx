import { useState, useEffect } from 'react'
import { getLocation, updateLocation } from '../../utils/api'
import { calculateDistance } from '../../utils/haversine'
import Navbar from '../shared/Navbar'

export default function LocationConfig() {
  const [config, setConfig] = useState({ name: '', latitude: '', longitude: '', radius: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [currentConfig, setCurrentConfig] = useState(null)

  useEffect(() => {
    getLocation()
      .then((res) => {
        const loc = res.data.location || res.data
        if (loc) {
          const formatted = {
            name: loc.name || '',
            latitude: loc.latitude?.toString() || '',
            longitude: loc.longitude?.toString() || '',
            radius: loc.radius?.toString() || '',
          }
          setConfig(formatted)
          setCurrentConfig(loc)
        }
      })
      .catch(() => {
        setError('No se pudo cargar la configuración de ubicación.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field) => (e) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const lat = parseFloat(config.latitude)
    const lon = parseFloat(config.longitude)
    const radius = parseInt(config.radius, 10)

    if (!config.name.trim()) {
      setError('El nombre de la ubicación es requerido.')
      return
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('La latitud debe ser un número válido entre -90 y 90.')
      return
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('La longitud debe ser un número válido entre -180 y 180.')
      return
    }
    if (isNaN(radius) || radius < 1) {
      setError('El radio debe ser un número positivo en metros.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await updateLocation({ name: config.name.trim(), latitude: lat, longitude: lon, radius })
      const updated = res.data.location || res.data
      setCurrentConfig(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Error al guardar la configuración.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Preview: calculate distance from center + radius endpoint
  const previewDistance = () => {
    const lat = parseFloat(config.latitude)
    const lon = parseFloat(config.longitude)
    const radius = parseInt(config.radius, 10)
    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) return null
    // Compute approx lat offset for radius
    const offsetLat = lat + (radius / 111320)
    const dist = calculateDistance(lat, lon, offsetLat, lon)
    return Math.round(dist)
  }

  const preview = previewDistance()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Configuración de Ubicación" backTo="/admin" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700 font-medium">Configuración guardada exitosamente.</p>
          </div>
        )}

        {/* Current config info */}
        {currentConfig && (
          <div className="card bg-blue-50 border-blue-100">
            <h2 className="font-semibold text-blue-900 text-sm mb-2">Configuración actual</h2>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">Nombre:</span> {currentConfig.name || '-'}</p>
              <p><span className="font-medium">Latitud:</span> {currentConfig.latitude}</p>
              <p><span className="font-medium">Longitud:</span> {currentConfig.longitude}</p>
              <p><span className="font-medium">Radio:</span> {currentConfig.radius} metros</p>
            </div>
            <a
              href={`https://www.google.com/maps?q=${currentConfig.latitude},${currentConfig.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver en Google Maps
            </a>
          </div>
        )}

        {/* Tip */}
        <div className="card border-amber-100 bg-amber-50">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Consejo</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Para obtener las coordenadas desde Google Maps, haz clic derecho en la ubicación deseada y selecciona "¿Qué hay aquí?". Las coordenadas aparecerán en formato latitud, longitud.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Actualizar configuración</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nombre de la ubicación
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={handleChange('name')}
                  placeholder="Ej: Oficina Central"
                  className="input-field"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={config.latitude}
                    onChange={handleChange('latitude')}
                    placeholder="-33.4489"
                    className="input-field"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={config.longitude}
                    onChange={handleChange('longitude')}
                    placeholder="-70.6693"
                    className="input-field"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Radio permitido (metros)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.radius}
                  onChange={handleChange('radius')}
                  placeholder="100"
                  className="input-field"
                  disabled={saving}
                />
                {preview !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vista previa: radio de aproximadamente {preview} metros calculado con Haversine.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar configuración
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
