import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Production: same origin on Render, dev: localhost
const API_BASE = ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('crm_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/me`)
      setUser(res.data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE}/api/login`, { username, password })
    const { token: newToken, member } = res.data
    localStorage.setItem('crm_token', newToken)
    setToken(newToken)
    setUser(member)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    return member
  }

  const register = async (data) => {
    const res = await axios.post(`${API_BASE}/api/register`, data)
    const { token: newToken, member } = res.data
    localStorage.setItem('crm_token', newToken)
    setToken(newToken)
    setUser(member)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    return member
  }

  const logout = () => {
    localStorage.removeItem('crm_token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
