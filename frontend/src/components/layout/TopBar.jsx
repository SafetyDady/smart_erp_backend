import React from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import RoleGuard from '../guards/RoleGuard'
import { useRole } from '../guards/RoleContext'
import { ROLES } from '../../types/roles'

/**
 * DevRoleSelector - DEV ONLY component for testing roles
 * Uses role context to update app-wide role state
 */
const DevRoleSelector = ({ onRoleChange }) => {
  const { userRole, setUserRole } = useRole()

  const handleRoleChange = (newRole) => {
    setUserRole(newRole)
    
    // Call external callback if provided
    if (onRoleChange) {
      onRoleChange(newRole)
    }
    
    console.log(`DEV: Role changed to ${newRole}`)
  }

  return (
    <div className="text-xs">
      <label className="block text-slate-500 mb-1 font-medium sr-only">DEV ROLE:</label>
      <select
        value={userRole}
        onChange={(e) => handleRoleChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white/50 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      >
        <option value={ROLES.STAFF}>Staff</option>
        <option value={ROLES.MANAGER}>Manager</option>
        <option value={ROLES.OWNER}>Owner</option>
      </select>
    </div>
  )
}

/**
 * TopBar - Glassmorphic header inside main column
 * Implements enterprise-grade glass surface with consistent tokens
 */
const TopBar = ({ 
  userRole,
  userName = 'John Doe',
  notifications = [],
  onMenuClick,
  onRoleChange = null
}) => {
  return (
    <header className="h-[var(--topbar-height)] glass sticky top-0 z-20 flex items-center justify-between px-6 border-b border-white/20">
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md mr-4"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Glassmorphic Search Bar */}
        <div className="flex items-center bg-slate-100/50 hover:bg-white/80 transition-colors rounded-lg px-4 py-1.5 w-full max-w-md border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none ml-2 w-full text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <RoleGuard allowedRoles={['owner', 'manager']} userRole={userRole}>
          <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors relative">
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
        </RoleGuard>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Date Display */}
        <div className="hidden md:flex items-center">
          <span className="text-xs font-medium text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{userName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{userRole}</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
            <span className="text-xs">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* DEV ONLY - Role selector */}
        {import.meta.env.DEV && (
          <div className="border-l border-slate-200 pl-4 ml-2">
            <DevRoleSelector onRoleChange={onRoleChange} />
          </div>
        )}
      </div>
    </header>
  )
}

export default TopBar
