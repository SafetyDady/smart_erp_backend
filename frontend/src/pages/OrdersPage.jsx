import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, MoreHorizontal, Calendar, User } from 'lucide-react'
import { useAuth } from '../components/guards/AuthContext'
import { shapeOrdersByRole } from '../services/orders/shapeOrdersByRole'
import LoadingState from '../components/common/LoadingState'

// Mock Data
const MOCK_ORDERS = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    date: '2024-01-07',
    customer: 'Tech Corp',
    status: 'completed',
    paymentStatus: 'paid',
    totalAmount: 1200.00,
    cost: 800.00,
    profit: 400.00,
    margin: 33.3,
    assignedTo: 'user123', // Assigned to current staff
    priority: 'normal',
    items: [
      { name: 'Ergonomic Chair', quantity: 2, sku: 'FUR-CHR-001', price: 250 },
      { name: 'Monitor Stand', quantity: 5, sku: 'FUR-ACC-002', price: 140 }
    ]
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    date: '2024-01-07',
    customer: 'Design Studio',
    status: 'processing',
    paymentStatus: 'partial',
    totalAmount: 3500.00,
    cost: 2100.00,
    profit: 1400.00,
    margin: 40.0,
    assignedTo: 'user123', // Assigned to current staff
    priority: 'high',
    items: [
      { name: 'Workstation PC', quantity: 1, sku: 'ELE-PC-001', price: 3500 }
    ]
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    date: '2024-01-06',
    customer: 'Global Inc',
    status: 'pending',
    paymentStatus: 'unpaid',
    totalAmount: 850.00,
    cost: 500.00,
    profit: 350.00,
    margin: 41.1,
    assignedTo: 'other_staff', // NOT assigned to current staff
    priority: 'normal',
    items: [
      { name: 'Office Supplies', quantity: 10, sku: 'SUP-GEN-001', price: 85 }
    ]
  },
  {
    id: 4,
    orderNumber: 'ORD-2024-004',
    date: '2024-01-05',
    customer: 'StartUp Ltd',
    status: 'cancelled',
    paymentStatus: 'refunded',
    totalAmount: 120.00,
    cost: 60.00,
    profit: 60.00,
    margin: 50.0,
    assignedTo: 'manager',
    priority: 'low',
    items: [
      { name: 'Mouse Pad', quantity: 10, sku: 'ACC-MSE-001', price: 12 }
    ]
  },
  {
    id: 5,
    orderNumber: 'ORD-2024-005',
    date: '2024-01-05',
    customer: 'Freelancer John',
    status: 'completed',
    paymentStatus: 'paid',
    totalAmount: 299.00,
    cost: 150.00,
    profit: 149.00,
    margin: 49.8,
    assignedTo: 'user123', // Assigned to current staff
    priority: 'normal',
    items: [
      { name: 'Headphones', quantity: 1, sku: 'ELE-AUD-005', price: 299 }
    ]
  }
]

const OrdersPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        // Simulate logged in user ID 'user123'
        const shapedData = shapeOrdersByRole(MOCK_ORDERS, userRole, 'user123')
        setOrders(shapedData)
      } catch (error) {
        console.error("Failed to load orders", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [userRole])

  const getStatusStyle = (status) => {
    const styles = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      processing: 'bg-blue-50 text-blue-700 border-blue-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      cancelled: 'bg-slate-50 text-slate-600 border-slate-100'
    }
    return styles[status.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getPaymentStyle = (status) => {
    const styles = {
      paid: 'bg-emerald-50 text-emerald-700',
      unpaid: 'bg-red-50 text-red-700',
      partial: 'bg-amber-50 text-amber-700',
      refunded: 'bg-slate-50 text-slate-600'
    }
    return styles[status.toLowerCase()] || 'bg-slate-50 text-slate-600'
  }

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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer orders and fulfillment.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search orders by number or customer..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                {/* Amount Column - Hidden for Staff */}
                {orders[0]?.totalAmount !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{order.orderNumber}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.itemsCount} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {order.customer.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-900">{order.customer}</span>
                      </div>
                    </td>
                    
                    {/* Amount Cell - Hidden for Staff */}
                    {order.totalAmount !== undefined && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono font-medium">
                        ${order.totalAmount.toLocaleString()}
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPaymentStyle(order.paymentStatus)}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage
