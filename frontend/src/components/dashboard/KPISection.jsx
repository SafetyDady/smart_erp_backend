import React from 'react'
import RoleGuard from '../guards/RoleGuard.jsx'
import LoadingState from '../common/LoadingState.jsx'

const KPISection = ({ 
  userRole, 
  kpiData = {},
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingState variant="card" count={4} isLoading={true} />
        </div>
      </div>
    )
  }

  const KPICard = ({ title, value, trend, unit = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">
        {value ? `${value}${unit}` : '—'}
      </div>
      {trend && (
        <div className={`text-sm mt-1 ${
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  )

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue Card - Owner + Manager */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewRevenue']}
        >
          <KPICard 
            title="Total Revenue"
            value={kpiData.revenue?.value}
            trend={kpiData.revenue?.trend}
            unit="$"
          />
        </RoleGuard>

        {/* Profit Card - Owner Only */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewProfit']}
        >
          <KPICard 
            title="Net Profit"
            value={kpiData.profit?.value}
            trend={kpiData.profit?.trend}
            unit="$"
          />
        </RoleGuard>

        {/* Orders Card - All Roles */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewOrders']}
        >
          <KPICard 
            title="Active Orders"
            value={kpiData.orders?.value}
            trend={kpiData.orders?.trend}
          />
        </RoleGuard>

        {/* Customers Card - Owner + Manager */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewCustomers']}
        >
          <KPICard 
            title="New Customers"
            value={kpiData.customers?.value}
            trend={kpiData.customers?.trend}
          />
        </RoleGuard>

      </div>
    </div>
  )
}

export default KPISection