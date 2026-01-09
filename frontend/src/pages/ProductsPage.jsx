import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, AlertCircle, Package, X } from 'lucide-react'
import { useAuth } from '../components/guards/AuthContext'
import { shapeProductsByRole } from '../services/inventory/shapeProductsByRole'
import { fetchProducts, transformProductData, createProduct } from '../services/inventory/productsApi'
import LoadingState from '../components/common/LoadingState'

const ProductsPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, product, material, consumable
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    product_type: 'product',
    cost: '',
    category: '',
    unit: 'pcs'
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch products from backend API
        const backendProducts = await fetchProducts({
          product_type: typeFilter === 'all' ? undefined : typeFilter,
          limit: 100
        })
        
        // Transform backend data to frontend format
        const transformedProducts = transformProductData(backendProducts)
        
        // Apply role-based filtering
        const shapedData = shapeProductsByRole(transformedProducts, userRole)
        
        setProducts(shapedData)
      } catch (error) {
        console.error("Failed to load products", error)
        setError(error.message)
        setProducts([]) // Set to empty array on error
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [userRole, typeFilter])

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required')
      }
      
      if (!formData.cost || parseFloat(formData.cost) < 1.0) {
        throw new Error('Cost must be at least 1.00 THB')
      }
      
      const costValue = parseFloat(formData.cost)
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        product_type: formData.product_type,
        cost: costValue,
        price: costValue, // Set price same as cost for simplicity
        category: formData.category.trim() || null,
        unit: formData.unit || 'pcs'
      }
      
      await createProduct(productData)
      
      // Reset form and close modal
      setFormData({
        name: '',
        sku: '',
        product_type: 'product',
        cost: '',
        category: '',
        unit: 'pcs'
      })
      setShowCreateModal(false)
      
      // Refetch products to show the new one
      const backendProducts = await fetchProducts({
        product_type: typeFilter === 'all' ? undefined : typeFilter,
        limit: 100
      })
      const transformedProducts = transformProductData(backendProducts)
      const shapedData = shapeProductsByRole(transformedProducts, userRole)
      setProducts(shapedData)
      
    } catch (error) {
      console.error('Failed to create product:', error)
      if (error.response?.status === 409) {
        const detail = error.response?.data?.detail || ''
        if (detail.includes('SKU already exists')) {
          setCreateError('SKU ซ้ำ กรุณาใช้ SKU อื่น')
        } else {
          setCreateError(detail)
        }
      } else {
        setCreateError(error.message || 'Failed to create product. Please try again.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Filter products by search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="title" count={1} />
        <LoadingState variant="table" count={5} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your inventory and product catalog.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load products</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredProducts.length === 0 && !isLoading) {
    const isEmpty = products.length === 0
    const isFiltered = products.length > 0 && filteredProducts.length === 0
    
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Products</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your inventory and product catalog.</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Type Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setTypeFilter('product')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'product' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setTypeFilter('material')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'material' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Materials
            </button>
            <button 
              onClick={() => setTypeFilter('consumable')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'consumable' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Consumables
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <div className="text-center">
            <Package size={48} className="mx-auto text-slate-400 mb-4" />
            {isEmpty ? (
              <>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No products found</h3>
                <p className="text-sm text-slate-600 mb-4">Get started by adding your first product to the inventory.</p>
                {(userRole === 'owner' || userRole === 'manager') && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Add Product
                  </button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No matching products</h3>
                <p className="text-sm text-slate-600 mb-4">
                  No products match your current search criteria. Try adjusting your search or filter.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                  }}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your inventory and product catalog.</p>
        </div>
        {(userRole === 'owner' || userRole === 'manager') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Type Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setTypeFilter('product')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'product' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setTypeFilter('material')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'material' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Materials
          </button>
          <button 
            onClick={() => setTypeFilter('consumable')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === 'consumable' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Consumables
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Item Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stock
                </th>
                {/* Price Column - Hidden for Staff */}
                {filteredProducts[0]?.price !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                )}
                {/* Cost Column - Only for Owner */}
                {userRole === 'owner' && filteredProducts[0]?.cost !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cost
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                // Skip rendering if product is invalid
                if (!product || !product.id) {
                  console.warn('Invalid product data:', product)
                  return null
                }
                
                return (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.type === 'product' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        Product
                      </span>
                    )}
                    {product.type === 'material' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        Material
                      </span>
                    )}
                    {product.type === 'consumable' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        Consumable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        product.stockLevel <= 0 ? 'text-red-600' : 
                        product.stockLevel <= product.minStockLevel ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {product.stockLevel} {product.unit}
                      </span>
                      {product.stockLevel <= product.minStockLevel && (
                        <AlertCircle size={14} className={product.stockLevel <= 0 ? 'text-red-500' : 'text-amber-500'} />
                      )}
                    </div>
                  </td>
                  
                  {/* Price Cell - Hidden for Staff */}
                  {product.price !== undefined && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                      ฿{(product.price || 0).toFixed(2)}
                    </td>
                  )}

                  {/* Cost Cell - Only for Owner */}
                  {userRole === 'owner' && product.cost !== undefined && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                      ฿{(product.cost || 0).toFixed(2)}
                    </td>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      product.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Add New Product</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SKU
                  <span className="text-xs text-slate-500 ml-1">(optional - auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleFormChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.product_type}
                  onChange={(e) => handleFormChange('product_type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="product">Product</option>
                  <option value="material">Material</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>
              
              {/* Cost - Only for Owner/Manager */}
              {(userRole === 'owner' || userRole === 'manager') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cost (THB) *
                    <span className="text-xs text-slate-500 ml-1">(minimum 1.00)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.cost}
                    onChange={(e) => handleFormChange('cost', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="1.00"
                    required
                  />
                </div>
              )}
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Optional category"
                />
              </div>
              
              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="pcs"
                />
              </div>
              
              {/* Error Message */}
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !formData.name.trim() || (userRole !== 'staff' && !formData.cost)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
