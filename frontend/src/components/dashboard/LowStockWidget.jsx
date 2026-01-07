import React, { useState, useEffect } from 'react'
import { AlertTriangle, Package } from 'lucide-react'
import { fetchLowStockData } from '../../services/dashboard/lowStockApi'

/**
 * LowStockWidget - Dashboard widget showing low stock alerts
 * Shows count and top 5 low stock items for all roles
 */
const LowStockWidget = () => {
  const [lowStockData, setLowStockData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadLowStockData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchLowStockData()
      setLowStockData(data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load low stock data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLowStockData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadLowStockData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="text-red-500" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">Low Stock Alert</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  const { count, threshold, items } = lowStockData || {}

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${count > 0 ? 'bg-orange-50' : 'bg-emerald-50'}`}>
          {count > 0 ? (
            <AlertTriangle className="text-orange-600" size={20} />
          ) : (
            <Package className="text-emerald-600" size={20} />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Low Stock Alert</h3>
          <p className="text-sm text-slate-500">
            Threshold: {threshold} units
          </p>
        </div>
      </div>

      {/* Count Display */}
      <div className="mb-4">
        <div className={`text-2xl font-bold ${count > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
          {count}
        </div>
        <div className="text-sm text-slate-600">
          {count === 0 ? 'No items below threshold' : `${count === 1 ? 'item' : 'items'} below threshold`}
        </div>
      </div>

      {/* Top Items List */}
      {items && items.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Items needing attention:</h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {item.name}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <span className="font-medium">{item.on_hand}</span>
                  <span className="text-xs text-slate-500">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Low Stock Message */}
      {count === 0 && (
        <div className="text-center py-4">
          <Package className="mx-auto text-emerald-500 mb-2" size={24} />
          <p className="text-sm text-slate-600">All items are well-stocked!</p>
        </div>
      )}
    </div>
  )
}

export default LowStockWidget