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
      console.log('Fetching user info with token:', authToken ? 'present' : 'missing')
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('User data received:', userData)
        setUser(userData)
        return userData
      } else {
        console.log('Auth failed, response status:', response.status)
        const errorText = await response.text()
        console.log('Error response:', errorText)
        // Token invalid, clear it
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        return null
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      // Clear invalid token on error
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      console.log('Attempting login for:', email)
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        console.log('Login failed, response status:', response.status)
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      const newToken = data.access_token
      console.log('Login successful, token received')

      // Store token and update state
      localStorage.setItem('token', newToken)
      setToken(newToken)

      // Set mock user data instead of fetching from API
      const mockUser = {
        id: 'demo-user',
        email: email,
        full_name: 'Demo User',
        role: 'owner'
      }
      setUser(mockUser)
      console.log('Mock user data set:', mockUser)

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('Logging out user')
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    // Force page reload to ensure clean state
    window.location.href = '/'
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
