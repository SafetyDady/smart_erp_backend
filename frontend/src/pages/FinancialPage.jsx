import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, PieChart, Activity, Lock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useAuth } from '../components/guards/AuthContext'
import { shapeFinancialsByRole } from '../services/financial/shapeFinancialsByRole'
import LoadingState from '../components/common/LoadingState'

// Mock Data
const MOCK_FINANCIALS = {
  summary: {
    totalRevenue: 125000.00,
    totalExpenses: 85000.00,
    netProfit: 40000.00,
    profitMargin: 32.0,
    cashOnHand: 25000.00
  },
  monthlyPerformance: [
    { name: 'Jan', revenue: 12000, expenses: 8000, profit: 4000 },
    { name: 'Feb', revenue: 15000, expenses: 9000, profit: 6000 },
    { name: 'Mar', revenue: 18000, expenses: 10000, profit: 8000 },
    { name: 'Apr', revenue: 16000, expenses: 9500, profit: 6500 },
    { name: 'May', revenue: 21000, expenses: 12000, profit: 9000 },
    { name: 'Jun', revenue: 25000, expenses: 14000, profit: 11000 }
  ],
  expenseBreakdown: [
    { name: 'COGS', value: 45000, color: '#3b82f6' }, // Cost of Goods Sold
    { name: 'Salaries', value: 25000, color: '#8b5cf6' },
    { name: 'Marketing', value: 8000, color: '#f59e0b' },
    { name: 'Operations', value: 5000, color: '#10b981' },
    { name: 'Others', value: 2000, color: '#64748b' }
  ],
  recentTransactions: [
    { id: 1, date: '2024-01-07', description: 'Sales Revenue - Order #123', amount: 1200.00, type: 'income' },
    { id: 2, date: '2024-01-06', description: 'Office Rent Payment', amount: -2500.00, type: 'expense' },
    { id: 3, date: '2024-01-05', description: 'Supplier Payment - TechGear', amount: -1500.00, type: 'expense' },
    { id: 4, date: '2024-01-04', description: 'Sales Revenue - Order #120', amount: 3500.00, type: 'income' }
  ]
}

const FinancialPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const [isLoading, setIsLoading] = useState(true)
  const [financials, setFinancials] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 600))
        const shapedData = shapeFinancialsByRole(MOCK_FINANCIALS, userRole)
        setFinancials(shapedData)
      } catch (error) {
        console.error("Failed to load financials", error)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingState variant="card" count={3} />
        </div>
        <LoadingState variant="chart" count={1} />
      </div>
    )
  }

  // Access Denied State
  if (!financials) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Lock size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Access Restricted</h2>
        <p className="mt-2 text-slate-500 max-w-md">
          This module contains sensitive financial data and is restricted to business owners only.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Track your revenue, expenses, and profitability.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ${financials.summary.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600">
            <TrendingUp size={16} className="mr-1" />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Net Profit</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ${financials.summary.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Activity size={20} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-600">
            <span className="font-medium text-emerald-600">{financials.summary.profitMargin}%</span>
            <span className="ml-1">profit margin</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ${financials.summary.totalExpenses.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown size={20} className="text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600">
            <TrendingUp size={16} className="mr-1" />
            <span>+5.2% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financials.monthlyPerformance}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Expense Breakdown</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials.expenseBreakdown} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {financials.expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {financials.expenseBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialPage
