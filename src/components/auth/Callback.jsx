import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { exchangeCode } from '../../utils/api'

export default function Callback() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [debug, setDebug] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('insforge_code') || params.get('code')
    const state = params.get('state')
    const token = params.get('token') || params.get('access_token')

    // Guardar debug info
    const allParams = [...params.entries()].map(([k,v]) => `${k}: ${v.slice(0,40)}`).join('\n')
    setDebug(allParams)

    const handleLogin = async (insforgeToken) => {
      const userData = await loginWithToken(insforgeToken)
      if (userData.role === 'ADMIN') navigate('/admin', { replace: true })
      else navigate('/employee', { replace: true })
    }

    if (token) {
      handleLogin(token).catch((e) => setError('Error login: ' + e?.response?.data?.error))
    } else if (code) {
      exchangeCode(code, state)
        .then(res => handleLogin(res.data.token))
        .catch((e) => {
          const detail = e?.response?.data?.detail?.message || e?.response?.data?.error || e.message
          setError('Exchange error: ' + detail)
        })
    } else {
      setError('Sin token ni code')
    }
  }, [loginWithToken, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-red-600 text-sm font-mono">{error}</p>
          {debug && <pre className="text-xs text-gray-500 text-left bg-gray-100 p-2 rounded">{debug}</pre>}
          <a href="/" className="text-blue-600 underline text-sm block">Volver al inicio</a>
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
