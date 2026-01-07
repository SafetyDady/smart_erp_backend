import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, User, Briefcase, Users } from 'lucide-react'
import { useRole } from '../components/guards/RoleContext'
import { shapeEmployeesByRole } from '../services/hr/shapeEmployeesByRole'
import LoadingState from '../components/common/LoadingState'

// Mock Data
const MOCK_EMPLOYEES = [
  {
    id: 1,
    name: 'John Doe',
    role: 'Staff',
    department: 'Sales',
    email: 'john@smarterp.com',
    phone: '+1 (555) 001-0001',
    status: 'active',
    joinDate: '2023-01-15',
    salary: 45000,
    performanceRating: 4.5,
    bankAccount: 'XXX-XXXX-1234',
    notes: 'Top performer in Q4.'
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'Manager',
    department: 'Operations',
    email: 'jane@smarterp.com',
    phone: '+1 (555) 002-0002',
    status: 'active',
    joinDate: '2022-06-01',
    salary: 75000,
    performanceRating: 4.8,
    bankAccount: 'XXX-XXXX-5678',
    notes: 'Excellent leadership skills.'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    role: 'Staff',
    department: 'Inventory',
    email: 'mike@smarterp.com',
    phone: '+1 (555) 003-0003',
    status: 'on_leave',
    joinDate: '2023-03-10',
    salary: 42000,
    performanceRating: 3.8,
    bankAccount: 'XXX-XXXX-9012',
    notes: 'Currently on sick leave.'
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    role: 'Staff',
    department: 'Customer Support',
    email: 'sarah@smarterp.com',
    phone: '+1 (555) 004-0004',
    status: 'active',
    joinDate: '2023-08-20',
    salary: 40000,
    performanceRating: 4.2,
    bankAccount: 'XXX-XXXX-3456',
    notes: 'Great customer feedback.'
  },
  {
    id: 5,
    name: 'David Lee',
    role: 'Staff',
    department: 'IT',
    email: 'david@smarterp.com',
    phone: '+1 (555) 005-0005',
    status: 'probation',
    joinDate: '2024-01-02',
    salary: 50000,
    performanceRating: 0.0, // New hire
    bankAccount: 'XXX-XXXX-7890',
    notes: 'New hire, needs onboarding.'
  }
]

const HRPage = () => {
  const { userRole } = useRole()
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        const shapedData = shapeEmployeesByRole(MOCK_EMPLOYEES, userRole)
        setEmployees(shapedData)
      } catch (error) {
        console.error("Failed to load employees", error)
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
  if (employees.length === 0 && userRole === 'staff') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Users size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Access Restricted</h2>
        <p className="mt-2 text-slate-500 max-w-md">
          You do not have permission to view HR data. Please contact your administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Human Resources</h1>
          <p className="mt-1 text-sm text-slate-500">Manage employee records and departments.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search employees by name, role, or department..." 
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
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role & Dept
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                {/* Salary Column - Hidden for Manager/Staff */}
                {employees[0]?.salary !== undefined && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Salary
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{employee.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={12} />
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                        <User size={14} className="text-slate-400" />
                        {employee.role}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Briefcase size={12} className="text-slate-400" />
                        {employee.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      employee.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : employee.status === 'on_leave'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {employee.status === 'active' ? 'Active' : employee.status === 'on_leave' ? 'On Leave' : 'Probation'}
                    </span>
                  </td>

                  {/* Salary Cell */}
                  {employee.salary !== undefined && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">${employee.salary.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">/ year</div>
                    </td>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(employee.joinDate).toLocaleDateString()}
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

export default HRPage
