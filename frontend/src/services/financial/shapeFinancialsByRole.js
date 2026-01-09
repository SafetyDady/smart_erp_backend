/**
 * Shape financial data based on user role - DATA SECURITY LAYER
 * STRICTLY RESTRICTED TO OWNER ONLY
 * @param {object} rawFinancials - Raw financial data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @returns {object|null} - Financial data if authorized, null otherwise
 */
export const shapeFinancialsByRole = (rawFinancials, userRole) => {
  if (!rawFinancials || !userRole) {
    return null
  }

  // STRICT CHECK: Only Owner can view financial data
  // Simple role-based filtering
  if (!hasPermission(userRole, 'canViewFinancials')) {
    return null // Return null to indicate access denied
  }

  // If authorized (Owner), return full data
  // No need to filter fields since Owner sees everything
  return {
    summary: {
      totalRevenue: rawFinancials.summary.totalRevenue,
      totalExpenses: rawFinancials.summary.totalExpenses,
      netProfit: rawFinancials.summary.netProfit,
      profitMargin: rawFinancials.summary.profitMargin,
      cashOnHand: rawFinancials.summary.cashOnHand
    },
    monthlyPerformance: rawFinancials.monthlyPerformance, // Array for charts
    expenseBreakdown: rawFinancials.expenseBreakdown, // Array for pie chart
    recentTransactions: rawFinancials.recentTransactions // Array for table
  }
}
