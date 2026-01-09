/**
 * Shape customers data based on user role - DATA SECURITY LAYER
 * Filters customer fields to protect sensitive information
 * @param {array} rawCustomers - Raw customer data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @returns {array} - Role-filtered customer data
 */
export const shapeCustomersByRole = (rawCustomers, userRole) => {
  if (!Array.isArray(rawCustomers) || !userRole) {
    return []
  }

  // Check if role has permission to view customers at all
  if (!hasPermission(userRole, 'canViewCustomers')) {
    return [] // Return empty array if no permission
  }

  return rawCustomers.map(customer => {
    // Base fields available to authorized roles
    const shapedCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
      lastOrderDate: customer.lastOrderDate,
      tags: customer.tags
    }

    // Role-specific fields
    if (userRole === 'owner') {
      // Owner sees financial metrics
      return {
        ...shapedCustomer,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        profitGenerated: customer.profitGenerated,
        creditLimit: customer.creditLimit,
        notes: customer.notes
      }
    }

    if (userRole === 'manager') {
      // Manager sees spending but NO profit/credit limit
      return {
        ...shapedCustomer,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        notes: customer.notes
        // REMOVED: profitGenerated, creditLimit
      }
    }

    return shapedCustomer
  })
}
