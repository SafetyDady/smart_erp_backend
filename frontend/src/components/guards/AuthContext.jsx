import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiConfig } from '../../config/api'

/**
 * AuthContext - Provides centralized authentication state management
 * Handles user login, logout, and token management
 */
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  setToken: () => {}
})

/**
 * AuthProvider - Wraps app to provide authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user info when token changes
  useEffect(() => {
    if (token) {
      fetchUserInfo(token)
    }
  }, [token])

  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      const newToken = data.access_token

      // Store token and update state
      localStorage.setItem('token', newToken)
      setToken(newToken)

      return data
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const contextValue = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    setToken: (newToken) => {
      if (newToken) {
        localStorage.setItem('token', newToken)
        setToken(newToken)
      } else {
        logout()
      }
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
