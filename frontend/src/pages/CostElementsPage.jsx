import { useState, useEffect } from 'react'
import { useAuth } from '../components/guards/AuthContext'
import { apiConfig } from '../config/api'

const CostElementsPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const authToken = user?.token || 'dev-token'
  
  // State
  const [costElements, setCostElements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: ''
  })
  const [codeValidationError, setCodeValidationError] = useState('')
  
  const canManage = userRole !== 'staff'
  
  useEffect(() => {
    loadCostElements()
  }, [])
  
  const loadCostElements = async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-elements`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to load cost elements')
      
      const data = await response.json()
      setCostElements(data)
    } catch (err) {
      setError(err.message)
    }
  }
  
  const validateCodeInput = (value) => {
    const codeRegex = /^[A-Z0-9_-]+$/
    if (value && !codeRegex.test(value)) {
      setCodeValidationError('Use A-Z, 0-9, underscore (_) or hyphen (-) only')
      return false
    } else {
      setCodeValidationError('')
      return true
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!canManage) return
    
    // Validate code before submitting
    if (!validateCodeInput(formData.code)) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-elements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create cost element')
      }
      
      setSuccess('Cost element created successfully')
      setFormData({ code: '', name: '' })
      setShowCreateForm(false)
      await loadCostElements()
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleActive = async (id, currentStatus) => {
    if (!canManage) return
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/master-data/cost-elements/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update cost element')
      
      setSuccess(currentStatus ? 'Cost element deactivated' : 'Cost element activated')
      await loadCostElements()
      
    } catch (err) {
      setError(err.message)
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Cost Elements</h1>
              <p className="text-slate-600 mt-1">Manage cost element master data</p>
            </div>
            
            {canManage && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCreateForm ? 'Cancel' : 'Create New'}
              </button>
            )}
          </div>
          
          {!canManage && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-600">
                ⚠️ You have read-only access. Only managers and owners can create/modify cost elements.
              </p>
            </div>
          )}
        </div>
        
        {/* Create Form */}
        {showCreateForm && canManage && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Create Cost Element</h2>
            
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase()
                    setFormData(prev => ({ ...prev, code: upperValue }))
                    validateCodeInput(upperValue)
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    codeValidationError ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="e.g. MATERIALS"
                  title="Use A-Z, 0-9, underscore (_) or hyphen (-) only"
                  required
                />
                {codeValidationError && (
                  <p className="mt-1 text-sm text-red-600">{codeValidationError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Raw Materials"
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading || !formData.code || codeValidationError}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Cost Element'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Messages */}
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
        
        {/* Cost Elements Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Cost Elements ({costElements.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costElements.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                      No cost elements found
                    </td>
                  </tr>
                ) : (
                  costElements.map((ce) => (
                    <tr key={ce.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">
                        {ce.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ce.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ce.is_active 
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {ce.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(ce.created_at).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleToggleActive(ce.id, ce.is_active)}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                              ce.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {ce.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}

export default CostElementsPage