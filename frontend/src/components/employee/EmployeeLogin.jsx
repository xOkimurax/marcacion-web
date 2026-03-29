import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'

export default function EmployeeLogin() {
  const { loginEmployee } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError(null)
    try {
      await loginEmployee(credentialResponse.credential)
      navigate('/employee', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Error al iniciar sesión. Verifica que tu cuenta esté autorizada.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('No se pudo completar el inicio de sesión con Google. Intenta nuevamente.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center px-4 safe-top safe-bottom">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / App name */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-3xl mb-5 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sistema de</h1>
          <h1 className="text-3xl font-bold text-white tracking-tight">Marcación</h1>
          <p className="mt-2 text-blue-100 text-sm">Control de asistencia inteligente</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-6">
            Inicia sesión con tu cuenta corporativa de Google
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Verificando credenciales...</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                shape="rectangular"
                width="280"
                text="signin_with"
                locale="es"
              />
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">
            Solo cuentas corporativas autorizadas
          </p>
        </div>

        {/* Admin link */}
        <div className="mt-6 text-center">
          <a
            href="/admin/login"
            className="text-blue-200 text-sm hover:text-white transition-colors underline underline-offset-2"
          >
            Acceso administrador
          </a>
        </div>
      </div>
    </div>
  )
}
