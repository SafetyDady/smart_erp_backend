import React, { useState } from 'react'
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Hammer, 
  Wrench,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../components/guards/AuthContext'

// Mock Data for Work Orders
const MOCK_WORK_ORDERS = [
  {
    id: 'WO-2024-001',
    type: 'production', // production, service
    title: 'Assemble Office Chairs Batch #45',
    status: 'in_progress', // pending, in_progress, completed, on_hold
    priority: 'high',
    assignee: 'Production Team A',
    startDate: '2024-03-15',
    dueDate: '2024-03-20',
    items: [
      { name: 'Ergonomic Office Chair', quantity: 50, type: 'output' },
      { name: 'Steel Frame Tube', quantity: 100, type: 'input' },
      { name: 'Fabric Roll (Black)', quantity: 25, type: 'input' }
    ],
    progress: 65
  },
  {
    id: 'WO-2024-002',
    type: 'service',
    title: 'Office Renovation - Client ABC',
    status: 'pending',
    priority: 'medium',
    assignee: 'Service Team B',
    startDate: '2024-03-18',
    dueDate: '2024-03-25',
    items: [
      { name: 'Oak Wood Plank', quantity: 20, type: 'input' },
      { name: 'Drill Bit Set', quantity: 1, type: 'consumable' },
      { name: 'Safety Gloves', quantity: 5, type: 'consumable' }
    ],
    progress: 0
  },
  {
    id: 'WO-2024-003',
    type: 'production',
    title: 'Custom Desk Manufacturing',
    status: 'completed',
    priority: 'normal',
    assignee: 'Production Team A',
    startDate: '2024-03-01',
    dueDate: '2024-03-05',
    items: [
      { name: 'Standing Desk Converter', quantity: 10, type: 'output' }
    ],
    progress: 100
  },
  {
    id: 'WO-2024-004',
    type: 'service',
    title: 'AC Maintenance - Building C',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Maintenance Crew',
    startDate: '2024-03-16',
    dueDate: '2024-03-16',
    items: [
      { name: 'Coolant Fluid', quantity: 5, type: 'consumable' },
      { name: 'Filter Mesh', quantity: 10, type: 'input' }
    ],
    progress: 40
  }
]

const WorkOrdersPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const [activeTab, setActiveTab] = useState('all') // all, production, service
  const [searchTerm, setSearchTerm] = useState('')

  // Filter Logic
  const filteredOrders = MOCK_WORK_ORDERS.filter(order => {
    const matchesTab = activeTab === 'all' || order.type === activeTab
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Work Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage production jobs and service requests.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Orders</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Start</p>
            <p className="text-2xl font-bold text-slate-800">5</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Completed (This Month)</p>
            <p className="text-2xl font-bold text-slate-800">28</p>
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search orders by ID or title..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('production')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'production' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Hammer size={14} />
            Production
          </button>
          <button 
            onClick={() => setActiveTab('service')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'service' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Wrench size={14} />
            Service
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 group">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Status & Icon */}
              <div className="flex items-start gap-4 min-w-[200px]">
                <div className={`p-3 rounded-lg ${order.type === 'production' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {order.type === 'production' ? <Hammer size={24} /> : <Wrench size={24} />}
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-500 mb-1">{order.id}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Middle: Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">{order.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Assignee:</span>
                    <span className="font-medium">{order.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="font-medium">{order.dueDate}</span>
                  </div>
                </div>

                {/* Material Usage Preview */}
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <Package size={12} />
                    Material & Items
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className={`px-2 py-1 rounded border text-xs ${
                        item.type === 'output' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        item.type === 'consumable' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                        'bg-white border-slate-200 text-slate-600'
                      }`}>
                        {item.name} <span className="font-bold ml-1">x{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Actions & Progress */}
              <div className="flex flex-col items-end justify-between min-w-[150px] border-l border-slate-100 pl-6">
                <div className="w-full mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-slate-700">{order.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        order.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${order.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="btn btn-secondary w-full flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                  View Details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper Icon
const Package = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22v-10" />
  </svg>
)

export default WorkOrdersPage
