import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit2, Calendar, FileText, Settings, CheckCircle2, Clock, MoreHorizontal, Eye, X } from 'lucide-react'
import { useAuth } from '../components/guards/AuthContext'
import { apiConfig } from '../config/api'
import LoadingState from '../components/common/LoadingState'

const WorkOrdersPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  
  // State
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [consumptionData, setConsumptionData] = useState(null)
  const [loadingConsumptions, setLoadingConsumptions] = useState(false)
  const [costCenters, setCostCenters] = useState([])
  const [costElements, setCostElements] = useState([])
  
  // Form state
  const [formData, setFormData] = useState({
    wo_number: '',
    title: '',
    description: '',
    status: 'OPEN',
    cost_center: '',
    cost_element: ''
  })
  
  // Role-based permissions
  const canCreateEdit = userRole === 'manager' || userRole === 'owner'
  
  // Load work orders
  useEffect(() => {
    loadWorkOrders()
    loadCostCenters()
    loadCostElements()
  }, [])
  
  const loadWorkOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${apiConfig.baseUrl}/work-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load work orders: ${response.status}`)
      }
      
      const data = await response.json()
      setWorkOrders(data)
    } catch (err) {
      console.error('Failed to load work orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const loadCostCenters = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-centers?active=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCostCenters(data)
      }
    } catch (err) {
      console.error('Failed to load cost centers:', err)
    }
  }
  
  const loadCostElements = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-elements?active=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCostElements(data)
      }
    } catch (err) {
      console.error('Failed to load cost elements:', err)
    }
  }
  
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      const response = await fetch(`${apiConfig.baseUrl}/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to create work order: ${response.status}`)
      }
      
      setSuccess('Work order created successfully')
      setShowCreateForm(false)
      setFormData({
        wo_number: '',
        title: '',
        description: '',
        status: 'OPEN',
        cost_center: '',
        cost_element: ''
      })
      loadWorkOrders()
    } catch (err) {
      setError(err.message)
    }
  }
  
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      const response = await fetch(`${apiConfig.baseUrl}/work-orders/${selectedWorkOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          cost_center: formData.cost_center,
          cost_element: formData.cost_element
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to update work order: ${response.status}`)
      }
      
      setSuccess('Work order updated successfully')
      setShowEditForm(false)
      setSelectedWorkOrder(null)
      loadWorkOrders()
    } catch (err) {
      setError(err.message)
    }
  }
  
  const openEditForm = (workOrder) => {
    setSelectedWorkOrder(workOrder)
    setFormData({
      wo_number: workOrder.wo_number,
      title: workOrder.title,
      description: workOrder.description || '',
      status: workOrder.status,
      cost_center: workOrder.cost_center,
      cost_element: workOrder.cost_element
    })
    setShowEditForm(true)
  }

  const openDetailView = async (workOrder) => {
    setSelectedWorkOrder(workOrder)
    setShowDetailView(true)
    setLoadingConsumptions(true)
    setConsumptionData(null)
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/work-orders/${workOrder.id}/consumptions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load consumption data')
      }
      
      const data = await response.json()
      setConsumptionData(data)
    } catch (err) {
      setError(`Failed to load consumption data: ${err.message}`)
    } finally {
      setLoadingConsumptions(false)
    }
  }
  
  const getStatusBadge = (status) => {
    const statusStyles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      OPEN: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.OPEN}`}>
        {status}
      </span>
    )
  }
  
  // Filter work orders
  const filteredWorkOrders = workOrders.filter(wo => 
    wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.cost_center.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  if (loading) {
    return <LoadingState message="Loading work orders..." />
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage manufacturing and service work orders
          </p>
        </div>
        
        {canCreateEdit && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Create Work Order
          </button>
        )}
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      
      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by WO number, title, or cost center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none outline-none text-sm"
          />
        </div>
      </div>
      
      {/* Work Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WO Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Center
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Element
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWorkOrders.map((workOrder) => (
                <tr key={workOrder.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    {workOrder.wo_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {workOrder.title}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(workOrder.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {workOrder.cost_center}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {workOrder.cost_element}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(workOrder.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailView(workOrder)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="View Details & Consumption Trace"
                      >
                        <Eye size={14} />
                      </button>
                      {canCreateEdit && (
                        <button
                          onClick={() => openEditForm(workOrder)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit Work Order"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No work orders found matching your search.' : 'No work orders created yet.'}
              </p>
              {canCreateEdit && !searchTerm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first work order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Work Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Work Order</h3>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WO Number *
                  </label>
                  <input
                    type="text"
                    value={formData.wo_number}
                    onChange={(e) => setFormData({...formData, wo_number: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g., WO-2026-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Brief work order title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Detailed description of the work to be done"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Center *
                  </label>
                  <select
                    value={formData.cost_center}
                    onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Cost Center</option>
                    {costCenters.map(center => (
                      <option key={center.id} value={center.code}>
                        {center.code} - {center.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Element *
                  </label>
                  <select
                    value={formData.cost_element}
                    onChange={(e) => setFormData({...formData, cost_element: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Cost Element</option>
                    {costElements.map(element => (
                      <option key={element.id} value={element.code}>
                        {element.code} - {element.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Work Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Work Order Modal */}
      {showEditForm && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Work Order: {selectedWorkOrder.wo_number}
              </h3>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WO Number
                  </label>
                  <input
                    type="text"
                    value={formData.wo_number}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Center *
                  </label>
                  <select
                    value={formData.cost_center}
                    onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Cost Center</option>
                    {costCenters.map(center => (
                      <option key={center.id} value={center.code}>
                        {center.code} - {center.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Element *
                  </label>
                  <select
                    value={formData.cost_element}
                    onChange={(e) => setFormData({...formData, cost_element: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Cost Element</option>
                    {costElements.map(element => (
                      <option key={element.id} value={element.code}>
                        {element.code} - {element.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Work Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Work Order Detail View Modal */}
      {showDetailView && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Work Order Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedWorkOrder.wo_number} - {selectedWorkOrder.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailView(false)
                    setSelectedWorkOrder(null)
                    setConsumptionData(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Work Order Info */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Work Order Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedWorkOrder.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Cost Center:</span>
                    <p className="mt-1 text-gray-600">{selectedWorkOrder.cost_center}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Cost Element:</span>
                    <p className="mt-1 text-gray-600">{selectedWorkOrder.cost_element}</p>
                  </div>
                </div>
              </div>

              {/* Consumption Trace */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Consumption Trace</h4>
                
                {loadingConsumptions ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingState message="Loading consumption data..." />
                  </div>
                ) : consumptionData ? (
                  <>
                    {/* Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Total Consumed Quantity:</span>
                          <p className="text-lg font-bold text-blue-900 mt-1">
                            {consumptionData.summary.total_consumed_qty} PCS
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Total Consumed Value:</span>
                          <p className="text-lg font-bold text-blue-900 mt-1">
                            ฿{consumptionData.summary.total_consumed_value.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consumption Table */}
                    {consumptionData.consumptions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Date/Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Product
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Qty (PCS)
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Unit Cost (฿)
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Total Value (฿)
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Note
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {consumptionData.consumptions.map((consumption, index) => (
                              <tr key={consumption.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {new Date(consumption.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-900">{consumption.product.name}</div>
                                    <div className="text-xs text-gray-500">{consumption.product.sku}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {consumption.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {consumption.unit_cost.toLocaleString('en-US', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  })}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {consumption.total_value.toLocaleString('en-US', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                  })}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {consumption.note || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {consumption.created_by}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No consumption records found for this work order.</p>
                        <p className="text-sm mt-2">Create CONSUME stock movements to see them here.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-red-500">
                    <p>Failed to load consumption data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkOrdersPage
