import React from 'react'
import { Eye, MoreHorizontal, ArrowRight } from 'lucide-react'
import LoadingState from '../common/LoadingState.jsx'

const TransactionSection = ({ 
  userRole, 
  transactions = [],
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-lg shadow border p-6">
          <LoadingState variant="table" count={8} isLoading={true} />
        </div>
      </div>
    )
  }

  const getStatusStyle = (status) => {
    const styles = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      processing: 'bg-blue-50 text-blue-700 border-blue-100',
      cancelled: 'bg-slate-50 text-slate-600 border-slate-100'
    }
    return styles[status.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Recent Activity</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center transition-colors">
          View All <ArrowRight size={16} className="ml-1" />
        </button>
      </div>
      
      <div className="card overflow-hidden p-0">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MoreHorizontal className="text-slate-300" size={32} />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No transactions found</h3>
            <p className="text-slate-500 text-sm">There are no recent transactions to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id || index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {transaction.customer || transaction.supplier || '—'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                      {transaction.amount ? `$${transaction.amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionSection
