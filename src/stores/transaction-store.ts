import { create } from 'zustand'

interface PendingTransaction {
  id: string
  message: string
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  errorMessage?: string
}

interface TransactionStore {
  pendingTransactions: PendingTransaction[]
  
  // Actions
  addPendingTransaction: (message: string, txHash: string) => string
  updateTransactionStatus: (id: string, status: 'confirmed' | 'failed', errorMessage?: string) => void
  removePendingTransaction: (id: string) => void
  clearOldTransactions: () => void
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  pendingTransactions: [],
  
  addPendingTransaction: (message: string, txHash: string) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const transaction: PendingTransaction = {
      id,
      message,
      txHash,
      status: 'pending',
      timestamp: Date.now()
    }
    
    set(state => ({
      pendingTransactions: [transaction, ...state.pendingTransactions]
    }))
    
    // Auto-remove after 5 minutes if still pending
    setTimeout(() => {
      const state = get()
      const tx = state.pendingTransactions.find(t => t.id === id)
      if (tx && tx.status === 'pending') {
        set(state => ({
          pendingTransactions: state.pendingTransactions.filter(t => t.id !== id)
        }))
      }
    }, 5 * 60 * 1000)
    
    return id
  },
  
  updateTransactionStatus: (id: string, status: 'confirmed' | 'failed', errorMessage?: string) => {
    set(state => ({
      pendingTransactions: state.pendingTransactions.map(tx =>
        tx.id === id ? { ...tx, status, errorMessage } : tx
      )
    }))
    
    // Auto-remove confirmed transactions after 10 seconds
    if (status === 'confirmed') {
      setTimeout(() => {
        set(state => ({
          pendingTransactions: state.pendingTransactions.filter(tx => tx.id !== id)
        }))
      }, 10000)
    }
  },
  
  removePendingTransaction: (id: string) => {
    set(state => ({
      pendingTransactions: state.pendingTransactions.filter(tx => tx.id !== id)
    }))
  },
  
  clearOldTransactions: () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    set(state => ({
      pendingTransactions: state.pendingTransactions.filter(
        tx => tx.timestamp > fiveMinutesAgo || tx.status === 'pending'
      )
    }))
  }
}))