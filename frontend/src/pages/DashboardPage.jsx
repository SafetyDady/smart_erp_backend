import React from 'react'
import ErrorBoundary from '../components/common/ErrorBoundary'
import LoadingState from '../components/common/LoadingState'
import KPISection from '../components/dashboard/KPISection'
import ChartsSection from '../components/dashboard/ChartsSection'
import TransactionSection from '../components/dashboard/TransactionSection'
import LowStockWidget from '../components/dashboard/LowStockWidget'
import { useAuth } from '../components/guards/AuthContext'
import { shapeKpisByRole } from '../services/dashboard/shapeKpisByRole'
import { shapeChartsByRole } from '../services/dashboard/shapeChartsByRole'
import { shapeTransactionsByRole } from '../services/dashboard/shapeTransactionsByRole'

/**
 * Mock Data for Dashboard
 * In a real app, this would come from an API call
 */
const MOCK_RAW_DATA = {
  kpi: {
    revenue: {
      value: '124,500',
      trend: 12.5,
      breakdown: { product: 60, service: 40 },
      projection: '150,000'
    },
    profit: {
      value: '45,200',
      trend: 8.2,
      margin: 36.3,
      ytdComparison: 15.4
    },
    orders: {
      totalCount: 156,
      totalTrend: 5.4,
      totalValue: '85,000',
      assignedCount: 12, // For Staff
      assignedTrend: -2.5, // For Staff
      priorityAssigned: 'High'
    },
    customers: {
      newCount: 24,
      growthTrend: 18.2,
      totalActive: 1250,
      retentionRate: 94.5
    }
  },
  charts: {
    salesRevenue: {
      data: [
        { date: 'Jan', revenue: 4000, profit: 2400 },
        { date: 'Feb', revenue: 3000, profit: 1398 },
        { date: 'Mar', revenue: 2000, profit: 9800 },
        { date: 'Apr', revenue: 2780, profit: 3908 },
        { date: 'May', revenue: 1890, profit: 4800 },
        { date: 'Jun', revenue: 2390, profit: 3800 },
        { date: 'Jul', revenue: 3490, profit: 4300 },
      ],
      metadata: { lastUpdated: '2024-07-01' }
    },
    inventory: {
      data: [
        { category: 'Electronics', count: 120, value: 50000, status: 'normal' },
        { category: 'Furniture', count: 80, value: 30000, status: 'low' },
        { category: 'Clothing', count: 250, value: 15000, status: 'normal' },
        { category: 'Food', count: 50, value: 5000, status: 'critical' },
        { category: 'Toys', count: 100, value: 10000, status: 'normal' },
      ]
    }
  },
  transactions: [
    { id: 1, date: '2024-01-07', type: 'Sale', customer: 'Tech Corp', amount: 1200, status: 'completed', assignedTo: 'user123', priority: 'normal' },
    { id: 2, date: '2024-01-07', type: 'Purchase', supplier: 'Office Supplies Co', amount: 450, status: 'pending', assignedTo: 'user123', priority: 'high' },
    { id: 3, date: '2024-01-06', type: 'Sale', customer: 'Design Studio', amount: 850, status: 'processing', assignedTo: 'other', priority: 'normal' },
    { id: 4, date: '2024-01-06', type: 'Expense', supplier: 'Utility Co', amount: 200, status: 'completed', assignedTo: 'manager', priority: 'low' },
    { id: 5, date: '2024-01-05', type: 'Sale', customer: 'Global Inc', amount: 3500, status: 'completed', assignedTo: 'user123', priority: 'high' },
    { id: 6, date: '2024-01-05', type: 'Return', customer: 'Local Shop', amount: 120, status: 'cancelled', assignedTo: 'other', priority: 'normal' },
    { id: 7, date: '2024-01-04', type: 'Sale', customer: 'StartUp Ltd', amount: 900, status: 'completed', assignedTo: 'user123', priority: 'normal' },
    { id: 8, date: '2024-01-04', type: 'Purchase', supplier: 'Raw Materials Inc', amount: 5000, status: 'pending', assignedTo: 'manager', priority: 'high' },
  ]
}

// Mock User ID for Staff role testing
const MOCK_USER_ID = 'user123'

/**
 * DashboardPage - Main dashboard page component
 * Orchestrates dashboard sections without layout wrapper
 * Uses role context for data filtering
 */
const DashboardPage = () => {
  const { user } = useAuth()
  const userRole = user?.role || 'staff'
  const [isLoading, setIsLoading] = React.useState(true)
  const [dashboardData, setDashboardData] = React.useState({ kpi: {}, charts: {}, transactions: [] })

  React.useEffect(() => {
    // Simulate data loading and shaping
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Shape data based on role
        const shapedKpis = shapeKpisByRole(MOCK_RAW_DATA.kpi, userRole)
        const shapedCharts = shapeChartsByRole(MOCK_RAW_DATA.charts, userRole)
        const shapedTransactions = shapeTransactionsByRole(MOCK_RAW_DATA.transactions, userRole, MOCK_USER_ID)
        
        setDashboardData({
          kpi: shapedKpis,
          charts: shapedCharts,
          transactions: shapedTransactions
        })
      } catch (error) {
        console.error("Failed to load dashboard data", error)
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
        <LoadingState variant="card" count={4} />
        <LoadingState variant="chart" count={2} />
        <LoadingState variant="table" count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your business metrics and recent activity.
        </p>
      </div>

      {/* KPI Cards Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load KPI metrics: {error.message}</p>
        </div>
      )}>
        <KPISection 
          userRole={userRole} 
          kpiData={dashboardData.kpi} 
        />
      </ErrorBoundary>

      {/* Charts Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load charts: {error.message}</p>
        </div>
      )}>
        <ChartsSection 
          userRole={userRole}
          chartsData={dashboardData.charts}
        />
      </ErrorBoundary>

      {/* Low Stock Alert Widget */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load low stock alerts: {error.message}</p>
        </div>
      )}>
        <LowStockWidget />
      </ErrorBoundary>

      {/* Transactions Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load transactions: {error.message}</p>
        </div>
      )}>
        <TransactionSection 
          userRole={userRole}
          transactions={dashboardData.transactions}
        />
      </ErrorBoundary>
    </div>
  )
}

export default DashboardPage
