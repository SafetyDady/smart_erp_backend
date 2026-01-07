import React from 'react'
import { RoleProvider, useRole } from './components/guards/RoleContext'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import ToolsPage from './pages/ToolsPage'
import CustomersPage from './pages/CustomersPage'
import FinancialPage from './pages/FinancialPage'
import HRPage from './pages/HRPage'

/**
 * App - Root application component
 * Provides role context and main application layout
 */
function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  )
}

/**
 * AppContent - Inner app component with role context access
 */
function AppContent() {
  const { userRole } = useRole()
  const [currentPage, setCurrentPage] = React.useState('dashboard')
  const [userName] = React.useState('John Doe')
  const [notifications] = React.useState([
    { id: 1, message: 'New order received' },
    { id: 2, message: 'Weekly report ready' }
  ])

  // Simple state-based routing
  const handleNavigate = (pageId) => {
    console.log(`Navigate to: ${pageId}`)
    setCurrentPage(pageId)
  }

  const handleRoleChange = (newRole) => {
    console.log(`App: Role changed to ${newRole}`)
    // Additional role change handling if needed
  }

  // Render current page content
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'products':
        return <ProductsPage />
      case 'orders':
        return <OrdersPage />
      case 'work-orders':
        return <WorkOrdersPage />
      case 'tools':
        return <ToolsPage />
      case 'customers':
        return <CustomersPage />
      case 'financial':
        return <FinancialPage />
      case 'hr':
        return <HRPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <AppLayout
      userRole={userRole}
      currentPage={currentPage}
      userName={userName}
      notifications={notifications}
      onNavigate={handleNavigate}
      onRoleChange={handleRoleChange}
    >
      {renderContent()}
    </AppLayout>
  )
}

export default App
