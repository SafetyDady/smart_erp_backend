import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, AlertCircle, Package } from 'lucide-react'
import { useRole } from '../components/guards/RoleContext'
import { shapeProductsByRole } from '../services/inventory/shapeProductsByRole'
import LoadingState from '../components/common/LoadingState'

// Mock Data
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Ergonomic Office Chair',
    sku: 'FUR-CHR-001',
    type: 'product',
    category: 'Furniture',
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=100&q=80',
    stockLevel: 45,
    minStockLevel: 10,
    unit: 'pcs',
    price: 250.00,
    cost: 120.00,
    margin: 52,
    status: 'active',
    location: 'Warehouse A-12',
    supplier: 'Office Comfort Co.'
  },
  {
    id: 2,
    name: 'Wireless Mechanical Keyboard',
    sku: 'ELE-KEY-002',
    type: 'product',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=100&q=80',
    stockLevel: 8,
    minStockLevel: 15,
    unit: 'pcs',
    price: 120.00,
    cost: 65.00,
    margin: 45.8,
    status: 'active',
    location: 'Warehouse B-05',
    supplier: 'TechGear Ltd.'
  },
  {
    id: 3,
    name: 'Oak Wood Plank (2m)',
    sku: 'MAT-WD-001',
    type: 'material',
    category: 'Raw Material',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=100&q=80',
    stockLevel: 150,
    minStockLevel: 50,
    unit: 'pcs',
    price: 0, // Not for sale
    cost: 45.00,
    margin: 0,
    status: 'active',
    location: 'Warehouse C-01',
    supplier: 'Wood Works Co.'
  },
  {
    id: 4,
    name: 'Steel Frame Tube',
    sku: 'MAT-STL-002',
    type: 'material',
    category: 'Raw Material',
    image: 'https://images.unsplash.com/photo-1535063406552-4404398e58a0?w=100&q=80',
    stockLevel: 300,
    minStockLevel: 100,
    unit: 'm',
    price: 0,
    cost: 15.50,
    margin: 0,
    status: 'active',
    location: 'Warehouse C-02',
    supplier: 'Metal Supply Inc.'
  },
  {
    id: 5,
    name: 'Drill Bit Set (Titanium)',
    sku: 'CON-TLS-001',
    type: 'consumable',
    category: 'Tools',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=100&q=80',
    stockLevel: 12,
    minStockLevel: 5,
    unit: 'set',
    price: 0,
    cost: 85.00,
    margin: 0,
    status: 'active',
    location: 'Tool Room A',
    supplier: 'Tool Master'
  },
  {
    id: 6,
    name: 'Safety Gloves (L)',
    sku: 'CON-SAF-002',
    type: 'consumable',
    category: 'Safety Gear',
    image: 'https://images.unsplash.com/photo-1615486511484-92e172cc416d?w=100&q=80',
    stockLevel: 50,
    minStockLevel: 20,
    unit: 'pair',
    price: 0,
    cost: 2.50,
    margin: 0,
    status: 'active',
    location: 'Tool Room B',
    supplier: 'Safety First'
  }
]

const ProductsPage = () => {
  const { userRole } = useRole()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, product, material, consumable

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        const shapedData = shapeProductsByRole(MOCK_PRODUCTS, userRole)
        // Filter by type if not 'all'
        const filteredData = typeFilter === 'all' 
          ? shapedData 
          : shapedData.filter(p => p.type === typeFilter)
        setProducts(filteredData)
      } catch (error) {
        console.error("Failed to load products", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [userRole, typeFilter])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="title" count={1} />
        <LoadingState variant="table" count={5} />
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
                {products[0]?.price !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price
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
              {products.map((product) => (
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
                      ${product.price.toFixed(2)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProductsPage
