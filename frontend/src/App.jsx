import React from 'react'
import { AuthProvider, useAuth } from './components/guards/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import ToolsPage from './pages/ToolsPage'
import PurchasingPage from './pages/PurchasingPage'
import CustomersPage from './pages/CustomersPage'
import FinancialPage from './pages/FinancialPage'
import HRPage from './pages/HRPage'
import StockMovementPage from './pages/StockMovementPage'
import WarehousesPage from './pages/WarehousesPage'
import CostCentersPage from './pages/CostCentersPage'
import CostElementsPage from './pages/CostElementsPage'

/**
 * App - Root application component
 * Provides auth and role context
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

/**
 * AppContent - Inner app component with auth and role context access
 */
function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()
  const [currentPage, setCurrentPage] = React.useState('dashboard')
  const [notifications] = React.useState([
    { id: 1, message: 'New order received' },
    { id: 2, message: 'Weekly report ready' }
  ])

  // Get actual user role from authenticated user
  const actualUserRole = user?.role || 'staff'

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {
      // Force refresh authentication state
      window.location.reload()
    }} />
  }

  // Simple state-based routing
  const handleNavigate = (pageId) => {
    console.log('Navigate to: ' + pageId)
    setCurrentPage(pageId)
  }

  const handleLogout = () => {
    console.log('App: handleLogout called')
    logout()
    // Force immediate redirect to login
    setCurrentPage('login')
  }

  // Render current page content
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'products':
        return <ProductsPage />
      case 'stock-movement':
        return <StockMovementPage />
      case 'warehouses':
        return <WarehousesPage />
      case 'orders':
        return <OrdersPage />
      case 'work-orders':
        return <WorkOrdersPage />
      case 'tools':
        return <ToolsPage />
      case 'purchasing':
        return <PurchasingPage />
      case 'customers':
        return <CustomersPage />
      case 'financial':
        return <FinancialPage />
      case 'hr':
        return <HRPage />
      case 'cost-centers':
        return <CostCentersPage />
      case 'cost-elements':
        return <CostElementsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <AppLayout
      userRole={actualUserRole}
      currentPage={currentPage}
      userName={user?.name || 'Unknown User'}
      notifications={notifications}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppLayout>
  )
}

export default App
