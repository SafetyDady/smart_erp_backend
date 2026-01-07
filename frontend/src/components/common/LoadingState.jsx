import React from 'react'

/**
 * LoadingState - Reusable loading skeleton component
 * Provides consistent loading UI across the application
 */
const LoadingState = ({ 
  variant = 'default', 
  count = 1, 
  isLoading = true,
  children,
  className = ''
}) => {
  // If not loading, render children content
  if (!isLoading) {
    return children || null
  }

  const baseSkeletonClass = "animate-pulse bg-gray-200 rounded"
  
  // Predefined skeleton variants for different UI elements
  const variants = {
    card: "h-24 w-full",           // KPI cards
    chart: "h-64 w-full",          // Chart containers  
    table: "h-8 w-full mb-2",      // Table rows
    text: "h-4 w-3/4 mb-2",        // Text lines
    title: "h-6 w-1/2 mb-4",       // Section titles
    button: "h-10 w-24",           // Buttons
    avatar: "h-8 w-8 rounded-full", // User avatars
    default: "h-6 w-full"          // Generic placeholder
  }
  
  const skeletonClass = `${baseSkeletonClass} ${variants[variant]} ${className}`
  
  // Generate skeleton elements based on count
  const skeletonElements = Array.from({ length: count }, (_, index) => (
    <div key={`skeleton-${index}`} className={skeletonClass} />
  ))

  // Render skeleton container
  return (
    <div className="space-y-2" data-testid="loading-skeleton">
      {skeletonElements}
    </div>
  )
}

/**
 * Specialized loading components for common use cases
 */
export const KPICardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <LoadingState variant="card" count={count} />
  </div>
)

export const ChartSkeleton = () => (
  <div className="space-y-4">
    <LoadingState variant="title" count={1} />
    <LoadingState variant="chart" count={1} />
  </div>
)

export const TableSkeleton = ({ rows = 8 }) => (
  <div className="space-y-2">
    <LoadingState variant="title" count={1} />
    <LoadingState variant="table" count={rows} />
  </div>
)

export default LoadingState