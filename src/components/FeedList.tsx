import React, { useEffect } from 'react'
import { useFeedStore } from '../stores/feed-store'
import { useTransactionStore } from '../stores/transaction-store'
import { useDocuments } from '../hooks/useDocuments'
import { FeedItem } from './FeedItem'
import { FeedSkeleton } from './FeedSkeleton'
import { ErrorMessage } from './ErrorMessage'
import { PublishCard } from './PublishCard'
import { dashService } from '../lib/dash-service'
import { FileText, Loader2 } from 'lucide-react'

interface FeedListProps {
  dataContractId: string
  documentType: string
  canPublish: boolean
  networkConfig: {
    dataContractId: string
    identityId: string | null
    blockExplorerUrl: string
  }
  refreshIdentity: () => Promise<void>
}

export const FeedList: React.FC<FeedListProps> = ({ 
  dataContractId, 
  documentType, 
  canPublish, 
  networkConfig,
  refreshIdentity 
}) => {
  const { checkConnection } = useFeedStore()
  const { addPendingTransaction, updateTransactionStatus } = useTransactionStore()
  const { documents, isLoading, isFetching, newDocumentIds, error, refetch } = useDocuments({
    dataContractId,
    documentType,
    pollInterval: 10000, // Poll every 10 seconds for more frequent updates
  })

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const handlePublish = async (message: string) => {
    if (!canPublish) {
      throw new Error('Publishing requires the Dash Platform Extension. Please install and connect the extension.')
    }

    // Add to pending transactions
    const transactionId = addPendingTransaction(message, 'pending-' + Date.now())

    try {
      console.log('📝 Publishing message to blockchain:', message)
      
      // Refresh identity before publishing to ensure we have the latest
      await refreshIdentity()
      
      // Check if we have an identity
      if (!networkConfig.identityId) {
        updateTransactionStatus(transactionId, 'failed', 'No identity available')
        throw new Error('No identity available. Please ensure you have an identity selected in the extension.')
      }
      
      const txHash = await dashService.createDocument(
        networkConfig.dataContractId,
        documentType,
        { message },
        networkConfig.identityId
      )
      
      console.log('✅ Message published successfully! Transaction hash:', txHash)
      
      // Update transaction status to confirmed
      updateTransactionStatus(transactionId, 'confirmed')
      
      // Wait a moment for the transaction to propagate, then refresh
      setTimeout(() => {
        refetch()
      }, 2000)
      
      return txHash
    } catch (error) {
      console.error('❌ Failed to publish message:', error)
      updateTransactionStatus(transactionId, 'failed', error instanceof Error ? error.message : 'Failed to publish')
      throw error
    }
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Background fetching indicator */}
      {isFetching && documents.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-gray-200/50 dark:border-gray-800/50">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Checking for new messages...</span>
        </div>
      )}
      
      {/* Publish Card - show only when extension is available */}
      {canPublish && (
        <PublishCard onPublish={handlePublish} />
      )}
      
      {/* Info message when extension not available */}
      {!canPublish && (
        <div className="glass rounded-2xl p-6 text-center max-w-md shadow-xl border border-blue-200/20 dark:border-blue-800/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            Read-Only Mode
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Install the Dash Platform Extension to publish messages
          </p>
        </div>
      )}
      
      {isLoading && documents.length === 0 ? (
        <FeedSkeleton />
      ) : documents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-md shadow-xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Documents will appear here once they're created
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-6">
          {documents.map((document, index) => (
            <FeedItem 
              key={document.$id} 
              document={document} 
              index={index}
              isNew={newDocumentIds.includes(document.$id)} // Only highlight truly new documents
            />
          ))}
        </div>
      )}
    </div>
  )
}