import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en este dispositivo.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        let message = 'No se pudo obtener la ubicación.'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación.'
            break
          case err.POSITION_UNAVAILABLE:
            message = 'La información de ubicación no está disponible en este momento.'
            break
          case err.TIMEOUT:
            message = 'La solicitud de ubicación ha expirado. Intenta nuevamente.'
            break
          default:
            message = 'Ocurrió un error desconocido al obtener la ubicación.'
        }
        setError(message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  return { position, error, loading, getPosition }
}
