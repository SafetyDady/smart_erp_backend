/**
 * Low Stock API Service
 * Handles low stock alert API calls
 */
import { apiConfig } from '../../config/api.js'

/**
 * Fetch low stock products data
 * @returns {Promise<Object>} - Low stock data with count and top items
 */
export const fetchLowStockData = async () => {
  try {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${apiConfig.baseUrl}/inventory/low-stock`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to fetch low stock data: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching low stock data:', error)
    throw error
  }
}