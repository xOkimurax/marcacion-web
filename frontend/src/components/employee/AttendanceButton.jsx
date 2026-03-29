import { useState, useEffect, useCallback } from 'react'
import { markAttendance, getMyHistory } from '../../utils/api'
import { useWebAuthn } from '../../hooks/useWebAuthn'

export default function AttendanceButton({ position, onSuccess }) {
  const [nextType, setNextType] = useState(null) // 'ENTRY' or 'EXIT'
  const [loadingType, setLoadingType] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null) // { success, message }
  const { authenticate, loading: webAuthnLoading } = useWebAuthn()

  const fetchNextType = useCallback(async () => {
    setLoadingType(true)
    try {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      const res = await getMyHistory({ limit: 1, date: dateStr })
      const records = res.data.records || res.data.attendances || res.data || []
      const lastRecord = Array.isArray(records) ? records[0] : null

      if (!lastRecord) {
        setNextType('ENTRY')
      } else {
        const lastType = lastRecord.type || lastRecord.attendance_type
        setNextType(lastType === 'ENTRY' ? 'EXIT' : 'ENTRY')
      }
    } catch {
      setNextType('ENTRY')
    } finally {
      setLoadingType(false)
    }
  }, [])

  useEffect(() => {
    fetchNextType()
  }, [fetchNextType])

  // Auto-clear result message after 5 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setResult(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [result])

  const handleMark = async () => {
    if (!position) return
    setProcessing(true)
    setResult(null)

    try {
      // WebAuthn biometric verification
      const authResult = await authenticate()
      if (!authResult.success) {
        setResult({
          success: false,
          message: authResult.cancelled
            ? 'Verificación biométrica cancelada. No se registró la marcación.'
            : 'Error en la verificación biométrica.',
        })
        setProcessing(false)
        return
      }

      // Mark attendance
      const res = await markAttendance(position.latitude, position.longitude)
      const data = res.data

      const typeLabel = nextType === 'ENTRY' ? 'Entrada' : 'Salida'
      setResult({
        success: true,
        message: `${typeLabel} registrada correctamente a las ${new Date().toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      })

      // Refresh next type after success
      await fetchNextType()
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Error al registrar la marcación. Intenta nuevamente.'
      setResult({ success: false, message: msg })
    } finally {
      setProcessing(false)
    }
  }

  const isLoading = loadingType || processing || webAuthnLoading

  if (loadingType) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Verificando estado...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {nextType === 'ENTRY' ? (
        <button
          onClick={handleMark}
          disabled={isLoading || !position}
          className="btn-success"
        >
          {processing || webAuthnLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Marcar Entrada</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleMark}
          disabled={isLoading || !position}
          className="btn-exit"
        >
          {processing || webAuthnLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Marcar Salida</span>
            </>
          )}
        </button>
      )}

      {result && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 transition-all duration-300 ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.success ? (
            <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <p className={`text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        Se requiere verificación biométrica para registrar
      </p>
    </div>
  )
}
