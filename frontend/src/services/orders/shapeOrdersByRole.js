/**
 * Shape orders data based on user role - DATA SECURITY LAYER
 * Filters order fields and rows to protect sensitive financial information
 * @param {array} rawOrders - Raw order data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @param {string} userId - Current user ID (for staff filtering)
 * @returns {array} - Role-filtered order data
 */
export const shapeOrdersByRole = (rawOrders, userRole, userId = 'user123') => {
  if (!Array.isArray(rawOrders) || !userRole) {
    return []
  }

  // 1. Row Filtering (Which orders can they see?)
  let visibleOrders = rawOrders

  if (userRole === 'staff') {
    // Staff sees only assigned orders
    visibleOrders = rawOrders.filter(order => 
      order.assignedTo === userId || order.assignedTo === 'team'
    )
  }

  // 2. Field Filtering (What details can they see?)
  return visibleOrders.map(order => {
    // Base fields available to everyone
    const shapedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.date,
      customer: order.customer,
      status: order.status, // pending, processing, completed, cancelled
      paymentStatus: order.paymentStatus, // paid, unpaid, partial
      itemsCount: order.items.length,
      assignedTo: order.assignedTo,
      priority: order.priority
    }

    // Role-specific fields
    if (userRole === 'owner') {
      // Owner sees everything including profit margins
      return {
        ...shapedOrder,
        totalAmount: order.totalAmount,
        cost: order.cost,
        profit: order.profit,
        margin: order.margin,
        items: order.items, // Full item details
        notes: order.notes
      }
    }

    if (userRole === 'manager') {
      // Manager sees amounts but NO profit/cost
      return {
        ...shapedOrder,
        totalAmount: order.totalAmount,
        items: order.items,
        notes: order.notes
        // REMOVED: cost, profit, margin
      }
    }

    if (userRole === 'staff') {
      // Staff sees operational details only (NO amounts)
      return {
        ...shapedOrder,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          sku: item.sku
          // REMOVED: price, cost
        })),
        notes: order.notes
        // REMOVED: totalAmount, cost, profit, margin
      }
    }

    return shapedOrder
  })
}
