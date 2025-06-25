import { DashPlatformSDK } from 'dash-platform-sdk'
import type { DashDocument, DashPlatformSDK as ExtensionSDK } from '../types'

type Network = 'testnet' | 'mainnet'

class DashService {
  private readOnlySDK: DashPlatformSDK
  private extensionSDK: ExtensionSDK | null = null
  private currentNetwork: Network = 'testnet'

  constructor() {
    // Create standalone SDK for reading (public operations)
    this.readOnlySDK = new DashPlatformSDK({ 
      network: this.currentNetwork 
    })
    
    // Initialize extension SDK for writing (private operations)
    this.initializeExtensionSDK()
  }

  private initializeExtensionSDK() {
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

  // PUBLISHING: Requires extension SDK (private operation) - Enhanced with better error handling
  async createDocument(
    dataContractId: string,
    documentType: string,
    data: any,
    identity: string
  ): Promise<string> {
    if (!this.extensionSDK) {
      throw new Error('Publishing requires the Dash Platform Extension. Please install and connect the extension.')
    }

    try {
      console.log('✍️ Creating document (extension SDK):', {
        dataContractId,
        documentType,
        identity
      })

      // Step 0: Verify extension state before proceeding
      console.log('🔍 Step 0: Verifying extension state...')
      const verificationResult = await this.verifyExtensionState()
      if (!verificationResult.ready) {
        throw new Error(`Extension not ready: ${verificationResult.error}`)
      }
      console.log('✅ Step 0 complete. Extension state verified.')

      console.log('🔍 Step 1: Checking identity balance...')
      const balance = await this.getIdentityBalance(identity)
      
      if (balance === null) {
        throw new Error('❌ Identity Not Found: The identity does not exist on the network.\n\n📋 Please:\n1. Check that your identity is registered\n2. Verify you\'re on the correct network')
      }
      
      // Minimum balance needed for a transaction (approximate)
      const MIN_BALANCE = 1000 // Credits needed for a basic transaction
      
      if (balance < MIN_BALANCE) {
        throw new Error(`❌ Insufficient Credits: Your identity has ${balance} credits, but needs at least ${MIN_BALANCE}.\n\n📋 Please:\n1. Top up your identity with credits\n2. Visit a Dash testnet faucet\n3. Wait for credits to confirm`)
      }
      
      console.log(`✅ Step 1 complete. Balance: ${balance} credits`)
      
      console.log('🔍 Step 2: Getting identity contract nonce...')
      const identityContractNonce = await this.extensionSDK.identities.getIdentityContractNonce(
        identity,
        dataContractId
      )
      console.log('✅ Step 2 complete. Nonce:', identityContractNonce)
      
      console.log('🔍 Step 3: Creating document...')
      const document = await this.extensionSDK.documents.create(
        dataContractId,
        documentType,
        data,
        identity,
        identityContractNonce + 1n
      )
      console.log('✅ Step 3 complete. Document created.')
      
      console.log('🔍 Step 4: Creating state transition...')
      const stateTransition = await this.extensionSDK.stateTransitions.documentsBatch.create(
        document,
        identityContractNonce + 1n
      )
      console.log('✅ Step 4 complete. State transition created.')
      
      // Step 5: Sign and broadcast the state transition
      console.log('🔍 Step 5: Signing and broadcasting state transition...')
      
      // Pre-signing validation
      if (!stateTransition || typeof stateTransition.hash !== 'function') {
        throw new Error('Invalid state transition object created')
      }
      
      // Log state transition details for debugging
      const stateTransitionHash = stateTransition.hash(true)
      console.log('📋 State transition details:', {
        hash: stateTransitionHash,
        type: stateTransition.constructor?.name || typeof stateTransition,
        hasToBuffer: typeof stateTransition.toBuffer === 'function',
        hasToJSON: typeof stateTransition.toJSON === 'function',
        keys: Object.keys(stateTransition || {}).slice(0, 10) // First 10 keys
      })
      
      // Ensure we're using the window.dashPlatformSDK (not this.extensionSDK)
      const signer = window.dashPlatformSDK?.signer
      if (!signer) {
        throw new Error('Extension signer not available')
      }
      
      // Check which signing method is available (prefer signStateTransition)
      const hasSignStateTransition = typeof (signer as any).signStateTransition === 'function'
      const hasSignAndBroadcast = typeof (signer as any).signAndBroadcast === 'function'
      
      if (!hasSignStateTransition && !hasSignAndBroadcast) {
        throw new Error('No signing method available in extension')
      }
      
      console.log('📝 Using signing method:', hasSignStateTransition ? 'signStateTransition' : 'signAndBroadcast')
      
      // Sign and broadcast with timeout
      try {
        console.log('⏳ Waiting for user approval in extension popup...')
        
        const SIGNING_TIMEOUT = 120000 // 2 minutes timeout
        const signingStartTime = Date.now()
        
        // Call the appropriate signing method
        const signingPromise = hasSignStateTransition 
          ? (signer as any).signStateTransition(stateTransition)
          : (signer as any).signAndBroadcast(stateTransition)
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Signing timeout - please complete the extension popup within 2 minutes'))
          }, SIGNING_TIMEOUT)
        })
        
