import React from 'react'
import { DollarSign, TrendingUp, Users, ShoppingCart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingState variant="card" count={4} isLoading={true} />
        </div>
      </div>
    )
  }

  const KPICard = ({ title, value, trend, unit = '', icon: Icon, colorClass = 'bg-blue-50 text-blue-600', subtext }) => {
    const isPositive = trend >= 0
    
    return (
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon size={20} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {unit}{value || '—'}
          </div>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
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
          icon={DollarSign}
          colorClass="bg-blue-50 text-blue-600"
          subtext={kpiData.revenue?.showDetailed ? "vs. last month" : "Limited view"}
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
          icon={TrendingUp}
          colorClass="bg-emerald-50 text-emerald-600"
          subtext={`Margin: ${kpiData.profit?.margin}%`}
        />
      </RoleGuard>

      {/* Orders Card - All Roles */}
      <RoleGuard 
        userRole={userRole} 
        requiredPermissions={['canViewOrders']}
      >
        <KPICard 
          title={kpiData.orders?.scope === 'assigned' ? "My Active Tasks" : "Active Orders"}
          value={kpiData.orders?.value}
          trend={kpiData.orders?.trend}
          icon={ShoppingCart}
          colorClass="bg-violet-50 text-violet-600"
          subtext={kpiData.orders?.scope === 'assigned' ? "Assigned to you" : "Total active orders"}
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
          icon={Users}
          colorClass="bg-amber-50 text-amber-600"
          subtext="This month"
        />
      </RoleGuard>

    </div>
  )
}

export default KPISection
