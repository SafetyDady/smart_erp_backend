import { useState, useEffect } from 'react'
import { useAuth } from '../components/guards/AuthContext'
import { apiConfig } from '../config/api'

const StockMovementPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'RECEIVE',
    work_order_id: '',
    cost_center: '',
    cost_element: '',
    qty_input: '',
    unit_input: 'PCS',
    unit_cost_input: '',
    note: ''
  })
  
  // UI state
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [costCenters, setCostCenters] = useState([])
  const [costElements, setCostElements] = useState([])
  const [selectedCostElementId, setSelectedCostElementId] = useState('')
  const [derivedCostCenterLabel, setDerivedCostCenterLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Role-based permissions
  const canCreateMovements = userRole !== 'staff'
  const isStaff = userRole === 'staff'
  
  // Development mode: bypass auth for API calls
  const authToken = user?.token || 'dev-token'
  
  // Form validation
  const needsCostElement = formData.movement_type === 'ISSUE' || formData.movement_type === 'CONSUME'
  const missingCostElement = needsCostElement && !selectedCostElementId
  
  const canSubmit = canCreateMovements && 
                   formData.product_id && 
                   formData.qty_input && 
                   (formData.movement_type !== 'RECEIVE' || formData.unit_cost_input) &&
                   (formData.movement_type !== 'CONSUME' || formData.work_order_id) &&
                   (formData.movement_type !== 'ISSUE' || formData.cost_center) &&
                   !missingCostElement

  // Load products and movements on mount
  useEffect(() => {
    loadProducts()
    loadMovements()
    loadWorkOrders()
    loadCostCenters()
    loadCostElements()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/inventory/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      
      const data = await response.json()
      setProducts(data || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const loadMovements = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/stock/movements`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch movements: ${response.status}`)
      }
      
      const data = await response.json()
      setMovements(data || [])
    } catch (err) {
      console.error('Failed to load movements:', err)
    }
  }

  const loadWorkOrders = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/stock/active-work-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch work orders: ${response.status}`)
      }
      
      const data = await response.json()
      setWorkOrders(data || [])
    } catch (err) {
      console.error('Failed to load work orders:', err)
    }
  }

  const loadCostCenters = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-centers?active=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cost centers: ${response.status}`)
      }
      
      const data = await response.json()
      setCostCenters(data || [])
    } catch (err) {
      console.error('Failed to load cost centers:', err)
    }
  }

  const loadCostElements = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-elements?active=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cost elements: ${response.status}`)
      }
      
      const data = await response.json()
      setCostElements(data || [])
    } catch (err) {
      console.error('Failed to load cost elements:', err)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Reset unit_cost_input when movement type changes
      if (field === 'movement_type') {
        if (value !== 'RECEIVE') {
          updated.unit_cost_input = ''
          updated.unit_input = 'PCS' // Lock to PCS for ISSUE/CONSUME
        }
        // Reset work_order_id when not CONSUME
        if (value !== 'CONSUME') {
          updated.work_order_id = ''
          updated.cost_center = ''
          setDerivedCostCenterLabel('')
        }
        // Reset cost allocation when not ISSUE
        if (value !== 'ISSUE') {
          updated.cost_center = ''
          updated.cost_element = ''
        }
        // Reset cost element selection
        setSelectedCostElementId('')
      }
      
      // Derive cost center from work order for CONSUME
      if (field === 'work_order_id' && value && formData.movement_type === 'CONSUME') {
        const selectedWO = workOrders.find(wo => wo.id == value)
        if (selectedWO) {
          updated.cost_center = selectedWO.cost_center
          // Find cost center name for display
          const costCenter = costCenters.find(cc => cc.code === selectedWO.cost_center)
          const ccName = costCenter?.name || ''
          setDerivedCostCenterLabel(ccName ? `${selectedWO.cost_center} - ${ccName}` : String(selectedWO.cost_center || ''))
        }
      } else if (field === 'work_order_id' && !value) {
        setDerivedCostCenterLabel('')
      }
      
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (userRole === 'staff') {
      setError('Staff users have read-only access')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.product_id || !formData.qty_input) {
        throw new Error('Product and quantity are required')
      }

      if (formData.movement_type === 'RECEIVE' && !formData.unit_cost_input) {
        throw new Error('Unit cost is required for RECEIVE movements')
      }

      if (formData.movement_type === 'CONSUME' && !formData.work_order_id) {
        throw new Error('Work Order is required for CONSUME movements')
      }

      if (formData.movement_type === 'CONSUME' && !selectedCostElementId) {
        throw new Error('Cost Element is required for CONSUME movements')
      }
      
      if (formData.movement_type === 'ISSUE' && (!formData.cost_center || !selectedCostElementId)) {
        throw new Error('Cost Center and Cost Element are required for ISSUE movements')
      }

      const payload = {
        product_id: parseInt(formData.product_id),
        movement_type: formData.movement_type,
        qty_input: parseFloat(formData.qty_input),
        unit_input: formData.unit_input,
        unit_cost_input: formData.unit_cost_input ? parseFloat(formData.unit_cost_input) : null,
        note: formData.note || null
      }
      
      if (formData.movement_type === 'CONSUME') {
        payload.work_order_id = parseInt(formData.work_order_id)
        payload.cost_element_id = parseInt(selectedCostElementId)
        // cost_center will be derived by backend from work_order
      }
      
      if (formData.movement_type === 'ISSUE') {
        // Find cost center record from selected value
        const selectedCostCenter = costCenters.find(cc => cc.code === formData.cost_center)
        payload.cost_center_id = selectedCostCenter ? selectedCostCenter.id : null
        payload.cost_element_id = parseInt(selectedCostElementId)
        // No longer send deprecated cost_center/cost_element string fields
      }

      const response = await fetch(`${apiConfig.baseUrl}/stock/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }
      
      // Reset form and refresh data
      setFormData({
        product_id: '',
        movement_type: 'RECEIVE',
        work_order_id: '',
        cost_center: '',
        cost_element: '',
        qty_input: '',
        unit_input: 'PCS',
        unit_cost_input: '',
        note: ''
      })
      setSelectedCostElementId('')
      setDerivedCostCenterLabel('')
      
      setSuccess('Stock movement created successfully')
      await Promise.all([loadProducts(), loadMovements()])
      
    } catch (err) {
      console.error('Failed to create movement:', err)
      setError(err.message || 'Failed to create movement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Movement</h1>
        <p className="mt-1 text-sm text-slate-500">Manage stock movements: RECEIVE inventory, ISSUE for sales/usage, CONSUME for production Work Orders.</p>
        {isStaff && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            Staff users have read-only access. Only managers and owners can create stock movements.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Create Stock Movement</h2>
        
        {/* Staff read-only enforcement */}
        {isStaff ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-600">
            <p className="text-sm">Staff users have read-only access to stock movements.</p>
            <p className="text-xs text-slate-500 mt-1">Only managers and owners can create stock movements.</p>

          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product *
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => handleFormChange('product_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Movement Type *
              </label>
              <select
                value={formData.movement_type}
                onChange={(e) => handleFormChange('movement_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={!canCreateMovements}
              >
                <option value="RECEIVE">RECEIVE</option>
                <option value="ISSUE">ISSUE</option>
                <option value="CONSUME">CONSUME</option>
              </select>
            </div>

            {/* Work Order selection - only for CONSUME movements */}
            {formData.movement_type === 'CONSUME' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work Order *
                </label>
                <select
                  value={formData.work_order_id}
                  onChange={(e) => handleFormChange('work_order_id', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">Select a work order</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Select the work order to consume materials for
                </p>
              </div>
            )}

            {/* Cost Center (read-only) - show for CONSUME after WO selection */}
            {formData.movement_type === 'CONSUME' && derivedCostCenterLabel && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cost Center
                </label>
                <input
                  type="text"
                  value={derivedCostCenterLabel}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                  placeholder="Derived from Work Order"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Automatically derived from selected Work Order
                </p>
              </div>
            )}

            {/* Cost Element dropdown - for ISSUE and CONSUME movements */}
            {(formData.movement_type === 'ISSUE' || formData.movement_type === 'CONSUME') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cost Element *
                </label>
                <select
                  value={selectedCostElementId}
                  onChange={(e) => setSelectedCostElementId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a cost element</option>
                  {costElements.map((ce) => (
                    <option key={ce.id} value={ce.id}>
                      {ce.code ? `${ce.code} - ${ce.name}` : ce.name}
                    </option>
                  ))}
                </select>
                <small className="mt-1 text-xs text-slate-500">Required for ISSUE and CONSUME</small>
              </div>
            )}

            {/* Cost allocation - only for ISSUE movements */}
            {formData.movement_type === 'ISSUE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cost Center *
                </label>
                {costCenters.length > 0 ? (
                  <select
                    value={formData.cost_center}
                    onChange={(e) => handleFormChange('cost_center', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  >
                    <option value="">Select cost center</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.code}>
                        {cc.code} - {cc.name || 'No name'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                    <span className="text-slate-500 text-sm">
                      No cost centers available. Create in Settings → Cost Centers.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.qty_input}
                onChange={(e) => handleFormChange('qty_input', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit_input}
                onChange={(e) => handleFormChange('unit_input', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={['ISSUE', 'CONSUME'].includes(formData.movement_type)}
              >
                <option value="PCS">PCS</option>
                {formData.movement_type === 'RECEIVE' && (
                  <option value="DOZEN">DOZEN</option>
                )}
              </select>
              {['ISSUE', 'CONSUME'].includes(formData.movement_type) && (
                <p className="text-xs text-gray-500 mt-1">
                  ISSUE and CONSUME movements use PCS only
                </p>
              )}
            </div>

            {formData.movement_type === 'RECEIVE' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit Cost (THB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.unit_cost_input}
                  onChange={(e) => handleFormChange('unit_cost_input', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Cost per unit"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Cost per {formData.unit_input} (will be converted to base unit automatically)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleFormChange('note', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows="3"
              placeholder="Optional note"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.product_id || !formData.qty_input}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Movement...' : 'Create Movement'}
          </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cost Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const product = products.find(p => p.id === movement.product_id)
                  
                  return (
                    <tr key={movement.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(movement.performed_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {product?.name || 'Unknown Product'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          movement.movement_type === 'RECEIVE' 
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : movement.movement_type === 'ISSUE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'  
                            : movement.movement_type === 'CONSUME'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-gray-50 text-gray-700 border border-gray-100'  // Other types
                        }`}>
                          {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {movement.qty_input} {movement.unit_input}
                        {movement.qty_input !== movement.qty_base && (
                          <div className="text-xs text-slate-400">
                            = {movement.qty_base} PCS
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {movement.unit_cost_input ? `฿${movement.unit_cost_input.toFixed(2)}` : '-'}
                        {movement.unit_cost_base && movement.unit_cost_input !== movement.unit_cost_base && (
                          <div className="text-xs text-slate-400">
                            (฿{movement.unit_cost_base.toFixed(2)}/PCS)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        ฿{movement.value_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {movement.movement_type === 'ISSUE' && movement.cost_center && movement.cost_element ? (
                          <div>
                            <div className="font-medium">{movement.cost_center}</div>
                            <div className="text-xs text-slate-500">{movement.cost_element}</div>
                          </div>
                        ) : movement.movement_type === 'CONSUME' && movement.work_order_id ? (
                          <div>
                            <div className="font-medium">WO: {movement.work_order_id}</div>
                            {movement.cost_center && movement.cost_element && (
                              <div className="text-xs text-slate-500">
                                {movement.cost_center} / {movement.cost_element}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {movement.balance_after} PCS
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StockMovementPage