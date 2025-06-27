import { DashPlatformSDK } from 'dash-platform-sdk'
import type { DashDocument, DashPlatformSDK as ExtensionSDK } from '../types'
import { DashExtensionAdapter } from './extension-adapter'

type Network = 'testnet' | 'mainnet'

class DashService {
  private readOnlySDK: DashPlatformSDK
  private extensionSDK: ExtensionSDK | null = null
  private extensionAdapter: DashExtensionAdapter | null = null
  private currentNetwork: Network = 'testnet'
  
  // Request tracking for debugging
  private requestCount = 0
  private requestHistory: Array<{
    timestamp: number
    success: boolean
    error?: string
    duration: number
    nonce?: bigint
  }> = []

  constructor() {
    // Create standalone SDK for reading (public operations)
    this.readOnlySDK = new DashPlatformSDK({ 
      network: this.currentNetwork 
    })
    
    // Initialize extension SDK for writing (private operations)
    this.initializeExtensionSDK()
  }

  private initializeExtensionSDK() {
    // Check if we're in mock mode first
    if ((window as any).__mockExtensionEnabled) {
      console.log('[Mock] Mode is active - using mock extension')
      // Wait a bit for mock to be fully set up
      setTimeout(() => {
        if (window.dashPlatformSDK) {
          this.extensionSDK = window.dashPlatformSDK
          console.log('[Mock] Extension SDK initialized')
        }
      }, 200)
      return
    }
    
    if (window.dashPlatformSDK) {
      console.log('✅ Extension SDK found - publishing available')
      console.log('🔍 Extension SDK at initialization:', {
        type: typeof window.dashPlatformSDK,
        constructor: window.dashPlatformSDK.constructor?.name,
        hasDocuments: !!window.dashPlatformSDK.documents,
        hasIdentities: !!window.dashPlatformSDK.identities,
        hasStateTransitions: !!window.dashPlatformSDK.stateTransitions,
        hasSigner: !!window.dashPlatformSDK.signer,
        hasSignStateTransition: typeof (window.dashPlatformSDK.signer as any)?.signStateTransition === 'function',
        hasSignAndBroadcast: typeof (window.dashPlatformSDK.signer as any)?.signAndBroadcast === 'function',
        mainMethods: Object.keys(window.dashPlatformSDK),
        signerMethods: window.dashPlatformSDK.signer ? Object.keys(window.dashPlatformSDK.signer) : 'no signer'
      })
      this.extensionSDK = window.dashPlatformSDK
      this.extensionAdapter = new DashExtensionAdapter(window.dashPlatformSDK)
      
      // Explore the API in development mode
      if (import.meta.env.DEV) {
        this.extensionAdapter.exploreAPI()
      }
    } else {
      console.log('ℹ️ Extension SDK not found - publishing unavailable')
      this.extensionSDK = null
    }
  }

  // Update network for both SDKs
  setNetwork(network: Network): void {
    this.currentNetwork = network
    
    // Recreate read-only SDK with new network
    this.readOnlySDK = new DashPlatformSDK({ 
      network 
    })
    
    console.log(`📡 Network switched to ${network}`)
  }
  
  // Re-check for extension SDK (useful for testing and dynamic loading)
  reinitializeExtensionSDK(): void {
    // Always reinitialize, even in mock mode
    this.initializeExtensionSDK()
  }

  // Check if extension is available for publishing
  canPublish(): boolean {
    return this.extensionSDK !== null
  }

  // Simplified extension status check - respects Public/Private API security model
  async getExtensionStatus(): Promise<{ status: 'not-available' | 'available', isReady: boolean }> {
    if (!window.dashPlatformSDK) {
      return { status: 'not-available', isReady: false }
    }

    // Verify basic extension structure
    const hasRequiredComponents = !!(
      window.dashPlatformSDK.signer &&
      window.dashPlatformSDK.identities &&
      window.dashPlatformSDK.documents &&
      window.dashPlatformSDK.stateTransitions
    )

    return { 
      status: 'available', 
      isReady: hasRequiredComponents 
    }
  }

