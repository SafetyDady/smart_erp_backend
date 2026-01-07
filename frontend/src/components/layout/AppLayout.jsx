import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

/**
 * AppLayout - Glassmorphic layout shell
 * Implements proper layout hierarchy: left sidebar + right main column
 * Ensures zero overlap and consistent spacing
 */
const AppLayout = ({ 
  userRole,
  currentPage = 'dashboard',
  menuItems = [],
  userName = 'John Doe',
  notifications = [],
  children,
  onNavigate = () => {},
  onRoleChange = null
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={handleSidebarClose}
        />
      )}

      {/* Sidebar - Fixed left panel */}
      <Sidebar 
        userRole={userRole}
        currentPage={currentPage}
        menuItems={menuItems}
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose}
        onNavigate={onNavigate}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* TopBar - Inside main column, sticky top */}
        <div className="p-6">
          <TopBar 
            userRole={userRole}
            userName={userName}
            notifications={notifications}
            onMenuClick={handleMenuClick}
            onRoleChange={onRoleChange}
          />
          
          {/* Page content - Scrollable area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
