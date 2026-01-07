import React, { useState } from 'react'
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User,
  History,
  Calculator,
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react'
import { useRole } from '../components/guards/RoleContext'

// Mock Data for Tools & Assets
const MOCK_TOOLS = [
  {
    id: 'TL-001',
    name: 'Hilti Rotary Hammer Drill',
    serialNumber: 'SN-8849201',
    category: 'Power Tools',
    status: 'available', // available, in_use, maintenance, lost
    condition: 'good',
    purchaseDate: '2023-01-15',
    purchasePrice: 15000,
    usefulLifeYears: 5,
    location: 'Shelf A-01',
    borrowedBy: null,
    dueDate: null,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100&q=80'
  },
  {
    id: 'TL-002',
    name: 'Fluke Digital Multimeter',
    serialNumber: 'SN-3321005',
    category: 'Testing Equipment',
    status: 'in_use',
    condition: 'excellent',
    purchaseDate: '2023-06-10',
    purchasePrice: 8500,
    usefulLifeYears: 3,
    location: 'Site B',
    borrowedBy: 'Somchai (Technician)',
    dueDate: '2024-03-20',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=100&q=80'
  },
  {
    id: 'TL-003',
    name: 'Bosch Angle Grinder',
    serialNumber: 'SN-9921002',
    category: 'Power Tools',
    status: 'maintenance',
    condition: 'needs_repair',
    purchaseDate: '2022-05-20',
    purchasePrice: 4500,
    usefulLifeYears: 3,
    location: 'Repair Shop',
    borrowedBy: null,
    dueDate: null,
    image: 'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=100&q=80'
  },
  {
    id: 'TL-004',
    name: 'Ladder (Aluminum 12ft)',
    serialNumber: 'SN-LD-004',
    category: 'General Tools',
    status: 'available',
    condition: 'fair',
    purchaseDate: '2021-11-01',
    purchasePrice: 3200,
    usefulLifeYears: 5,
    location: 'Storage Zone C',
    borrowedBy: null,
    dueDate: null,
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=100&q=80'
  }
]

// Helper function to calculate depreciation (Straight Line Method)
const calculateDepreciation = (price, purchaseDate, usefulLifeYears) => {
  const purchase = new Date(purchaseDate)
  const now = new Date()
  const ageInYears = (now - purchase) / (1000 * 60 * 60 * 24 * 365.25)
  
  const yearlyDepreciation = price / usefulLifeYears
  const totalDepreciation = yearlyDepreciation * ageInYears
  const currentValue = Math.max(0, price - totalDepreciation)
  
  return {
    currentValue,
    ageInYears,
    depreciationProgress: Math.min(100, (ageInYears / usefulLifeYears) * 100)
  }
}

const ToolsPage = () => {
  const { userRole } = useRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Extract unique categories for filter dropdown
  const categories = ['all', ...new Set(MOCK_TOOLS.map(t => t.category))]

  const filteredTools = MOCK_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} className="mr-1"/> Available</span>
      case 'in_use':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><User size={12} className="mr-1"/> In Use</span>
      case 'maintenance':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><Wrench size={12} className="mr-1"/> Maintenance</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">Unknown</span>
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tools Room</h1>
          <p className="mt-1 text-sm text-slate-500">Asset management, tracking, and depreciation monitoring.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Register New Tool
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Total Assets Value</div>
          <div className="text-2xl font-bold text-slate-800">฿31,200</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Calculator size={12} /> Book Value (Depreciated)
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Tools In Use</div>
          <div className="text-2xl font-bold text-blue-600">1</div>
          <div className="text-xs text-slate-400 mt-1">Out of 4 total tools</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Maintenance</div>
          <div className="text-2xl font-bold text-amber-600">1</div>
          <div className="text-xs text-slate-400 mt-1">Needs repair</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Available</div>
          <div className="text-2xl font-bold text-emerald-600">2</div>
          <div className="text-xs text-slate-400 mt-1">Ready for checkout</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by tool name or serial number..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['all', 'available', 'in_use', 'maintenance'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${statusFilter === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tool Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Location / User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Book Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTools.map((tool) => {
                const depreciation = calculateDepreciation(tool.purchasePrice, tool.purchaseDate, tool.usefulLifeYears)
                
                return (
                  <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                        <img src={tool.image} alt={tool.name} className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{tool.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{tool.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {tool.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tool.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tool.status === 'in_use' ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                            <User size={12} /> {tool.borrowedBy}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} /> Due: {tool.dueDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">{tool.location}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">฿{depreciation.currentValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        <div className="w-24 bg-slate-100 rounded-full h-1 mt-1">
                          <div 
                            className="bg-slate-400 h-1 rounded-full" 
                            style={{ width: `${depreciation.depreciationProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
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
    </div>
  )
}

export default ToolsPage
