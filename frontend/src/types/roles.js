/**
 * Role definitions and permissions for Smart ERP
 * This file defines the role-based access control system
 */

// Role constants - used throughout the application
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager', 
  STAFF: 'staff'
}

// Role display names for UI
export const ROLE_NAMES = {
  [ROLES.OWNER]: 'Owner/Executive',
  [ROLES.MANAGER]: 'Operations/Manager',
  [ROLES.STAFF]: 'Staff/Daily Work'
}

// Role permissions matrix - defines what each role can access
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: {
    // KPI Access
    canViewRevenue: true,
    canViewProfit: true,
    canViewOrders: true,
    canViewCustomers: true,
    // Chart Access
    canViewSalesChart: true,
    canViewInventoryChart: true,
    // Transaction Access
    canViewAllTransactions: true,
    canViewFinancialDetails: true,
    // Module Access
    canAccessAccounting: true,
    canAccessHR: true,
    canAccessSettings: true
  },
  [ROLES.MANAGER]: {
    // KPI Access - Limited financial context
    canViewRevenue: true,        // Limited view (no detailed breakdown)
    canViewProfit: false,        // No profit visibility
    canViewOrders: true,
    canViewCustomers: true,
    // Chart Access
    canViewSalesChart: true,
    canViewInventoryChart: true,
    // Transaction Access
    canViewAllTransactions: false,  // Only operational transactions
    canViewFinancialDetails: false,
    // Module Access
    canAccessAccounting: false,
    canAccessHR: true,              // Staff management
    canAccessSettings: true         // Operational settings only
  },
  [ROLES.STAFF]: {
    // KPI Access - Minimal, task-focused only
    canViewRevenue: false,
    canViewProfit: false,
    canViewOrders: true,            // Only assigned orders
    canViewCustomers: false,
    // Chart Access - Operational only
    canViewSalesChart: false,
    canViewInventoryChart: true,    // Status only, no financial data
    // Transaction Access
    canViewAllTransactions: false,  // Only assigned transactions
    canViewFinancialDetails: false,
    // Module Access
    canAccessAccounting: false,
    canAccessHR: false,
    canAccessSettings: false        // No settings access
  }
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] || false
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object} - Permission object
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || {}
}

/**
 * Check if role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid role
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role)
}