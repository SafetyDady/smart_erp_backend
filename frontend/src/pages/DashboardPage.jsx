import React from 'react'
import ErrorBoundary from '../components/common/ErrorBoundary'
import LoadingState from '../components/common/LoadingState'
import KPISection from '../components/dashboard/KPISection'
import ChartsSection from '../components/dashboard/ChartsSection'
import TransactionSection from '../components/dashboard/TransactionSection'
import { useRole } from '../components/guards/RoleContext'

/**
 * DashboardPage - Main dashboard page component
 * Orchestrates dashboard sections without layout wrapper
 * Uses role context for data filtering
 */
const DashboardPage = () => {
  const { userRole } = useRole()
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your business metrics and recent activity.
        </p>
        <p className="mt-1 text-xs text-blue-600">
          Current role: {userRole}
        </p>
      </div>

      {/* KPI Cards Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load KPI metrics: {error.message}</p>
        </div>
      )}>
        <KPISection />
      </ErrorBoundary>

      {/* Charts Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load charts: {error.message}</p>
        </div>
      )}>
        <ChartsSection />
      </ErrorBoundary>

      {/* Transactions Section */}
      <ErrorBoundary fallback={(error) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load transactions: {error.message}</p>
        </div>
      )}>
        <TransactionSection />
      </ErrorBoundary>
    </div>
  )
}

export default DashboardPage
