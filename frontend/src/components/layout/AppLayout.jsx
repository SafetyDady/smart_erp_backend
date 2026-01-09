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
  onLogout = () => {}
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  // We need to track sidebar collapsed state here to adjust main content margin
  // In a real app, this might be lifted up or managed via context
  // For now, we'll assume the sidebar manages its own state but we use CSS variables for layout
  
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
        onLogout={onLogout}
      />

      {/* Main content column */}
      {/* Use peer-checked or similar technique if we want pure CSS collapse, 
          but here we rely on the sidebar being fixed width and main content having margin.
          The Sidebar component uses w-[var(--sidebar-width)] by default.
          We need to match that margin here.
      */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[var(--sidebar-width)] transition-all duration-300 ease-in-out">
        {/* TopBar - Inside main column, sticky top */}
        <TopBar 
          userRole={userRole}
          userName={userName}
          notifications={notifications}
          onMenuClick={handleMenuClick}
          onLogout={onLogout}
        />
          
        {/* Page content - Scrollable area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
