import React from 'react'
import { getCurrentRole, isValidRole } from '../../services/roleService'

/**
 * Role Context - Provides centralized role state management
 */
const RoleContext = React.createContext({
  userRole: 'staff',
  setUserRole: () => {},
  isLoading: false
})

/**
 * Role Provider - Wraps app to provide role state
 */
export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = React.useState(() => getCurrentRole())
  const [isLoading, setIsLoading] = React.useState(false)

  // Handle role changes with validation
  const handleSetUserRole = React.useCallback((newRole) => {
    if (isValidRole(newRole)) {
      setUserRole(newRole)
    } else {
      console.warn(`Invalid role: ${newRole}`)
    }
  }, [])

  const contextValue = React.useMemo(() => ({
    userRole,
    setUserRole: handleSetUserRole,
    isLoading
  }), [userRole, handleSetUserRole, isLoading])

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  )
}

/**
 * Hook to access role context
 */
export const useRole = () => {
  const context = React.useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

export default RoleContext