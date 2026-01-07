import React, { useState } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  DollarSign
} from 'lucide-react'
import { useRole } from '../components/guards/RoleContext'

// Mock Data for Purchase Orders
const MOCK_PURCHASE_ORDERS = [
  {
    id: 'PO-2024-001',
    supplier: 'Wood Works Co.',
    date: '2024-03-15',
    expectedDelivery: '2024-03-20',
    status: 'pending', // pending, ordered, partial, received, cancelled
    totalAmount: 45000.00,
    items: [
      { name: 'Oak Wood Plank (2m)', quantity: 100, unitPrice: 450.00 }
    ],
    requestedBy: 'Production Manager'
  },
  {
    id: 'PO-2024-002',
    supplier: 'Metal Supply Inc.',
    date: '2024-03-10',
    expectedDelivery: '2024-03-12',
    status: 'received',
    totalAmount: 15500.00,
    items: [
      { name: 'Steel Frame Tube', quantity: 1000, unitPrice: 15.50 }
    ],
    requestedBy: 'Production Manager'
  },
  {
    id: 'PO-2024-003',
    supplier: 'Tool Master',
    date: '2024-03-18',
    expectedDelivery: '2024-03-25',
    status: 'ordered',
    totalAmount: 8500.00,
    items: [
      { name: 'Drill Bit Set (Titanium)', quantity: 10, unitPrice: 850.00 }
    ],
    requestedBy: 'Site Supervisor'
  },
  {
    id: 'PO-2024-004',
    supplier: 'Office Comfort Co.',
    date: '2024-03-01',
    expectedDelivery: '2024-03-05',
    status: 'received',
    totalAmount: 120000.00,
    items: [
      { name: 'Ergonomic Office Chair', quantity: 50, unitPrice: 2400.00 }
    ],
    requestedBy: 'Owner'
  }
]

const PurchasingPage = () => {
  const { userRole } = useRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredPOs = MOCK_PURCHASE_ORDERS.filter(po => {
    const matchesSearch = po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          po.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} className="mr-1"/> Received</span>
      case 'ordered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><Truck size={12} className="mr-1"/> Ordered</span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12} className="mr-1"/> Pending Approval</span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><AlertCircle size={12} className="mr-1"/> Cancelled</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">Unknown</span>
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Purchasing</h1>
          <p className="mt-1 text-sm text-slate-500">Manage purchase orders and supplier procurement.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create PO
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-amber-600">1</div>
          <div className="text-xs text-slate-400 mt-1">Requires attention</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Open Orders</div>
          <div className="text-2xl font-bold text-blue-600">1</div>
          <div className="text-xs text-slate-400 mt-1">Waiting for delivery</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Received (Month)</div>
          <div className="text-2xl font-bold text-emerald-600">2</div>
          <div className="text-xs text-slate-400 mt-1">Completed orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Total Spend (Month)</div>
          <div className="text-2xl font-bold text-slate-800">฿135,500</div>
          <div className="text-xs text-slate-400 mt-1">Based on received POs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by PO number or supplier..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['all', 'pending', 'ordered', 'received'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${statusFilter === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-blue-600">{po.id}</span>
                    </div>
                    <div className="text-xs text-slate-500 ml-6">{po.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{po.supplier}</div>
                    <div className="text-xs text-slate-500">Req: {po.requestedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(po.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {po.expectedDelivery}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {po.items[0].name}
                      {po.items.length > 1 && <span className="text-xs text-slate-400 ml-1">+{po.items.length - 1} more</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {po.items[0].quantity} units
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-slate-800">฿{po.totalAmount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
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

export default PurchasingPage
