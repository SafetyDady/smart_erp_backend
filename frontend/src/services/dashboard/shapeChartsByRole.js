import { ROLES, hasPermission } from '../../types/roles.js'

/**
 * Shape charts data based on user role - DATA SECURITY LAYER
 * Filters chart data and removes sensitive financial information
 * @param {object} rawChartsData - Raw charts data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @returns {object} - Role-filtered charts data
 */
export const shapeChartsByRole = (rawChartsData, userRole) => {
  if (!rawChartsData || !userRole) {
    return {}
  }
  
  const shaped = {}

  // Sales Revenue Chart - Owner + Manager only
  if (hasPermission(userRole, 'canViewSalesChart')) {
    const salesData = rawChartsData.salesRevenue
    
    if (userRole === ROLES.OWNER) {
      // Owner gets full resolution and all metrics
      shaped.salesRevenue = {
        data: salesData?.data,
        resolution: 'daily',
        showProfitMargin: true,
        showProjections: true,
        metadata: salesData?.metadata
      }
    } else if (userRole === ROLES.MANAGER) {
      // Manager gets aggregated view, no profit margins
      shaped.salesRevenue = {
        data: salesData?.data?.map(item => ({
          date: item.date,
          revenue: item.revenue
          // Remove: profitMargin, cost, projection
        })),
        resolution: 'weekly',
        showProfitMargin: false,
        showProjections: false
      }
    }
  }

  // Inventory Chart - All roles but different data granularity
  if (hasPermission(userRole, 'canViewInventoryChart')) {
    const inventoryData = rawChartsData.inventory
    
    if (userRole === ROLES.STAFF) {
      // Staff sees only operational status, no financial values
      shaped.inventory = {
        data: inventoryData?.data?.map(item => ({
          category: item.category,
          status: item.status,        // available, low, out
          count: item.count,
          priority: item.priority     // for restocking
          // Remove: value, cost, profit, supplier info
        })),
        viewType: 'status',
        showFinancials: false
      }
    } else {
      // Owner/Manager see full inventory data including values
      shaped.inventory = {
        data: inventoryData?.data?.map(item => {
          const baseData = {
            category: item.category,
            status: item.status,
            count: item.count,
            value: item.value,
            lowStockAlert: item.lowStockAlert
          }
          
          // Owner gets additional cost/profit data
          if (userRole === ROLES.OWNER) {
            return {
              ...baseData,
              cost: item.cost,
              profit: item.profit,
              supplier: item.supplier,
              turnoverRate: item.turnoverRate
            }
          }
          
          return baseData
        }),
        viewType: 'full',
        showFinancials: true
      }
    }
  }

  return shaped
}

/**
 * Example of shaped output for different roles:
 * 
 * OWNER (Full Access):
 * {
 *   salesRevenue: {
 *     data: [{ date: '2024-01', revenue: 45000, profitMargin: 0.25, cost: 33750 }],
 *     resolution: 'daily',
 *     showProfitMargin: true,
 *     showProjections: true
 *   },
 *   inventory: {
 *     data: [{ category: 'Electronics', count: 150, value: 75000, cost: 45000, profit: 30000 }],
 *     viewType: 'full',
 *     showFinancials: true
 *   }
 * }
 * 
 * MANAGER (Limited Financial):
 * {
 *   salesRevenue: {
 *     data: [{ date: '2024-01', revenue: 45000 }],
 *     resolution: 'weekly',
 *     showProfitMargin: false
 *   },
 *   inventory: {
 *     data: [{ category: 'Electronics', count: 150, value: 75000, status: 'normal' }],
 *     viewType: 'full',
 *     showFinancials: true
 *   }
 * }
 * 
 * STAFF (Status Only):
 * {
 *   inventory: {
 *     data: [{ category: 'Electronics', count: 150, status: 'normal', priority: 'low' }],
 *     viewType: 'status',
 *     showFinancials: false
 *   }
 * }
 * 
 * TODO: Unit tests
 * - Test owner gets all charts with full financial data
 * - Test manager gets charts without profit margins/costs
 * - Test staff gets inventory status only (no sales chart)
 * - Test proper field sanitization for each role
 */