  // Legacy method for backward compatibility
  async getWalletStatus(): Promise<{ status: 'not-available' | 'not-connected' | 'connected', address?: string }> {
    const extensionStatus = await this.getExtensionStatus()
    
    if (extensionStatus.status === 'not-available') {
      return { status: 'not-available' }
    }

    // We can't reliably detect wallet connection from Public API (by design)
    // Return 'not-connected' and let the user attempt operations
    // The actual wallet check happens during signing
    return { status: 'not-connected' }
  }

  // Verify extension readiness before signing - simplified approach
  async verifyExtensionState(): Promise<{ ready: boolean, error?: string, details?: any }> {
    const details: any = {}
    
    // Check 1: Extension SDK availability
    if (!window.dashPlatformSDK) {
      return { ready: false, error: 'Extension not installed or not active', details }
    }
    details.hasSDK = true
    
    // Check 2: Required APIs availability
    const requiredAPIs = ['signer', 'identities', 'documents', 'stateTransitions']
    for (const api of requiredAPIs) {
      if (!window.dashPlatformSDK[api as keyof typeof window.dashPlatformSDK]) {
        return { ready: false, error: `Extension ${api} API not available`, details }
      }
    }
    details.hasRequiredAPIs = true
    
    // Check 3: signing methods (signStateTransition or signAndBroadcast)
    const hasSigner = !!(window.dashPlatformSDK.signer as any)
    const hasSignStateTransition = typeof (window.dashPlatformSDK.signer as any).signStateTransition === 'function'
    const hasSignAndBroadcast = typeof (window.dashPlatformSDK.signer as any).signAndBroadcast === 'function'
    
    if (!hasSigner || (!hasSignStateTransition && !hasSignAndBroadcast)) {
      return { ready: false, error: 'Extension signing method not available', details }
    }
    details.hasSignStateTransition = hasSignStateTransition
    details.hasSignAndBroadcast = hasSignAndBroadcast
    
    // Check 4: PublicAPIClient availability
    const publicAPIClient = (window.dashPlatformSDK.signer as any).publicAPIClient
    if (!publicAPIClient) {
      return { ready: false, error: 'Extension communication layer not available', details }
    }
    details.hasPublicAPIClient = true
    
    // Extension is ready - wallet connection will be verified during actual signing
    console.log('✅ Extension ready for operations:', details)
    return { ready: true, details }
  }

  // Reinitialize extension SDK (useful when extension loads after app)
  reinitializeExtension(): void {
    this.initializeExtensionSDK()
  }

  // READING: Always works with standalone SDK (public operation)
  async queryDocuments(
    dataContractId: string,
    documentType: string,
    limit: number = 10
  ): Promise<DashDocument[]> {
    try {
      console.log('📖 Querying documents (standalone SDK):', {
        dataContractId,
        documentType,
        limit,
        network: this.currentNetwork
      })
      
      const documents = await this.readOnlySDK.documents.query(
        dataContractId,
        documentType,
        [], // where clause (empty array for all documents)
        null, // orderBy (null for default)
        limit // limit number
      )
      
      console.log('✅ Query successful, found documents:', documents.length)
      
      // Convert WASM document objects to plain JavaScript objects
      const processedDocuments = documents.map(doc => {
        try {
          // Extract data from WASM document object
          const id = doc.getId()
          const ownerId = doc.getOwnerId()
          const dataContractId = doc.getDataContractId()
          
          return {
            $id: typeof id?.base58 === 'function' ? id.base58() : id,
            $ownerId: typeof ownerId?.base58 === 'function' ? ownerId.base58() : ownerId,
            $dataContractId: typeof dataContractId?.base58 === 'function' ? dataContractId.base58() : dataContractId,
            $createdAt: doc.getCreatedAt(),
            $updatedAt: doc.getUpdatedAt(),
            ...doc.getProperties() // Contains the actual document data like "message"
          }
        } catch (error) {
          console.error('⚠️ Error converting document:', error)
          return doc // Return original if conversion fails
        }
      })
      
      console.log('📄 Processed documents:', processedDocuments.length > 0 ? processedDocuments[0] : 'None')
      return processedDocuments
    } catch (error) {
      console.error('❌ Error querying documents:', error)
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          throw new Error('Network connection error. Please check your internet connection and try again.')
        }
        if (error.message.includes('contract') && error.message.includes('not found')) {
          throw new Error('Data contract not found. Please verify the contract ID is correct.')
        }
        throw new Error(`Query failed: ${error.message}`)
      }
      
