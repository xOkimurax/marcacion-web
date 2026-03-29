import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginWithGoogle as apiLoginWithGoogle, getMe } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: validate stored token
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')

      if (token) {
        try {
          const res = await getMe()
          const userData = res.data.user || res.data
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
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

  const login = useCallback(async (googleCredential) => {
    const res = await apiLoginWithGoogle(googleCredential)
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

  const value = {
    user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
