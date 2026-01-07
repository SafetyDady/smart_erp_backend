import { ROLES, hasPermission } from '../../types/roles.js'

/**
 * Shape employee data based on user role - DATA SECURITY LAYER
 * Filters sensitive HR information (Salary, Personal Details)
 * @param {array} rawEmployees - Raw employee data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @returns {array} - Role-filtered employee data
 */
export const shapeEmployeesByRole = (rawEmployees, userRole) => {
  if (!Array.isArray(rawEmployees) || !userRole) {
    return []
  }

  // Check if role has permission to access HR module
  if (!hasPermission(userRole, 'canAccessHR')) {
    return [] // Return empty array if no permission (Staff)
  }

  return rawEmployees.map(employee => {
    // Base fields available to authorized roles (Manager & Owner)
    const shapedEmployee = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      status: employee.status,
      joinDate: employee.joinDate,
      avatar: employee.avatar
    }

    // Role-specific fields
    if (userRole === ROLES.OWNER) {
      // Owner sees EVERYTHING including Salary and Performance Rating
      return {
        ...shapedEmployee,
        salary: employee.salary,
        performanceRating: employee.performanceRating,
        bankAccount: employee.bankAccount,
        notes: employee.notes
      }
    }

    if (userRole === ROLES.MANAGER) {
      // Manager sees performance but NO salary/bank info
      return {
        ...shapedEmployee,
        performanceRating: employee.performanceRating,
        notes: employee.notes
        // REMOVED: salary, bankAccount
      }
    }

    return shapedEmployee
  })
}
