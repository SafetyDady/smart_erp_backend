import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingState variant="chart" count={2} isLoading={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Revenue Chart - Owner + Manager */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewSalesChart']}
        >
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium mb-4">Sales Revenue Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData.salesRevenue?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </RoleGuard>

        {/* Inventory Chart - All Roles */}
        <RoleGuard 
          userRole={userRole} 
          requiredPermissions={['canViewInventoryChart']}
        >
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium mb-4">Inventory Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.inventory?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </RoleGuard>

      </div>
    </div>
  )
}

export default ChartsSection