      throw new Error('Unknown error occurred while querying documents')
    }
  }

  // PUBLISHING: Requires extension SDK (private operation) - Simplified to match working HTML file
  async createDocument(
    dataContractId: string,
    documentType: string,
    data: any,
    identity: string
  ): Promise<string> {
    if (!this.extensionSDK) {
      throw new Error('Publishing requires the Dash Platform Extension. Please install and connect the extension.')
    }

    const startTime = Date.now()
    this.requestCount++
    let nonce: bigint | undefined
    
    try {
      console.log('✍️ Creating document (simple approach):', {
        dataContractId,
        documentType,
        identity,
        requestNumber: this.requestCount
      })
      
      // Log request pattern
      console.log(`📊 Request #${this.requestCount} - Recent history:`)
      this.requestHistory.slice(-5).forEach((req, idx) => {
        console.log(`  ${idx + 1}. ${req.success ? '✅' : '❌'} ${req.duration}ms ${req.error ? `- ${req.error}` : ''} (nonce: ${req.nonce})`)
      })
      
      // Special warning for requests 4-5 where failures commonly occur
      if (this.requestCount >= 4 && this.requestCount <= 5) {
        console.warn(`⚠️ This is request #${this.requestCount} - Failures commonly occur after 3-5 consecutive operations`)
        console.warn('The extension appears to have a variable rate limit')
        console.warn('💡 WORKAROUNDS:')
        console.warn('  1. Add a 30-second delay before this request')
        console.warn('  2. Refresh the page after 3 successful requests')
        console.warn('  3. Close and reopen the extension')
      }

      // Step 1: Get nonce (exactly like HTML file)
      console.log(`Getting nonce for identity: ${identity}, contract: ${dataContractId}`)
      nonce = await this.extensionSDK.identities.getIdentityContractNonce(identity, dataContractId)
      console.log(`Current nonce: ${nonce}`)
      
      // Detect nonce reset or stuck nonce
      if (this.requestHistory.length > 0) {
        const lastNonce = this.requestHistory[this.requestHistory.length - 1].nonce
        if (lastNonce && nonce < lastNonce) {
          console.warn(`⚠️ NONCE RESET DETECTED! Previous: ${lastNonce}, Current: ${nonce}`)
          console.warn('This might indicate:')
          console.warn('  - Identity context changed')
          console.warn('  - Contract context changed')
          console.warn('  - Extension state was reset')
          console.warn('  - Different identity being used')
          
          // If nonce is very low (1 or 2), this might be a new identity/contract pair
          if (nonce <= 2n) {
            console.warn('⚠️ Very low nonce suggests this identity has never or rarely interacted with this contract')
            console.warn('The extension might not have the private key for this identity/contract combination')
          }
        } else if (lastNonce && nonce === lastNonce) {
          // This might be a false positive if we're comparing the queried nonce
          // with the nonce we used (which was queried + 1)
          const lastUsedNonce = lastNonce
          const currentQueriedNonce = nonce
          
          if (currentQueriedNonce === lastUsedNonce - 1n) {
            // This is expected - the network shows the last confirmed nonce
            console.log(`✅ Nonce progressing correctly: Last used ${lastUsedNonce}, Current ${currentQueriedNonce}`)
          } else {
            console.warn(`⚠️ POTENTIAL NONCE ISSUE: Current nonce ${nonce}, Last used ${lastNonce}`)
            console.warn('This might indicate:')
            console.warn('  - Previous transaction is stuck in mempool')
            console.warn('  - Extension failed to update nonce after last transaction')
            console.warn('  - Network sync issues')
          }
        }
      }
      
      // Step 2: Create document (exactly like HTML file)
      console.log(`Creating document with data:`, data)
      const doc = await this.extensionSDK.documents.create(
        dataContractId,
        documentType,
        data,
        identity,
        nonce + 1n
      )
      console.log('✅ Document created')
      
      // Step 3: Create state transition (exactly like HTML file)
      const st = await this.extensionSDK.stateTransitions.documentsBatch.create(doc, nonce + 1n)
      const txHash = st.hash(true)
      console.log('✅ State transition created')
      console.log(`Transaction hash: ${txHash}`)
      
      // Step 4: Sign and broadcast with retry logic
      console.log('Signing and broadcasting...')
      console.log('Please approve in extension popup!')
      
      // Log extension state before signing
      console.log('🔍 Extension state check:')
      console.log('  - Extension exists:', !!window.dashPlatformSDK)
      console.log('  - Signer exists:', !!window.dashPlatformSDK?.signer)
      console.log('  - signStateTransition type:', typeof window.dashPlatformSDK?.signer?.signStateTransition)
      
      // Use direct extension SDK call with retry logic
      if (!window.dashPlatformSDK?.signer) {
        throw new Error('Extension signer not available')
      }
      
      // Retry logic with exponential backoff
      const maxRetries = 3
      let lastError: any = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📝 Signing attempt ${attempt}/${maxRetries}...`)
          await window.dashPlatformSDK.signer.signStateTransition(st)
          
          // Success!
          console.log('✅ Transaction signed and broadcast!')
          console.log(`🎉 Success! Your message has been published.`)
          console.log(`Transaction: ${txHash}`)
          
          // Clear error on success
          lastError = null
          break
        } catch (signError) {
          console.error(`❌ Sign attempt ${attempt} failed:`)
          if (signError instanceof Error) {
            console.error('  Message:', signError.message)
          } else {
            console.error('  Error:', signError)
          }
          
          lastError = signError
          
          // Don't retry if user rejected or identity mismatch
          if (signError instanceof Error && 
              (signError.message.includes('User rejected') || 
               signError.message.includes('Signature is missing'))) {
            throw signError
          }
          
          // Wait before retry with exponential backoff
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            console.log(`⏳ Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      // If we exhausted all retries, throw the last error
      if (lastError) {
        throw lastError
      }
      
      // Track successful request
      const requestInfo = {
        timestamp: Date.now(),
        success: true,
        duration: Date.now() - startTime,
        nonce: nonce  // Store the queried nonce, not the used one
      }
      this.requestHistory.push(requestInfo)
      
      // Log timing analysis
      if (this.requestHistory.length >= 2) {
        const timeSinceLastRequest = requestInfo.timestamp - this.requestHistory[this.requestHistory.length - 2].timestamp
        console.log(`⏱️ Time since last request: ${timeSinceLastRequest}ms`)
        
        // Check if requests are happening too quickly
        if (timeSinceLastRequest < 15000) {
          console.log('⚡ Rapid request detected (< 15s between requests)')
          console.log('💡 Consider adding a 15-30 second delay between requests')
        }
        
        // Additional analysis for very rapid requests
        if (timeSinceLastRequest < 5000) {
          console.warn('⚠️ VERY rapid request detected (< 5s) - This may trigger rate limits!')
        }
      }
      
      // Pattern analysis
      const recentFailures = this.requestHistory.slice(-10).filter(r => !r.success).length
      if (recentFailures > 0) {
        console.log(`📊 Recent failure rate: ${recentFailures}/10 requests failed`)
      }
      
      // Keep only last 10 requests
      if (this.requestHistory.length > 10) {
        this.requestHistory = this.requestHistory.slice(-10)
      }
      
      return txHash
    } catch (error) {
      // Track failed request
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.requestHistory.push({
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        nonce: nonce  // Store the queried nonce, not the used one
      })
      
      // Keep only last 10 requests
      if (this.requestHistory.length > 10) {
        this.requestHistory = this.requestHistory.slice(-10)
      }
      
      // Enhanced error logging to capture all details
      console.error('❌ Error creating document:')
      if (error instanceof Error) {
        console.error('  Message:', error.message)
        console.error('  Stack:', error.stack)
        console.error('  Name:', error.name)
      } else if (error && typeof error === 'object') {
        // Log all properties of non-Error objects
        console.error('  Error object:', JSON.stringify(error, null, 2))
        console.error('  Error keys:', Object.keys(error))
        console.error('  Error prototype:', Object.getPrototypeOf(error))
      } else {
        console.error('  Raw error:', error)
      }
      
      // Print analytics on failure
      console.log('\n📊 Request Analytics:')
      const analytics = this.getRequestAnalytics()
      console.log(`  Total requests: ${analytics.totalRequests}`)
      console.log(`  Success rate: ${analytics.successRate}%`)
      console.log(`  Average request time: ${analytics.averageRequestTime}ms`)
      
      if (analytics.failurePatterns.length > 0) {
        console.log('\n🔍 Failure Patterns Detected:')
        analytics.failurePatterns.forEach(pattern => {
          console.log(`  - ${pattern}`)
        })
      }
      
      if (analytics.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        analytics.recommendations.forEach(rec => {
          console.log(`  - ${rec}`)
        })
      }
      
      if (error instanceof Error) {
        const errorMessage = error.message
        
        if (errorMessage.includes('ALREADY_EXISTS')) {
          throw new Error('This usually means the nonce was already used. Try again - it should work with a fresh nonce.')
        } else if (errorMessage.includes('Signature is missing')) {
          throw new Error('The extension could not sign for this identity. Make sure the extension has the private key imported.')
        } else if (errorMessage.includes('UNAVAILABLE')) {
          throw new Error('Network error - could not connect to Dash Platform. Please check your internet connection and try again.')
        }
      }
      
      throw error
    }
  }
  
  // Debug method to explore extension API
  exploreExtensionAPI(): void {
    if (!this.extensionSDK) {
      console.log('❌ No extension SDK available')
      return
    }

    console.log('🔍 Exploring Extension API...')
    const ext = this.extensionSDK as any
    
    // Log top-level properties
    console.log('📋 Top-level properties:', Object.keys(ext))
    
    // Check identities API
    if (ext.identities) {
      console.log('📋 Identities API:', Object.keys(ext.identities))
      console.log('  - getIdentityContractNonce:', typeof ext.identities.getIdentityContractNonce)
      console.log('  - getBalance:', typeof ext.identities.getBalance)
      console.log('  - get:', typeof ext.identities.get)
      console.log('  - getIdentities:', typeof ext.identities.getIdentities)
      console.log('  - getCurrentIdentity:', typeof ext.identities.getCurrentIdentity)
    }
    
    // Check wallet API
    if (ext.wallet) {
      console.log('📋 Wallet API:', Object.keys(ext.wallet))
    }
    
    // Check signer API
    if (ext.signer) {
      console.log('📋 Signer API:', Object.keys(ext.signer))
      console.log('  - signStateTransition:', typeof ext.signer.signStateTransition)
      console.log('  - signAndBroadcast:', typeof ext.signer.signAndBroadcast)
      console.log('  - publicAPIClient:', typeof ext.signer.publicAPIClient)
    }
    
    // Check documents API
    if (ext.documents) {
      console.log('📋 Documents API:', Object.keys(ext.documents))
      console.log('  - create:', typeof ext.documents.create)
    }
    
    // Check state transitions API
    if (ext.stateTransitions) {
      console.log('📋 State Transitions API:', Object.keys(ext.stateTransitions))
      if (ext.stateTransitions.documentsBatch) {
        console.log('  - documentsBatch:', Object.keys(ext.stateTransitions.documentsBatch))
      }
    }
  }

  // Get available identities from extension
  async getAvailableIdentities(): Promise<string[]> {
    try {
      // Check if extension has a method to get identities
      if (!this.extensionSDK) {
        console.log('❌ Extension not available for getting identities')
        return []
      }

      // Try different methods the extension might expose
      const ext = this.extensionSDK as any
      
      // Method 1: Check if there's a getIdentities method
      if (typeof ext.identities?.getIdentities === 'function') {
        console.log('🔍 Getting identities via getIdentities()')
        const identities = await ext.identities.getIdentities()
        return identities.map((id: any) => 
          typeof id === 'string' ? id : id.getId?.()?.toString() || id.toString()
        )
      }
      
      // Method 2: Check if there's a wallet API
      if (typeof ext.wallet?.getIdentities === 'function') {
        console.log('🔍 Getting identities via wallet.getIdentities()')
        const identities = await ext.wallet.getIdentities()
        return identities.map((id: any) => 
          typeof id === 'string' ? id : id.getId?.()?.toString() || id.toString()
        )
      }
      
      // Method 3: Check localStorage or extension storage
      // This is a fallback - real extension might store current identity differently
      console.log('⚠️ No identity API found in extension')
      return []
      
    } catch (error) {
      console.error('❌ Error getting identities from extension:', error)
      return []
    }
  }

  // Get current active identity from extension
  async getCurrentIdentity(): Promise<string | null> {
    try {
      if (!this.extensionAdapter) {
        return null
      }

      return await this.extensionAdapter.getCurrentIdentity()
    } catch (error) {
      console.error('❌ Error getting current identity:', error)
      return null
    }
  }
  
  // Get request analytics for debugging
  getRequestAnalytics(): {
    totalRequests: number
    successRate: number
    averageRequestTime: number
    failurePatterns: string[]
    recommendations: string[]
  } {
    if (this.requestHistory.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        averageRequestTime: 0,
        failurePatterns: [],
        recommendations: []
      }
    }
    
    const successfulRequests = this.requestHistory.filter(r => r.success)
    const failedRequests = this.requestHistory.filter(r => !r.success)
    const successRate = (successfulRequests.length / this.requestHistory.length) * 100
    const avgTime = successfulRequests.reduce((sum, r) => sum + r.duration, 0) / (successfulRequests.length || 1)
    
    const patterns: string[] = []
    const recommendations: string[] = []
    
    // Check for pattern of failures after 3-5 requests
    const failurePositions = this.requestHistory
      .map((r, i) => ({ ...r, position: i + 1 }))
      .filter(r => !r.success)
      .map(r => r.position)
    
    if (failurePositions.length > 0) {
      const positions = failurePositions.join(', ')
      const commonPositions = failurePositions.filter(p => p >= 4 && p <= 5)
      
      if (commonPositions.length > 0) {
        patterns.push(`Failures occur after 3-5 consecutive requests (positions: ${positions})`)
        recommendations.push('The extension has a variable limit of 3-5 consecutive operations')
        recommendations.push('Add a 30-second delay between requests to avoid the limit')
        recommendations.push('Or refresh the page after 3 successful requests to be safe')
      }
    }
    
    // Check for rapid request issues
    const rapidRequests = this.requestHistory
      .slice(1)
      .map((r, i) => ({
        request: r,
        timeSincePrevious: r.timestamp - this.requestHistory[i].timestamp
      }))
      .filter(r => r.timeSincePrevious < 5000)
    
    if (rapidRequests.some(r => !r.request.success)) {
      patterns.push('Failures occur with rapid requests (< 5s apart)')
      recommendations.push('Add a 15-30 second delay between requests')
      recommendations.push('The extension may have rate limiting protection')
    }
    
    // Check for nonce issues
    const nonceResets = this.requestHistory
      .slice(1)
      .filter((r, i) => r.nonce && this.requestHistory[i].nonce && r.nonce < this.requestHistory[i].nonce!)
    
    if (nonceResets.length > 0) {
      patterns.push('Nonce resets detected')
      recommendations.push('The extension may be switching identities or losing state')
      recommendations.push('Verify the correct identity is imported in the extension')
    }
    
    // Check for consistent error messages
    const errorMessages = failedRequests
      .map(r => r.error)
      .filter((e): e is string => !!e)
    
    if (errorMessages.every(e => e.includes('Signature is missing'))) {
      patterns.push('All failures are "Signature is missing" errors')
      recommendations.push('The extension cannot sign for this identity')
      recommendations.push('Check that the private key for this identity is imported')
    }
    
    return {
      totalRequests: this.requestHistory.length,
      successRate: Math.round(successRate),
      averageRequestTime: Math.round(avgTime),
      failurePatterns: patterns,
      recommendations
    }
  }

  // Check identity balance (public operation - uses read-only SDK)
  async getIdentityBalance(identityId: string): Promise<number | null> {
    try {
      console.log('💰 Checking identity balance:', identityId)
      
      // Use getBalance directly since get() is having issues
      const balance = await this.readOnlySDK.identities.getBalance(identityId)
      console.log('✅ Identity balance:', balance)
      return balance
    } catch (error) {
      console.error('❌ Error checking balance:', error)
      
      // If identity not found, return 0
      if ((error as any)?.code === 5 || (error as any)?.message?.includes('not found')) {
        console.error('❌ Identity not found on network')
        return 0
      }
      
      return null
    }
  }
}

export const dashService = new DashService()