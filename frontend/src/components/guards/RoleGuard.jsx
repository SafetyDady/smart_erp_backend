import React from 'react'
import { useRole } from './RoleContext'
import { hasPermission } from '../../types/roles'

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
  const { userRole: contextRole } = useRole()
  
  // Use provided userRole or fall back to context
  const effectiveRole = userRole || contextRole

  // If no restrictions, show content
  if (allowedRoles.length === 0 && requiredPermissions.length === 0) {
    return children
  }

  // Check role-based access
  let hasRoleAccess = true
  if (allowedRoles.length > 0) {
    hasRoleAccess = allowedRoles.includes(effectiveRole)
  }

  // Check permission-based access  
  let hasPermissionAccess = true
  if (requiredPermissions.length > 0) {
    hasPermissionAccess = requiredPermissions.some(permission => 
      hasPermission(permission)
    )
  }

  // Both checks must pass
  const hasAccess = hasRoleAccess && hasPermissionAccess

  if (!hasAccess) {
    return fallback
  }

  return children
}

export default RoleGuard
