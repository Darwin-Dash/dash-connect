import { create } from 'zustand'
import type { DashDocument } from '../types'
import { dashService } from '../lib/dash-service'

interface FeedStore {
  documents: DashDocument[]
  isLoading: boolean
  error: string | null
  isFetching: boolean // New flag for background fetching
  newDocumentIds: string[] // Track IDs of newly discovered documents
  
  // Actions
  fetchDocuments: (dataContractId: string, documentType: string) => Promise<void>
  checkConnection: () => void
  clearNewDocuments: () => void
  reset: () => void
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  isFetching: false,
  newDocumentIds: [],
  
  fetchDocuments: async (dataContractId: string, documentType: string) => {
    const state = get()
    const isInitialLoad = state.documents.length === 0
    
    // Set appropriate loading state
    if (isInitialLoad) {
      set({ isLoading: true, error: null })
    } else {
      set({ isFetching: true, error: null })
    }
    
    try {
      const newDocuments = await dashService.queryDocuments(
        dataContractId,
        documentType,
        10
      )
      
      // Smart merge: only add new documents that don't exist
      const existingIds = new Set(state.documents.map(doc => doc.$id))
      const freshDocuments = newDocuments.filter(doc => !existingIds.has(doc.$id))
      
      // Get IDs of truly new documents
      const freshDocumentIds = freshDocuments.map(doc => doc.$id)
      
      // Sort all documents by creation time (newest first)
      const allDocuments = [...freshDocuments, ...state.documents]
        .sort((a, b) => {
          const timeA = a.$createdAt || 0
          const timeB = b.$createdAt || 0
          return timeB - timeA // Newest first
        })
        .slice(0, 20) // Keep only most recent 20
      
      console.log(`📊 Documents update: ${freshDocuments.length} new, ${allDocuments.length} total`)
      
      set({ 
        documents: allDocuments, 
        isLoading: false,
        isFetching: false,
        newDocumentIds: freshDocumentIds, // Track new document IDs
        error: null 
      })
      
      // Auto-clear new document highlights after 3 seconds
      if (freshDocumentIds.length > 0) {
        setTimeout(() => {
          set({ newDocumentIds: [] })
        }, 3000)
      }
    } catch (error) {
      set({ 
        isLoading: false,
        isFetching: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents'
      })
    }
  },
  
  checkConnection: () => {
    // Connection checking is now handled by useDashPlatform hook
    // This method kept for compatibility but does nothing
  },
  
  clearNewDocuments: () => {
    set({ newDocumentIds: [] })
  },
  
  reset: () => {
    set({
      documents: [],
      isLoading: false,
      error: null,
      isFetching: false,
      newDocumentIds: [],
    })
  }
}))