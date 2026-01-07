import React from 'react'
import { RoleProvider, useRole } from './components/guards/RoleContext'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'

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
  const [currentPage] = React.useState('dashboard')
  const [userName] = React.useState('John Doe')
  const [notifications] = React.useState([
    { id: 1, message: 'New order received' },
    { id: 2, message: 'Weekly report ready' }
  ])

  // In a real app, this would come from route params or navigation state
  const handleNavigate = (pageId, href) => {
    console.log(`Navigate to: ${pageId} (${href})`)
    // TODO: Implement routing
  }

  const handleRoleChange = (newRole) => {
    console.log(`App: Role changed to ${newRole}`)
    // Additional role change handling if needed
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
      <DashboardPage />
    </AppLayout>
  )
}

export default App