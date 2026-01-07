import React from 'react'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import RoleGuard from '../guards/RoleGuard.jsx'
import LoadingState from '../common/LoadingState.jsx'

const ChartsSection = ({ 
  userRole, 
  chartsData = {},
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingState variant="chart" count={2} isLoading={true} />
        </div>
      </div>
    )
  }

  // Custom Tooltip for Glassmorphic feel
  const CustomTooltip = ({ active, payload, label, valuePrefix = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{valuePrefix}{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Color logic for inventory bars
  const getBarColor = (status) => {
    switch (status) {
      case 'critical': return '#ef4444' // red-500
      case 'low': return '#f59e0b'      // amber-500
      default: return '#3b82f6'         // blue-500
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Sales Revenue Chart - Owner + Manager */}
      <RoleGuard 
        userRole={userRole} 
        requiredPermissions={['canViewSalesChart']}
      >
        <div className="card h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Sales Revenue</h3>
              <p className="text-xs text-slate-500">Monthly revenue performance</p>
            </div>
            <div className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
              Last 7 Months
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.salesRevenue?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RoleGuard>

      {/* Inventory Chart - All Roles */}
      <RoleGuard 
        userRole={userRole} 
        requiredPermissions={['canViewInventoryChart']}
      >
        <div className="card h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Inventory Status</h3>
              <p className="text-xs text-slate-500">Stock levels by category</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Normal
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Low
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Critical
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.inventory?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Items" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartsData.inventory?.data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RoleGuard>

    </div>
  )
}

export default ChartsSection
