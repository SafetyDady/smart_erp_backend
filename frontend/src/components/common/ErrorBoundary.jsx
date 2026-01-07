import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * ErrorBoundary - Production-grade error handling component
 * Catches JavaScript errors anywhere in child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger error UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging/monitoring
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    
    this.setState({ errorInfo })
    
    // TODO: Send error to monitoring service (e.g., Sentry)
    // this.logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-red-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
            </p>
            
            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-xs text-red-500 mb-4 text-left">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap bg-red-100 p-2 rounded border overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            <p className="text-xs text-red-500 mt-3">
              If this error persists, please contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component wrapper for functional components
 */
export const withErrorBoundary = (Component, fallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook for error reporting in functional components
 */
export const useErrorHandler = () => {
  return React.useCallback((error, errorInfo) => {
    console.error('Manual error report:', { error, errorInfo })
    // TODO: Send to monitoring service
  }, [])
}

export default ErrorBoundary