/**
 * Role Service - Single source of truth for user roles
 * Handles role state management and environment overrides
 */

import { ROLES } from '../types/roles.js'

/**
 * Get current user role with environment override support
 * Priority: ENV override -> Auth context -> Default (staff)
 */
export const getCurrentRole = () => {
  // Development override takes priority
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_ROLE_OVERRIDE) {
    const devRole = import.meta.env.VITE_DEV_ROLE_OVERRIDE.toLowerCase()
    if (Object.values(ROLES).includes(devRole)) {
      return devRole
    }
  }
  
  // TODO: In production, get from authentication context
  // const authContext = useAuthContext()
  // return authContext?.user?.role
  
  // Safe default
  return ROLES.STAFF
}

/**
 * Validate role value
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role)
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.OWNER]: 'Business Owner',
    [ROLES.MANAGER]: 'Manager', 
    [ROLES.STAFF]: 'Staff Member'
  }
  return roleNames[role] || 'Unknown Role'
}