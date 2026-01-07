import { ROLES, hasPermission } from '../../types/roles.js'

/**
 * Shape transactions data based on user role - DATA SECURITY LAYER
 * Filters transactions and removes sensitive financial/personal information
 * @param {array} rawTransactions - Raw transaction data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @param {string} userId - Current user ID (for staff filtering)
 * @returns {array} - Role-filtered transaction data
 */
export const shapeTransactionsByRole = (rawTransactions, userRole, userId = null) => {
  if (!Array.isArray(rawTransactions) || !userRole) {
    return []
  }
  
  if (userRole === ROLES.OWNER) {
    // Owner sees ALL transactions with FULL details
    return rawTransactions.map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      customer: transaction.customer,
      supplier: transaction.supplier,
      amount: transaction.amount,
      status: transaction.status,
      // Owner-only sensitive fields
      profitMargin: transaction.profitMargin,
      cost: transaction.cost,
      internalNotes: transaction.internalNotes,
      assignedTo: transaction.assignedTo,
      priority: transaction.priority,
      paymentMethod: transaction.paymentMethod,
      customerCredit: transaction.customerCredit
    }))
  }
  
  if (userRole === ROLES.MANAGER) {
    // Manager sees operational transactions with LIMITED financial details
    return rawTransactions
      .filter(transaction => {
        // Exclude highly sensitive financial adjustments
        return !['financial_adjustment', 'loan', 'investment', 'tax_payment'].includes(transaction.type)
      })
      .map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: transaction.type,
        customer: transaction.customer,
        supplier: transaction.supplier,
        amount: transaction.amount,
        status: transaction.status,
        assignedTo: transaction.assignedTo,
        priority: transaction.priority,
        // Remove sensitive fields for manager
        // profitMargin: REMOVED,
        // cost: REMOVED,
        // internalNotes: REMOVED,
        // paymentMethod: REMOVED,
        // customerCredit: REMOVED
      }))
  }
  
  if (userRole === ROLES.STAFF) {
    // Staff sees ONLY assigned transactions with MINIMAL data
    return rawTransactions
      .filter(transaction => {
        // Only transactions assigned to this specific staff member
        return transaction.assignedTo === userId || 
               transaction.handlerRequired === userId ||
               (transaction.teamAssignments && transaction.teamAssignments.includes(userId))
      })
      .map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: transaction.type,
        customer: transaction.customer,
        status: transaction.status,
        priority: transaction.priority,
        assignedTo: transaction.assignedTo,
        taskDescription: transaction.taskDescription,
        dueDate: transaction.dueDate,
        // Remove ALL financial and sensitive data for staff
        // amount: REMOVED,
        // supplier: REMOVED,
        // profitMargin: REMOVED,
        // cost: REMOVED,
        // internalNotes: REMOVED,
        // paymentMethod: REMOVED,
        // customerCredit: REMOVED
      }))
  }
  
  // Default: return empty array for unknown roles
  console.warn(`Unknown role: ${userRole}`)
  return []
}

/**
 * Example of shaped output for different roles:
 * 
 * OWNER (Full Access):
 * [
 *   {
 *     id: 1, date: '2024-01-07', type: 'Sale', customer: 'ABC Corp',
 *     amount: 2500, status: 'completed', profitMargin: 0.25, cost: 1875,
 *     internalNotes: 'VIP customer, expedite delivery', paymentMethod: 'credit'
 *   }
 * ]
 * 
 * MANAGER (Operational):
 * [
 *   {
 *     id: 1, date: '2024-01-07', type: 'Sale', customer: 'ABC Corp',
 *     amount: 2500, status: 'completed', assignedTo: 'staff123', priority: 'high'
 *   }
 * ]
 * 
 * STAFF (Assigned Only):
 * [
 *   {
 *     id: 1, date: '2024-01-07', type: 'Sale', customer: 'ABC Corp',
 *     status: 'completed', priority: 'high', assignedTo: 'staff123',
 *     taskDescription: 'Process order fulfillment', dueDate: '2024-01-08'
 *   }
 * ]
 * 
 * TODO: Unit tests
 * - Test owner gets all transactions with sensitive fields
 * - Test manager gets filtered transactions without profit/cost data
 * - Test staff gets only assigned transactions with no financial data
 * - Test proper filtering by userId for staff role
 * - Test sensitive transaction types are excluded for manager/staff
 */