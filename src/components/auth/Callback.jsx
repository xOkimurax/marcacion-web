import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Callback() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    
    // InsForge puede mandar el token con distintos nombres
    const token = 
      params.get('token') ||
      params.get('access_token') ||
      params.get('insforge_token') ||
      hashParams.get('token') ||
      hashParams.get('access_token')

    // Si no hay token, mostrar todos los params para debug
    if (!token) {
      const allParams = [...params.entries()].map(([k,v]) => `${k}=${v.slice(0,20)}...`).join(', ')
      const allHash = [...hashParams.entries()].map(([k,v]) => `${k}=${v.slice(0,20)}...`).join(', ')
      setError(`Params: [${allParams || 'ninguno'}] Hash: [${allHash || 'ninguno'}]`)
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
      .catch((err) => {
        setError('Error al verificar la sesión. Intenta de nuevo.')
      })
  }, [loginWithToken, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-600 text-sm break-all">{error}</p>
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
