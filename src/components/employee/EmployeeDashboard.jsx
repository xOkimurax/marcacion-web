import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getLocation } from '../../utils/api'
import { calculateDistance } from '../../utils/haversine'
import AttendanceButton from './AttendanceButton'
import Navbar from '../shared/Navbar'

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { position, error: geoError, loading: geoLoading, getPosition } = useGeolocation()
  const [workLocation, setWorkLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [successCount, setSuccessCount] = useState(0)

  // Load work location config
  useEffect(() => {
    getLocation()
      .then((res) => {
        setWorkLocation(res.data.location || res.data)
      })
      .catch(() => {
        setLocationError('No se pudo cargar la configuración de ubicación.')
      })
  }, [])

  // Get geolocation on mount
  useEffect(() => {
    getPosition()
    setLastRefresh(new Date())
  }, [])

  // Auto-refresh location every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getPosition()
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [getPosition])

  // Calculate distance when position or workLocation changes
  useEffect(() => {
    if (position && workLocation) {
      const dist = calculateDistance(
        position.latitude,
        position.longitude,
        workLocation.latitude,
        workLocation.longitude
      )
      setDistance(Math.round(dist))
    }
  }, [position, workLocation])

  const handleRefresh = useCallback(() => {
    getPosition()
    setLastRefresh(new Date())
  }, [getPosition])

  const handleLogout = () => {
    logout()
    navigate('/employee/login', { replace: true })
  }

  const isWithinRange =
    distance !== null && workLocation && distance <= (workLocation.radius || 100)

  const getFirstName = () => {
    if (!user) return 'Usuario'
    const name = user.name || user.full_name || user.email || ''
    return name.split(' ')[0]
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      aria-label="Cerrar sesión"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Sistema de Marcación" actions={logoutButton} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* User greeting */}
        <div className="card flex items-center gap-4">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">
                {getFirstName()[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500">Bienvenido,</p>
            <p className="font-semibold text-gray-900 truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Location status card */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Tu ubicación</h2>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-xs text-gray-400">
                  Actualizado {formatTime(lastRefresh)}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={geoLoading}
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                aria-label="Actualizar ubicación"
              >
                <svg
                  className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {geoLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Obteniendo ubicación...</span>
            </div>
          )}

          {geoError && !geoLoading && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{geoError}</p>
            </div>
          )}

          {locationError && (
            <div className="p-3 bg-yellow-50 rounded-xl">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          )}

          {position && !geoLoading && (
            <div className="space-y-2">
              {distance !== null && workLocation ? (
                isWithinRange ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">Dentro del rango</p>
                      <p className="text-xs text-green-600">
                        A {distance} m de {workLocation.name || 'la oficina'} (radio: {workLocation.radius || 100} m)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Fuera del rango</p>
                      <p className="text-xs text-red-600">
                        A {distance} m de distancia (radio: {workLocation.radius || 100} m)
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-sm text-blue-700">
                    Ubicación obtenida ({position.accuracy?.toFixed(0) || '?'} m de precisión)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendance action card */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Registrar asistencia</h2>
          {!position && !geoLoading && (
            <button onClick={handleRefresh} className="btn-secondary mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Obtener ubicación
            </button>
          )}
          {position && (!workLocation || isWithinRange) && (
            <AttendanceButton
              position={position}
              onSuccess={() => setSuccessCount((c) => c + 1)}
            />
          )}
          {position && workLocation && !isWithinRange && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Debes estar dentro del rango permitido para registrar tu asistencia.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <button
          onClick={() => navigate('/employee/history')}
          className="btn-secondary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ver mi historial de asistencia
        </button>
      </div>
    </div>
  )
}
