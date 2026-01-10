import React, { useState, useEffect } from 'react'
import { useAuth } from '../components/guards/AuthContext'
import { apiConfig } from '../config/api'

const WarehousesPage = () => {
  const { user, token } = useAuth()
  const [warehouses, setWarehouses] = useState([])
  const [zones, setZones] = useState([])
  const [stockLocations, setStockLocations] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check if user has management access
  const canManage = user?.role === 'owner' || user?.role === 'manager'
  const isStaff = user?.role === 'staff'

  useEffect(() => {
    if (token) {
      loadWarehouses()
      loadStockLocations()
    }
  }, [token])

  const loadWarehouses = async () => {
    try {
      console.log('Loading warehouses with token:', token ? 'present' : 'missing')
      const response = await fetch(`${apiConfig.baseUrl}/warehouses`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })
      
      if (!response.ok) {
        console.log('Warehouse API error:', response.status, response.statusText)
        throw new Error(`Failed to load warehouses: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Warehouses loaded:', data)
      setWarehouses(data || [])
    } catch (err) {
      console.error('Failed to load warehouses:', err)
      setError(err.message || 'Failed to load warehouses')
    }
  }

  const loadZones = async (warehouseId) => {
    try {
      console.log('Loading zones for warehouse:', warehouseId, 'with token:', token ? 'present' : 'missing')
      const response = await fetch(`${apiConfig.baseUrl}/warehouses/${warehouseId}/zones`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load zones: ${response.status}`)
      }
      
      const data = await response.json()
      setZones(data || [])
    } catch (err) {
      console.error('Failed to load zones:', err)
      setError(err.message || 'Failed to load zones')
    }
  }

  const loadStockLocations = async (warehouseId = null, zoneType = null) => {
    try {
      let url = `${apiConfig.baseUrl}/stock-locations`
      const params = new URLSearchParams()
      
      if (warehouseId) params.append('warehouse_id', warehouseId)
      if (zoneType) params.append('zone_type', zoneType)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })
      
      if (!response.ok) {
        console.log('Stock locations API error:', response.status, response.statusText)
        throw new Error(`Failed to load stock locations: ${response.status}`)
      }
      
      const data = await response.json()
      setStockLocations(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to load stock locations:', err)
      setError(err.message || 'Failed to load stock locations')
      setLoading(false)
    }
  }

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse)
    loadZones(warehouse.id)
    loadStockLocations(warehouse.id)
  }

  const getZoneStatusColor = (zoneType) => {
    const colors = {
      'RECEIVING': 'bg-blue-100 text-blue-800',
      'QC_HOLD': 'bg-yellow-100 text-yellow-800',
      'STORAGE': 'bg-green-100 text-green-800',
      'PICK': 'bg-purple-100 text-purple-800',
      'DISPATCH': 'bg-orange-100 text-orange-800',
      'SCRAP': 'bg-red-100 text-red-800'
    }
    return colors[zoneType] || 'bg-gray-100 text-gray-800'
  }

  const getStockStatusColor = (status) => {
    const colors = {
      'Received': 'bg-blue-100 text-blue-800',
      'In QC': 'bg-yellow-100 text-yellow-800',
      'Available': 'bg-green-100 text-green-800',
      'Ready to Dispatch': 'bg-orange-100 text-orange-800',
      'Not Usable': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Warehouse Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage warehouses, zones, and stock locations for multi-warehouse operations.</p>
        {isStaff && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            Staff users have read-only access to warehouse information.
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Warehouse Overview */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Warehouses</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              onClick={() => handleWarehouseSelect(warehouse)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedWarehouse?.id === warehouse.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-900">{warehouse.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {warehouse.warehouse_type}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{warehouse.code}</p>
              <div className="text-xs text-slate-500">
                {warehouse.zone_count} zones
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zones for Selected Warehouse */}
      {selectedWarehouse && zones.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Zones in {selectedWarehouse.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{zone.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getZoneStatusColor(zone.zone_type)}`}>
                    {zone.zone_type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{zone.description}</p>
                <div className="text-xs text-slate-500">
                  Status: {zone.stock_status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Locations */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Stock Locations</h2>
          <div className="text-sm text-slate-500">
            {stockLocations.length} items across zones
          </div>
        </div>
        
        {stockLocations.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No stock locations found</p>
            <p className="text-sm">Stock will appear here after setting up warehouses and receiving inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {stockLocations.map((location, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{location.product_name}</div>
                      <div className="text-sm text-slate-500">{location.product_sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{location.warehouse_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{location.zone_name}</div>
                      <span className={`text-xs px-2 py-1 rounded ${getZoneStatusColor(location.zone_type)}`}>
                        {location.zone_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {location.on_hand.toLocaleString()} PCS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded ${getStockStatusColor(location.stock_status)}`}>
                        {location.stock_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone Transfer placeholder */}
      {canManage && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Zone Management</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Zone Transfer Feature</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Zone-to-zone stock transfers will be available in the next phase. Current features:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Stock automatically goes to RECEIVING zone on RECEIVE</li>
                    <li>Available stock shows from STORAGE and PICK zones</li>
                    <li>Stock status derived from zone location</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarehousesPage