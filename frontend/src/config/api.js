/**
 * API Configuration for Smart ERP
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    health: '/health',
    root: '/',
    // Auth endpoints
    login: '/api/auth/login',
    me: '/api/auth/me',
    // Dashboard endpoints
    dashboard: '/api/dashboard',
    kpis: '/api/dashboard/kpis',
    charts: '/api/dashboard/charts', 
    transactions: '/api/dashboard/transactions',
    // Future API endpoints
    inventory: '/inventory',
    inventoryProducts: '/inventory/products',
    inventoryMovements: '/inventory/movements', 
    inventoryAdjustments: '/inventory/adjustments',
    inventoryLowStock: '/inventory/low-stock',
    sales: '/api/sales',
    purchasing: '/api/purchasing',
    accounting: '/api/accounting',
    hr: '/api/hr'
  }
}

/**
 * Helper function to build full API URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} - Complete URL
 */
export const getApiUrl = (endpoint) => {
  const path = apiConfig.endpoints[endpoint] || endpoint
  return `${apiConfig.baseUrl}${path}`
}

/**
 * Common fetch wrapper with error handling
 * @param {string} endpoint - Endpoint name or path
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint)
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}