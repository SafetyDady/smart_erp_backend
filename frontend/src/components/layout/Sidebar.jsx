import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Settings,
  X,
  ChevronLeft,
  Menu,
  LogOut
} from 'lucide-react'
import RoleGuard from '../guards/RoleGuard'

/**
 * Sidebar - Glassmorphic navigation sidebar
 * Enterprise-grade glass surface with consistent tokens
 */
const Sidebar = ({ 
  userRole, 
  currentPage = 'dashboard',
  menuItems = [],
  isOpen, 
  onClose, 
  onNavigate = () => {},
  isCollapsed = false 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  // Default navigation items if none provided
  const defaultNavigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'customers',
      name: 'Customers', 
      icon: Users,
      href: '/customers',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      href: '/products',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'orders',
      name: 'Orders',
      icon: ShoppingCart,
      href: '/orders', 
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: DollarSign,
      href: '/financial',
      roles: ['owner', 'manager']
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      href: '/settings',
      roles: ['owner']
    }
  ]

  const navigationItems = menuItems.length > 0 ? menuItems : defaultNavigationItems
  const effectiveCollapsed = isCollapsed || sidebarCollapsed

  const sidebarClasses = `
    ${effectiveCollapsed ? 'w-20' : 'w-64'} 
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 
    fixed inset-y-0 left-0 z-30 bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm transition-all duration-300 ease-in-out
    flex flex-col rounded-r-2xl
  `

  const handleItemClick = (item) => {
    onNavigate(item.id, item.href)
    if (onClose) {
      onClose()
    }
  }

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className={sidebarClasses}>
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-white/20 px-4">
          <div className={`font-bold text-xl tracking-wider flex items-center ${effectiveCollapsed && 'justify-center'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {!effectiveCollapsed && <span className="text-slate-800">Smart ERP</span>}
          </div>
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-slate-500 hover:text-slate-700 rounded-md p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <RoleGuard key={item.id} allowedRoles={item.roles} userRole={userRole}>
                <div className="relative group">
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      flex items-center w-full p-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}
                      ${effectiveCollapsed && 'justify-center'}
                    `}
                  >
                    <item.icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    {!effectiveCollapsed && <span className="ml-3 font-medium text-sm">{item.name}</span>}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {effectiveCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.name}
                    </div>
                  )}
                </div>
              </RoleGuard>
            )
          })}
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-white/20">
          <div className={`flex items-center ${effectiveCollapsed && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              U
            </div>
            {!effectiveCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-slate-800 truncate">User Name</p>
                <p className="text-xs text-slate-500 truncate capitalize">{userRole}</p>
              </div>
            )}
          </div>
          {!effectiveCollapsed && (
            <button className="mt-4 w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-colors">
              <LogOut size={14} className="mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Desktop only */}
      <button 
        onClick={toggleCollapse}
        className="hidden lg:block absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors z-50"
      >
        {effectiveCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  )
}

export default Sidebar
