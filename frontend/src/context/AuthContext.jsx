import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /* hydrate on mount — HttpOnly cookie is auto-sent; try fetching profile */
  useEffect(() => {
    authService
      .getProfile()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    setUser(res.data.user)
  }, [])

  const signup = useCallback(async (userData) => {
    const res = await authService.register(userData)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      /* server-side cookie clear happens regardless */
    }
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
