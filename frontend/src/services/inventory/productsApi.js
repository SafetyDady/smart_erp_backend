/**
 * Products API Service
 * Handles all product-related API calls
 */
import { apiConfig } from '../../config/api.js'

/**
 * Fetch all products from the backend
 * @param {Object} params - Query parameters
 * @param {string} params.product_type - Filter by product type (optional)
 * @param {string} params.category - Filter by category (optional) 
 * @param {number} params.limit - Maximum number of results (default: 100)
 * @param {number} params.offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} - Array of products
 */
export const fetchProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.product_type && params.product_type !== 'all') {
      queryParams.append('product_type', params.product_type)
    }
    if (params.category) {
      queryParams.append('category', params.category)
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString())
    }

    const url = `${apiConfig.baseUrl}${apiConfig.endpoints.inventoryProducts}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Create a new product
 * @param {Object} productData - Product data to create
 * @param {string} productData.name - Product name (required)
 * @param {string} productData.product_type - Product type: product, material, consumable
 * @param {number} productData.cost - Product cost (required)
 * @param {string} productData.sku - Product SKU (optional, will be auto-generated if not provided)
 * @param {string} productData.category - Product category (optional)
 * @param {string} productData.unit - Product unit (default: pcs)
 * @param {number} productData.price - Product price (optional)
 * @returns {Promise<Object>} - Created product
 */
export const createProduct = async (productData) => {
  try {
    // Generate SKU if not provided
    const sku = productData.sku || `${productData.product_type.toUpperCase()}-${Date.now()}`
    
    const requestData = {
      name: productData.name,
      sku: sku,
      product_type: productData.product_type,
      category: productData.category || null,
      unit: productData.unit || 'pcs',
      cost: productData.cost,
      price: productData.price // Don't default to null if price exists
    }

    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.inventoryProducts}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to create product: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Transform backend product data to frontend format
 * Maps backend response to expected frontend structure
 * @param {Array} backendProducts - Raw products from backend API
 * @returns {Array} - Transformed products for frontend
 */
export const transformProductData = (backendProducts) => {
  if (!Array.isArray(backendProducts)) {
    return []
  }

  return backendProducts.map(product => ({
    id: product.id,
    name: product.name || 'Unknown Product',
    sku: product.sku || '',
    type: product.product_type || 'product', // Maps product_type to type
    category: product.category || null,
    unit: product.unit || 'pcs',
    price: product.price, // Keep as null if not provided
    cost: product.cost || 0,
    status: 'active', // Backend doesn't have status field, default to active
    
    // Default values for fields not provided by backend
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=100&q=80', // Default product image
    stockLevel: 0, // Will need to fetch from stock balances endpoint later
    minStockLevel: 10, // Default minimum stock level
    location: 'Warehouse A', // Default location
    supplier: 'TBD', // Default supplier
    margin: product.price && product.cost ? Math.round(((product.price - product.cost) / product.price) * 100 * 10) / 10 : 0,
    lastUpdated: product.created_at,
    createdBy: product.created_by
  }))
}