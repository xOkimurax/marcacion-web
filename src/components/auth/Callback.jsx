import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { exchangeCode } from '../../utils/api'

export default function Callback() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // InsForge redirige con ?code=... o directamente con ?token=...
    const code = params.get('insforge_code') || params.get('code')
    const token = params.get('token') || params.get('access_token')
    const state = params.get('state')

    const handleLogin = async (insforgeToken) => {
      const userData = await loginWithToken(insforgeToken)
      if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/employee', { replace: true })
      }
    }

    if (token) {
      // InsForge mandó el token directo
      handleLogin(token).catch(() => setError('Error al verificar la sesión.'))
    } else if (code) {
      // InsForge mandó un code — intercambiarlo en el backend
      exchangeCode(code, state)
        .then(res => handleLogin(res.data.token))
        .catch(() => setError('Error al intercambiar el código de autenticación.'))
    } else {
      // Debug: mostrar todos los params
      const allParams = [...params.entries()].map(([k,v]) => `${k}=${v.slice(0,30)}`).join(' | ')
      setError(`Sin token ni code. Params: [${allParams || 'ninguno'}]`)
    }
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
