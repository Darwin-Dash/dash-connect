/**
 * Mock Extension SDK for testing without the real browser extension
 * This simulates the behavior of the Dash Platform browser extension
 */

// Buffer polyfill for browser compatibility
declare global {
  interface Window {
    Buffer?: any;
  }
}

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    from: (data: any) => {
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(data);
    },
    allocUnsafe: (size: number) => new Uint8Array(size),
    concat: (arrays: Uint8Array[]) => {
      const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      arrays.forEach(arr => {
        result.set(arr, offset);
        offset += arr.length;
      });
      return result;
    }
  };
}

// Browser-compatible base64 encoding
const toBase64 = (str: string): string => {
  return btoa(str);
}

interface MockConfig {
  autoApprove?: boolean
  approvalDelay?: number
  shouldFail?: boolean
  failureReason?: string
  identityBalance?: bigint
}

interface MockIdentity {
  balance: bigint
  nonce: bigint
  lastUsedContractId?: string
}

export class MockExtensionSDK {
  private config: MockConfig
  private mockIdentities = new Map<string, MockIdentity>()
  
  constructor(config: MockConfig = {}) {
    this.config = {
      autoApprove: true,
      approvalDelay: 1000,
      shouldFail: false,
      identityBalance: 1000000000000n, // Default balance
      ...config
    }
    
    // Set up default test identity from environment variable
    const defaultIdentityId = import.meta.env.VITE_IDENTITY_ID || 'DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq'
    this.mockIdentities.set(defaultIdentityId, {
      balance: this.config.identityBalance!,
      nonce: 17n // Starting nonce
    })
  }
  
  identities = {
    getIdentityContractNonce: async (identityId: string, dataContractId: string): Promise<bigint> => {
      console.log('[Mock] Getting identity contract nonce:', { identityId, dataContractId })
      
      // Auto-create identity if it doesn't exist
      if (!this.mockIdentities.has(identityId)) {
        this.mockIdentities.set(identityId, {
          balance: this.config.identityBalance!,
          nonce: 0n
        })
      }
      
      const identity = this.mockIdentities.get(identityId)!
      // Track the contract being used
      identity.lastUsedContractId = dataContractId
      return identity.nonce
    },
    
    getBalance: async (identityId: string): Promise<number> => {
      console.log('[Mock] Getting identity balance:', identityId)
      
      // Auto-create identity if it doesn't exist
      if (!this.mockIdentities.has(identityId)) {
        this.mockIdentities.set(identityId, {
          balance: this.config.identityBalance!,
          nonce: 0n
        })
      }
      
      const identity = this.mockIdentities.get(identityId)!
      return Number(identity.balance)
    },
    
    get: async (identityId: string): Promise<any> => {
      console.log('[Mock] Getting identity:', identityId)
      
      // Auto-create identity if it doesn't exist
      if (!this.mockIdentities.has(identityId)) {
        this.mockIdentities.set(identityId, {
          balance: this.config.identityBalance!,
          nonce: 0n
        })
      }
      
      const identity = this.mockIdentities.get(identityId)!
      return {
        getId: () => ({ toString: () => identityId }),
        getBalance: () => identity.balance
      }
    },
    
    // Add method to get current identity
    getCurrentIdentity: async (): Promise<string> => {
      console.log('[Mock] Getting current identity')
      // Return the same identity as the real extension for consistency
      return 'DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq'
    }
  }
  
  documents = {
    create: async (
      dataContractId: string,
      documentType: string,
      data: any,
      identity: string,
      identityContractNonce: bigint
    ): Promise<any> => {
      console.log('[Mock] Creating document:', {
        dataContractId,
        documentType,
        data,
        identity,
        nonce: identityContractNonce
      })
      
      // Return a mock document
      return {
        getId: () => ({ 
          toString: () => `mock-doc-${Date.now()}`,
          base58: () => `mock-doc-${Date.now()}`
        }),
        getOwnerId: () => ({ 
          toString: () => identity,
          base58: () => identity
        }),
        getDataContractId: () => ({ 
          toString: () => dataContractId,
          base58: () => dataContractId
        }),
        getProperties: () => data,
        toJSON: () => ({
          $id: `mock-doc-${Date.now()}`,
          $ownerId: identity,
          $dataContractId: dataContractId,
          ...data
        })
      }
    }
  }
  