        // Wait for signing to complete or timeout
        await Promise.race([signingPromise, timeoutPromise])
        
        const signingDuration = Date.now() - signingStartTime
        console.log(`✅ Step 5 complete. Transaction signed and broadcasted successfully in ${signingDuration}ms`)
        
      } catch (signingError) {
        console.error('❌ Signing failed:', signingError)
        
        if (signingError instanceof Error) {
          const errorMessage = signingError.message.toLowerCase()
          
          // User rejected or cancelled
          if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
            throw new Error('Transaction rejected. You cancelled the transaction in the extension popup.')
          }
          
          // Timeout
          if (errorMessage.includes('timeout')) {
            throw new Error('Request timed out. Please complete the extension popup more quickly.')
          }
          
          // Extension/wallet issues
          if (errorMessage.includes('no wallet') || errorMessage.includes('wallet is not chosen')) {
            throw new Error('No wallet selected. Please set up a wallet in the extension first.')
          }
          
          // Signature issues (often indicates insufficient credits)
          if (errorMessage.includes('invalid state transition signature') || errorMessage.includes('signature is missing')) {
            throw new Error('Transaction failed. This may be due to insufficient credits or an authentication issue. Please check your identity balance.')
          }
        }
        
        throw signingError
      }
      
      // Return the transaction hash (calculated earlier)
      console.log('✅ Document created successfully!', {
        txHash: stateTransitionHash,
        network: this.currentNetwork
      })
      
      return stateTransitionHash
    } catch (error) {
      console.error('❌ Error creating document:', error)
      
      // Enhanced error handling with user guidance
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        // Extension/wallet setup issues
        if (errorMessage.includes('extension not installed')) {
          throw new Error('❌ Extension Required: Please install the Dash Platform Extension from Chrome Web Store and reload this page.')
        }
        
        if (errorMessage.includes('extension not ready') || errorMessage.includes('api not available')) {
          throw new Error('❌ Extension Error: Extension is not ready. Please reload the extension or restart your browser.')
        }
        
        // Wallet/identity issues
        if (errorMessage.includes('no wallet') || errorMessage.includes('wallet is not chosen')) {
          throw new Error('❌ No Wallet: Please set up a wallet in the extension first.\n\n📋 Steps:\n1. Click the extension icon in your browser\n2. Create or import a wallet\n3. Add an identity\n4. Try publishing again')
        }
        
        if (errorMessage.includes('no identity') || errorMessage.includes('identity') && errorMessage.includes('not found')) {
          throw new Error('❌ No Identity: Please add an identity to your wallet in the extension.\n\n📋 Steps:\n1. Open the extension popup\n2. Import or create an identity\n3. Try publishing again')
        }
        
        // Signing process issues
        if (errorMessage.includes('signature is missing')) {
          throw new Error('❌ Signing Incomplete: The extension popup was not completed properly.\n\n📋 Please:\n1. Ensure you clicked "Approve" in the popup\n2. Enter your password correctly\n3. Wait for the confirmation\n4. Try again if needed')
        }
        
        // Insufficient credits (often shows as "Invalid State Transition signature")
        if (errorMessage.includes('invalid state transition signature')) {
          throw new Error('❌ Transaction Failed: This could be due to insufficient credits or key mismatch.\n\n📋 Please check:\n1. Your identity has enough credits (top up if needed)\n2. You\'re using the correct identity\n3. The identity is registered on this network')
        }
        
        if (errorMessage.includes('timeout')) {
          throw new Error('❌ Timeout: Request timed out waiting for approval.\n\n📋 Please:\n1. Try again with a shorter message\n2. Complete the extension popup more quickly\n3. Check your internet connection')
        }
        
        if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
          throw new Error('❌ Transaction Rejected: You rejected the transaction in the extension popup. Click "Approve" to publish your message.')
        }
        
        // Network/connection issues
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          throw new Error('❌ Network Error: Unable to connect to Dash Platform.\n\n📋 Please:\n1. Check your internet connection\n2. Try again in a few moments\n3. Verify you\'re on the correct network (testnet)')
        }
        
        // Generic extension issues
        if (errorMessage.includes('failed to decrypt') || errorMessage.includes('password')) {
          throw new Error('❌ Password Error: Incorrect password or wallet is locked.\n\n📋 Please:\n1. Open the extension popup\n2. Unlock your wallet with the correct password\n3. Try publishing again')
        }
      }
      
      // Fallback error message
      throw new Error(`❌ Publishing Failed: ${error instanceof Error ? error.message : String(error)}\n\n💡 Try opening the extension popup to check your wallet status and ensure you have an identity with sufficient credits.`)
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