import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginWithGoogle as apiLoginWithGoogle, loginAdmin as apiLoginAdmin, getMe, getAdminMe } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: validate stored tokens
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      const adminToken = localStorage.getItem('adminToken')

      const promises = []

      if (token) {
        promises.push(
          getMe()
            .then((res) => {
              const userData = res.data.user || res.data
              setUser(userData)
              localStorage.setItem('user', JSON.stringify(userData))
            })
            .catch(() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setUser(null)
            })
        )
      }

      if (adminToken) {
        promises.push(
          getAdminMe()
            .then((res) => {
              const adminData = res.data.user || res.data
              setAdminUser(adminData)
              localStorage.setItem('adminUser', JSON.stringify(adminData))
            })
            .catch(() => {
              localStorage.removeItem('adminToken')
              localStorage.removeItem('adminUser')
              setAdminUser(null)
            })
        )
      }

      await Promise.allSettled(promises)
      setLoading(false)
    }

    init()
  }, [])

  const loginEmployee = useCallback(async (googleCredential) => {
    const res = await apiLoginWithGoogle(googleCredential)
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const loginAdminFn = useCallback(async (username, password) => {
    const res = await apiLoginAdmin(username, password)
    const { token, user: adminData } = res.data
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(adminData))
    setAdminUser(adminData)
    return adminData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdminUser(null)
  }, [])

  const value = {
    user,
    adminUser,
    loading,
    loginEmployee,
    loginAdmin: loginAdminFn,
    logout,
    logoutAdmin,
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
