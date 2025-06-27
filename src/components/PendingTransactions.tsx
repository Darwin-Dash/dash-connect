import React from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTransactionStore } from '../stores/transaction-store'

export const PendingTransactions: React.FC = () => {
  const pendingTransactions = useTransactionStore(state => state.pendingTransactions)
  const removeTransaction = useTransactionStore(state => state.removePendingTransaction)
  
  if (pendingTransactions.length === 0) return null
  
  return (
    <div className="w-full max-w-[640px] sm:max-w-[480px] max-[640px]:max-w-[90vw] space-y-2">
      {pendingTransactions.map(tx => (
        <div
          key={tx.id}
          className={`glass rounded-lg p-3 flex items-center justify-between animate-fade-in ${
            tx.status === 'confirmed' ? 'border border-green-500/20' :
            tx.status === 'failed' ? 'border border-red-500/20' :
            'border border-gray-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            {tx.status === 'pending' && (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            )}
            {tx.status === 'confirmed' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {tx.status === 'failed' && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            
            <div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {tx.status === 'pending' && 'Publishing: '}
                {tx.status === 'confirmed' && 'Published: '}
                {tx.status === 'failed' && 'Failed: '}
                "{tx.message.length > 50 ? tx.message.substring(0, 50) + '...' : tx.message}"
              </div>
              {tx.status === 'failed' && tx.errorMessage && (
                <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {tx.errorMessage}
                </div>
              )}
              {(tx.status === 'pending' || tx.status === 'confirmed') && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <a
                    href={`https://testnet.platform-explorer.com/identity/${import.meta.env.VITE_IDENTITY_ID || 'DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View on explorer →
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {tx.status !== 'pending' && (
            <button
              onClick={() => removeTransaction(tx.id)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          )}
        </div>
      ))}
    </div>
  )
}