import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, Building, User } from 'lucide-react'
import { useRole } from '../components/guards/RoleContext'
import { shapeCustomersByRole } from '../services/customers/shapeCustomersByRole'
import LoadingState from '../components/common/LoadingState'

// Mock Data
const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    status: 'active',
    lastOrderDate: '2024-01-07',
    totalSpent: 12500.00,
    averageOrderValue: 2500.00,
    profitGenerated: 4500.00,
    creditLimit: 20000.00,
    tags: ['VIP', 'Corporate'],
    notes: 'Key account, prefers email communication.'
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@designstudio.io',
    phone: '+1 (555) 987-6543',
    company: 'Design Studio',
    status: 'active',
    lastOrderDate: '2024-01-05',
    totalSpent: 5400.00,
    averageOrderValue: 1800.00,
    profitGenerated: 2100.00,
    creditLimit: 10000.00,
    tags: ['Regular'],
    notes: 'Usually orders on Fridays.'
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@globalinc.com',
    phone: '+1 (555) 456-7890',
    company: 'Global Inc',
    status: 'inactive',
    lastOrderDate: '2023-11-20',
    totalSpent: 850.00,
    averageOrderValue: 425.00,
    profitGenerated: 300.00,
    creditLimit: 5000.00,
    tags: ['At Risk'],
    notes: 'Has not ordered in 2 months.'
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@startup.co',
    phone: '+1 (555) 234-5678',
    company: 'StartUp Ltd',
    status: 'active',
    lastOrderDate: '2024-01-02',
    totalSpent: 3200.00,
    averageOrderValue: 800.00,
    profitGenerated: 1200.00,
    creditLimit: 8000.00,
    tags: ['New'],
    notes: 'Growing fast, potential for upsell.'
  },
  {
    id: 5,
    name: 'Eva Green',
    email: 'eva@freelance.net',
    phone: '+1 (555) 876-5432',
    company: 'Freelancer',
    status: 'active',
    lastOrderDate: '2024-01-06',
    totalSpent: 1500.00,
    averageOrderValue: 300.00,
    profitGenerated: 600.00,
    creditLimit: 2000.00,
    tags: ['Individual'],
    notes: 'Pays via credit card immediately.'
  }
]

const CustomersPage = () => {
  const { userRole } = useRole()
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        const shapedData = shapeCustomersByRole(MOCK_CUSTOMERS, userRole)
        setCustomers(shapedData)
      } catch (error) {
        console.error("Failed to load customers", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [userRole])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="title" count={1} />
        <LoadingState variant="table" count={5} />
      </div>
    )
  }

  // Access Denied State for Staff
  if (customers.length === 0 && userRole === 'staff') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <User size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Access Restricted</h2>
        <p className="mt-2 text-slate-500 max-w-md">
          You do not have permission to view customer data. Please contact your administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer relationships and profiles.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search customers by name, email, or company..." 
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
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                {/* Financial Columns - Hidden for Staff/Manager(Partial) */}
                {customers[0]?.totalSpent !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Building size={12} />
                          {customer.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        customer.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-1">
                        {customer.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Financial Cell */}
                  {customer.totalSpent !== undefined && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">${customer.totalSpent.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Avg: ${customer.averageOrderValue.toLocaleString()}</div>
                    </td>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(customer.lastOrderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50">
                      <MoreHorizontal size={18} />
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

export default CustomersPage
