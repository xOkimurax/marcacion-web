import { useState, useCallback } from 'react'

function generateRandomChallenge() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return array.buffer
}

export function useWebAuthn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'

  const authenticate = useCallback(
    async (userId) => {
      setError(null)

      // If WebAuthn is not supported, allow fallback
      if (!isSupported) {
        return { success: true, fallback: true }
      }

      setLoading(true)
      try {
        const challenge = generateRandomChallenge()

        const publicKeyCredentialRequestOptions = {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        }

        const assertion = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions,
        })

        setLoading(false)
        return { success: true, assertion, fallback: false }
      } catch (err) {
        setLoading(false)

        // User cancelled or no credential registered - allow fallback
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'NotSupportedError' ||
          err.name === 'InvalidStateError' ||
          err.name === 'AbortError'
        ) {
          // If no credentials registered or user cancelled, allow fallback
          const userCancelled = err.name === 'NotAllowedError'
          if (userCancelled) {
            setError('Verificación biométrica cancelada.')
            return { success: false, cancelled: true }
          }
          // No credentials registered - fallback allowed
          return { success: true, fallback: true }
        }

        const message = 'Error en la verificación biométrica. Intenta nuevamente.'
        setError(message)
        return { success: false, error: message }
      }
    },
    [isSupported]
  )

  return { isSupported, authenticate, loading, error }
}
