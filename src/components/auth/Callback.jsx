import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Callback() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || params.get('access_token')

    if (!token) {
      setError('No se recibió token de autenticación.')
      return
    }

    loginWithToken(token)
      .then((userData) => {
        if (userData.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/employee')
        }
      })
      .catch(() => {
        setError('Error al verificar la sesión. Intenta de nuevo.')
      })
  }, [loginWithToken, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <a href="/" className="text-blue-600 underline text-sm">Volver al inicio</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  )
}
