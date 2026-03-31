import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getOAuthUrl, verifyToken, getMe } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await getMe()
          setUser(res.data.user || res.data)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  // Redirige al usuario a InsForge OAuth
  const startOAuth = useCallback(async () => {
    const res = await getOAuthUrl()
    window.location.href = res.data.authUrl || res.data.url
  }, [])

  // Llamado desde /auth/callback con el token de InsForge
  const loginWithToken = useCallback(async (insforgeToken) => {
    const res = await verifyToken(insforgeToken)
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, startOAuth, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