  stateTransitions = {
    documentsBatch: {
      create: async (document: any, identityContractNonce: bigint): Promise<any> => {
        console.log('[Mock] Creating state transition:', {
          documentId: document.getId().toString(),
          nonce: identityContractNonce
        })
        
        // Return a mock state transition that mimics the real one
        const mockStateTransition = {
          _signature: null as any,
          hash: (_asString: boolean = false) => {
            const hash = `mock-hash-${Date.now()}`
            // In browser, just return the string for both cases
            return hash
          },
          toJSON: function() {
            return {
              type: 1, // Document batch transition type
              signature: this._signature,
              transitions: [{
                $action: 0, // Create action
                $document: document.toJSON()
              }]
            }
          },
          toBuffer: () => new TextEncoder().encode('mock-state-transition'),
          sign: function(_privateKey: any) {
            // Simulate signing by adding a signature
            this._signature = toBase64('mock-signature')
            return this
          }
        }
        
        return mockStateTransition
      }
    },
    
    broadcast: async (_stateTransition: any): Promise<void> => {
      console.log('[Mock] Broadcasting state transition')
      
      if (this.config.shouldFail) {
        throw new Error(this.config.failureReason || 'Mock broadcast failed')
      }
      
      // Simulate successful broadcast
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  signer = {
    signStateTransition: async (stateTransition: any): Promise<void> => {
      console.log('[Mock] Signing state transition')
      
      // Simulate popup delay
      await new Promise(resolve => setTimeout(resolve, this.config.approvalDelay))
      
      if (this.config.shouldFail) {
        throw new Error(this.config.failureReason || 'User rejected transaction')
      }
      
      // Simulate signing by modifying the state transition
      if (typeof stateTransition.sign === 'function') {
        stateTransition.sign('mock-private-key')
      } else {
        // If no sign method, just add signature property
        stateTransition._signature = toBase64('mock-signature')
      }
      
      // Simulate broadcasting
      await this.stateTransitions.broadcast(stateTransition)
      
      // Increment nonce after successful broadcast
      // Try to extract identity ID from the state transition
      let identityId = 'DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq' // Default
      
      // Check if state transition has identity info
      if (stateTransition.getOwnerId && typeof stateTransition.getOwnerId === 'function') {
        try {
          const ownerId = stateTransition.getOwnerId()
          identityId = ownerId?.toString() || identityId
        } catch (e) {
          // Ignore errors
        }
      } else if (stateTransition.identityId) {
        identityId = stateTransition.identityId
      } else if (stateTransition._identityId) {
        identityId = stateTransition._identityId
      }
      
      // Also check all tracked identities and increment their nonces
      // This ensures test identities get their nonces incremented
      for (const [, identity] of this.mockIdentities.entries()) {
        if (identity.lastUsedContractId) {
          identity.nonce += 1n
        }
      }
      
      console.log('[Mock] State transition signed and broadcasted')
    },
    
    signAndBroadcast: async (stateTransition: any): Promise<void> => {
      // Alias for signStateTransition
      return this.signer.signStateTransition(stateTransition)
    },
    
    // Add publicAPIClient to match extension structure
    publicAPIClient: {
      connect: async () => true,
      isConnected: () => true,
      getNetwork: () => 'testnet'
    }
  }
  
  // Helper methods for testing
  setApprovalDelay(delay: number) {
    this.config.approvalDelay = delay
  }
  
  setShouldFail(shouldFail: boolean, reason?: string) {
    this.config.shouldFail = shouldFail
    this.config.failureReason = reason
  }
  
  setIdentityBalance(identityId: string, balance: bigint) {
    const identity = this.mockIdentities.get(identityId)
    if (identity) {
      identity.balance = balance
    }
  }
  
  incrementNonce(identityId: string) {
    const identity = this.mockIdentities.get(identityId)
    if (identity) {
      identity.nonce += 1n
    }
  }
}

// Create a singleton instance that can be attached to window
let mockInstance: MockExtensionSDK | null = null

export function enableMockExtension(config?: MockConfig) {
  try {
    mockInstance = new MockExtensionSDK(config)
    
    // Attach to window object
    const targetWindow = (typeof window !== 'undefined' ? window : globalThis) as any
    if (targetWindow) {
      // Create a function that acts as both a function and an object
      const callableSDK = Object.assign(
        function() {
          console.warn('[Mock] window.dashPlatformSDK was called as a function')
          return mockInstance
        },
        mockInstance
      )
      
      // Ensure all properties are accessible
      Object.setPrototypeOf(callableSDK, mockInstance)
      
      // Add toString for edge cases
      callableSDK.toString = () => '[MockExtensionSDK]'
      callableSDK.valueOf = () => mockInstance as Object
      
      targetWindow.__mockExtensionEnabled = true
      targetWindow.__mockInstance = mockInstance // Store reference
      
      // Set the SDK on window
      targetWindow.dashPlatformSDK = callableSDK
      console.log('[Mock] Extension SDK enabled')
      
      // Monitor for overwrites only in real browser environment
      // Skip in test environment or when setInterval is not properly available
      if (typeof setInterval === 'function') {
        try {
          const checkInterval = setInterval(() => {
            if (targetWindow.__mockExtensionEnabled) {
              const current = targetWindow.dashPlatformSDK
              if (current !== callableSDK) {
                console.log('[Mock] Real extension tried to load - restoring mock')
                targetWindow.dashPlatformSDK = callableSDK
              }
            }
          }, 100)
          
          // Store interval ID for cleanup
          targetWindow.__mockCheckInterval = checkInterval
        } catch (e) {
          // Ignore timer errors in test environment
          console.log('[Mock] Timer monitoring not available in this environment')
        }
      }
      
    }
    
    return mockInstance
  } catch (error) {
    console.error('[Mock] Failed to enable extension:', error)
    throw error
  }
}

export function disableMockExtension() {
  const targetWindow = (typeof window !== 'undefined' ? window : globalThis) as any
  if (targetWindow) {
    targetWindow.__mockExtensionEnabled = false
    
    // Clear the check interval if it exists
    if (targetWindow.__mockCheckInterval && typeof clearInterval !== 'undefined') {
      clearInterval(targetWindow.__mockCheckInterval)
      delete targetWindow.__mockCheckInterval
    }
    
    // Try to restore real extension if it was stored
    if (targetWindow.__realDashPlatformSDK) {
      try {
        delete targetWindow.dashPlatformSDK
        targetWindow.dashPlatformSDK = targetWindow.__realDashPlatformSDK
        delete targetWindow.__realDashPlatformSDK
      } catch (e) {
        console.error('Failed to restore real extension:', e)
      }
    } else {
      try {
        delete targetWindow.dashPlatformSDK
      } catch (e) {
        // Ignore if can't delete
      }
    }
    
    delete targetWindow.__mockInstance
    console.log('[Mock] Extension SDK disabled')
  }
  mockInstance = null
}

export function getMockExtension(): MockExtensionSDK | null {
  return mockInstance
}