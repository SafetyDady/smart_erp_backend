/**\n * Shape products data based on user role - DATA SECURITY LAYER
 * Filters product fields to protect sensitive financial information
 * @param {array} rawProducts - Raw product data from API
 * @param {string} userRole - User role (owner/manager/staff)
 * @returns {array} - Role-filtered product data
 */
export const shapeProductsByRole = (rawProducts, userRole) => {
  if (!Array.isArray(rawProducts) || !userRole) {
    return []
  }

  return rawProducts.map(product => {
    // Base fields available to everyone
    const shapedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type, // Add type field for filtering
      category: product.category,
      image: product.image,
      stockLevel: product.stockLevel || 0, // Default to 0 if not provided
      minStockLevel: product.minStockLevel || 10, // Default min stock
      unit: product.unit,
      status: product.status, // active, discontinued
      location: product.location,
      lastUpdated: product.lastUpdated
    }

    // Role-specific fields
    if (userRole === 'owner') {
      // Owner sees everything including costs and margins
      return {
        ...shapedProduct,
        price: product.price,
        cost: product.cost,
        margin: product.margin,
        supplier: product.supplier,
        totalValue: product.price * product.stockLevel,
        totalCost: product.cost * product.stockLevel
      }
    }

    if (userRole === 'manager') {
      // Manager sees price but NOT cost/margin
      return {
        ...shapedProduct,
        price: product.price,
        supplier: product.supplier,
        totalValue: product.price * product.stockLevel
        // REMOVED: cost, margin, totalCost
      }
    }

    if (userRole === 'staff') {
      // Staff sees only operational data (no prices/costs)
      return {
        ...shapedProduct
        // REMOVED: price, cost, margin, supplier, totalValue, totalCost
      }
    }

    return shapedProduct
  })
}
