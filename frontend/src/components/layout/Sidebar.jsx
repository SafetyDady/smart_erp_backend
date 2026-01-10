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
  LogOut,
  ClipboardList,
  Wrench,
  Truck,
  ArrowUpDown,
  Building2
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
  onLogout = () => {},
  isCollapsed = false 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const handleLogout = () => {
    console.log('Sidebar: Sign out button clicked')
    try {
      onLogout()
      console.log('Sidebar: onLogout called successfully')
    } catch (error) {
      console.error('Sidebar: Error during logout:', error)
    }
  }

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
      id: 'stock-movement',
      name: 'Stock Movement',
      icon: ArrowUpDown,
      href: '/stock-movement',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'warehouses',
      name: 'Warehouses',
      icon: Building2,
      href: '/warehouses',
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
      id: 'work-orders',
      name: 'Work Orders',
      icon: ClipboardList,
      href: '/work-orders',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'tools',
      name: 'Tools Room',
      icon: Wrench,
      href: '/tools',
      roles: ['owner', 'manager', 'staff']
    },
    {
      id: 'purchasing',
      name: 'Purchasing',
      icon: Truck,
      href: '/purchasing',
      roles: ['owner', 'manager']
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: DollarSign,
      href: '/financial',
      roles: ['owner', 'manager']
    },
    {
      id: 'hr',
      name: 'HR',
      icon: Users,
      href: '/hr',
      roles: ['owner', 'manager']
    },
    {
      id: 'cost-centers',
      name: 'Cost Centers',
      icon: Settings,
      href: '/cost-centers',
      roles: ['owner', 'manager', 'staff'],
      category: 'Settings'
    },
    {
      id: 'cost-elements', 
      name: 'Cost Elements',
      icon: Settings,
      href: '/cost-elements',
      roles: ['owner', 'manager', 'staff'],
      category: 'Settings'
    }
  ]

  const navigationItems = menuItems.length > 0 ? menuItems : defaultNavigationItems
  const effectiveCollapsed = isCollapsed || sidebarCollapsed

  // Using CSS variables for width to ensure consistency with AppLayout
  const sidebarWidthClass = effectiveCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'

  const sidebarClasses = `
    ${sidebarWidthClass}
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 
    fixed inset-y-0 left-0 z-30 
    glass
    transition-all duration-300 ease-in-out
    flex flex-col
    border-r border-white/20
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
        <div className="h-[var(--topbar-height)] flex items-center justify-center border-b border-white/10 px-4">
          <div className={`font-bold text-xl tracking-wider flex items-center ${effectiveCollapsed && 'justify-center'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 shadow-lg shadow-blue-500/30">
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
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-thin">
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
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}
                      ${effectiveCollapsed && 'justify-center'}
                    `}
                  >
                    <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} />
                    {!effectiveCollapsed && <span className="ml-3 font-medium text-sm">{item.name}</span>}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {effectiveCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-xl">
                      {item.name}
                      {/* Arrow */}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                    </div>
                  )}
                </div>
              </RoleGuard>
            )
          })}
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-white/10 bg-white/30 backdrop-blur-sm">
          <div className={`flex items-center ${effectiveCollapsed && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/50">
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
            <button 
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut size={14} className="mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Desktop only */}
      <button 
        onClick={toggleCollapse}
        className="hidden lg:flex absolute -right-3 top-24 bg-white text-slate-600 border border-slate-200 p-1.5 rounded-full shadow-md hover:text-blue-600 hover:border-blue-200 transition-all z-50 items-center justify-center w-7 h-7"
      >
        {effectiveCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  )
}

export default Sidebar
