import { useEffect, useRef } from 'react'
import { useFeedStore } from '../stores/feed-store'

interface UseDocumentsOptions {
  dataContractId: string
  documentType: string
  pollInterval?: number
  enabled?: boolean
}

export const useDocuments = ({
  dataContractId,
  documentType,
  pollInterval = 30000, // 30 seconds
  enabled = true
}: UseDocumentsOptions) => {
  const { 
    documents, 
    isLoading, 
    isFetching,
    newDocumentIds,
    error, 
    fetchDocuments
  } = useFeedStore()
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Initial fetch
    fetchDocuments(dataContractId, documentType)

    // Set up polling
    if (pollInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchDocuments(dataContractId, documentType)
      }, pollInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [dataContractId, documentType, pollInterval, enabled, fetchDocuments])

  const refetch = () => {
    fetchDocuments(dataContractId, documentType)
  }

  return {
    documents,
    isLoading,
    isFetching,
    newDocumentIds,
    error,
    refetch
  }
}