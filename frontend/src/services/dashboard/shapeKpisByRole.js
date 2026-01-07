import { ROLES, hasPermission } from '../../types/roles.js'

/**
 * Shape KPI data based on user role - DATA SECURITY LAYER
 * Removes sensitive financial data for non-authorized roles
 * @param {object} rawKpiData - Raw KPI data from API
 * @param {string} userRole - User role (owner/manager/staff) 
 * @returns {object} - Role-filtered KPI data
 */
export const shapeKpisByRole = (rawKpiData, userRole) => {
  if (!rawKpiData || !userRole) {
    return {}
  }
  
  const shaped = {}

  // Revenue KPI - Owner + Manager (limited for manager)
  if (hasPermission(userRole, 'canViewRevenue')) {
    if (userRole === ROLES.OWNER) {
      // Owner gets full revenue details
      shaped.revenue = {
        value: rawKpiData.revenue?.value,
        trend: rawKpiData.revenue?.trend,
        breakdown: rawKpiData.revenue?.breakdown, // Detailed breakdown
        projection: rawKpiData.revenue?.projection,
        showDetailed: true
      }
    } else {
      // Manager gets limited revenue view (no sensitive breakdowns)
      shaped.revenue = {
        value: rawKpiData.revenue?.value,
        trend: rawKpiData.revenue?.trend,
        showDetailed: false
        // Remove: breakdown, projection, profit margins
      }
    }
  }

  // Profit KPI - Owner ONLY (most sensitive financial data)
  if (hasPermission(userRole, 'canViewProfit')) {
    shaped.profit = {
      value: rawKpiData.profit?.value,
      trend: rawKpiData.profit?.trend,
      margin: rawKpiData.profit?.margin,
      ytdComparison: rawKpiData.profit?.ytdComparison
    }
  }

  // Orders KPI - All roles but different scope/detail
  if (hasPermission(userRole, 'canViewOrders')) {
    const ordersData = rawKpiData.orders

    if (userRole === ROLES.STAFF) {
      // Staff sees only assigned orders count (no financial impact)
      shaped.orders = {
        value: ordersData?.assignedCount || 0,
        trend: ordersData?.assignedTrend,
        scope: 'assigned',
        priority: ordersData?.priorityAssigned
        // Remove: totalValue, profitImpact, customerBreakdown
      }
    } else {
      // Owner/Manager see full orders data
      shaped.orders = {
        value: ordersData?.totalCount,
        trend: ordersData?.totalTrend,
        scope: 'all',
        totalValue: ordersData?.totalValue,
        overdueCount: ordersData?.overdueCount,
        urgentCount: ordersData?.urgentCount
      }
    }
  }

  // Customers KPI - Owner + Manager only
  if (hasPermission(userRole, 'canViewCustomers')) {
    shaped.customers = {
      value: rawKpiData.customers?.newCount,
      trend: rawKpiData.customers?.growthTrend,
      totalActive: rawKpiData.customers?.totalActive,
      retentionRate: rawKpiData.customers?.retentionRate
    }
  }

  return shaped
}

/**
 * Example of shaped output for different roles:
 * 
 * OWNER:
 * {
 *   revenue: { value: 125000, trend: 8.2, breakdown: {...}, showDetailed: true },
 *   profit: { value: 32000, trend: 12.5, margin: 25.6 },
 *   orders: { value: 89, trend: -2.1, scope: 'all', totalValue: 450000 },
 *   customers: { value: 24, trend: 15.3, totalActive: 1250 }
 * }
 * 
 * MANAGER:
 * {
 *   revenue: { value: 125000, trend: 8.2, showDetailed: false },
 *   orders: { value: 89, trend: -2.1, scope: 'all', totalValue: 450000 },
 *   customers: { value: 24, trend: 15.3, totalActive: 1250 }
 * }
 * 
 * STAFF:
 * {
 *   orders: { value: 12, trend: 5.0, scope: 'assigned', priority: 'high' }
 * }
 * 
 * TODO: Unit tests
 * - Test owner gets all KPIs with full details
 * - Test manager gets limited revenue (no breakdown/projection)
 * - Test staff gets only assigned orders count
 * - Test sensitive fields are properly removed
 * - Test invalid role returns empty object
 */