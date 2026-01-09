import React from 'react'
import { useAuth } from './AuthContext'

/**
 * RoleGuard - Component-level access control
 * Controls visibility of UI components based on user role
 * NOTE: This is UI-only protection - data filtering happens in services
 */
const RoleGuard = ({ 
  allowedRoles = [], 
  requiredPermissions = [],
  userRole = null,  // Optional override
  children, 
  fallback = null 
}) => {
  const { user } = useAuth()
  
  // Use provided userRole or fall back to auth context
  const effectiveRole = userRole || user?.role || 'staff'

  // If no restrictions, show content
  if (allowedRoles.length === 0 && requiredPermissions.length === 0) {
    return children
  }

  // Check role-based access
  let hasRoleAccess = true
  if (allowedRoles.length > 0) {
    hasRoleAccess = allowedRoles.includes(effectiveRole)
  }

  // Simple role-based access
  const hasAccess = hasRoleAccess

  if (!hasAccess) {
    return fallback
  }

  return children
}

export default RoleGuard
