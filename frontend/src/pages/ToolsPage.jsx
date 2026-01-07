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
  Calculator
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

  const filteredTools = MOCK_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter
    return matchesSearch && matchesStatus
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
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
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
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['all', 'available', 'in_use', 'maintenance'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${statusFilter === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTools.map(tool => {
          const depreciation = calculateDepreciation(tool.purchasePrice, tool.purchaseDate, tool.usefulLifeYears)
          
          return (
            <div key={tool.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="flex flex-col sm:flex-row h-full">
                {/* Image Section */}
                <div className="sm:w-40 h-48 sm:h-auto bg-slate-100 relative">
                  <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(tool.status)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{tool.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{tool.serialNumber}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-700">฿{depreciation.currentValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        <div className="text-[10px] text-slate-400">Book Value</div>
                      </div>
                    </div>

                    {/* Borrowing Info */}
                    {tool.status === 'in_use' && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                        <div className="flex items-center gap-2 text-sm text-blue-800 font-medium mb-1">
                          <User size={14} />
                          {tool.borrowedBy}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Clock size={12} />
                          Due: {tool.dueDate}
                        </div>
                      </div>
                    )}

                    {/* Location Info */}
                    {tool.status === 'available' && (
                      <div className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Location: <span className="font-medium">{tool.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer / Actions */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col w-1/2 mr-4">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Depreciation ({tool.usefulLifeYears}y)</span>
                        <span>{Math.round(depreciation.depreciationProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="bg-slate-400 h-1.5 rounded-full" 
                          style={{ width: `${depreciation.depreciationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="History">
                        <History size={18} />
                      </button>
                      <button className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ToolsPage
