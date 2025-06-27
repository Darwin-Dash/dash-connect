/**
 * Extension adapter to handle differences between extension API versions
 * and provide a consistent interface for the app
 */

export interface ExtensionAdapter {
  getCurrentIdentity(): Promise<string | null>
  signStateTransition(stateTransition: any): Promise<void>
  exploreAPI(): void
}

export class DashExtensionAdapter implements ExtensionAdapter {
  private ext: any

  constructor(extensionSDK: any) {
    this.ext = extensionSDK
  }

  /**
   * Get the current active identity from the extension
   * Tries multiple methods as different versions may have different APIs
   */
  async getCurrentIdentity(): Promise<string | null> {
    console.log('🔍 [Adapter] Getting current identity...')
    
    // Method 1: Direct getCurrentIdentity
    if (typeof this.ext.identities?.getCurrentIdentity === 'function') {
      try {
        const identity = await this.ext.identities.getCurrentIdentity()
        const id = this.extractIdentityId(identity)
        if (id) {
          console.log('✅ [Adapter] Got identity via identities.getCurrentIdentity:', id)
          return id
        }
      } catch (e) {
        console.log('⚠️ [Adapter] identities.getCurrentIdentity failed:', e instanceof Error ? e.message : String(e))
      }
    }
    
    // Method 2: Wallet API
    if (typeof this.ext.wallet?.getCurrentIdentity === 'function') {
      try {
        const identity = await this.ext.wallet.getCurrentIdentity()
        const id = this.extractIdentityId(identity)
        if (id) {
          console.log('✅ [Adapter] Got identity via wallet.getCurrentIdentity:', id)
          return id
        }
      } catch (e) {
        console.log('⚠️ [Adapter] wallet.getCurrentIdentity failed:', e instanceof Error ? e.message : String(e))
      }
    }
    
    // Method 3: Get all identities and use first
    if (typeof this.ext.identities?.getIdentities === 'function') {
      try {
        const identities = await this.ext.identities.getIdentities()
        if (Array.isArray(identities) && identities.length > 0) {
          const id = this.extractIdentityId(identities[0])
          if (id) {
            console.log('✅ [Adapter] Got identity from first available:', id)
            return id
          }
        }
      } catch (e) {
        console.log('⚠️ [Adapter] identities.getIdentities failed:', e instanceof Error ? e.message : String(e))
      }
    }
    
    // Method 4: Check extension UI/state (browser-specific)
    try {
      const identityFromUI = await this.detectIdentityFromExtensionUI()
      if (identityFromUI) {
        console.log('✅ [Adapter] Got identity from extension UI:', identityFromUI)
        return identityFromUI
      }
    } catch (e) {
      // Ignore UI detection errors
    }
    
    console.log('⚠️ [Adapter] No identity found')
    return null
  }

  /**
   * Sign a state transition - simplified to match HTML file approach
   */
  async signStateTransition(stateTransition: any): Promise<void> {
    console.log('📝 [Adapter] Signing state transition (simplified)...')
    
    // Just call signStateTransition directly like the HTML file
    await this.ext.signer.signStateTransition(stateTransition)
    console.log('✅ [Adapter] Transaction signed and broadcast!')
  }

  /**
   * Explore the extension API for debugging
   */
  exploreAPI(): void {
    console.log('🔍 [Adapter] Exploring Extension API...')
    
    console.log('📋 Top-level:', Object.keys(this.ext))
    
    if (this.ext.identities) {
      console.log('📋 Identities:', Object.keys(this.ext.identities))
    }
    
    if (this.ext.wallet) {
      console.log('📋 Wallet:', Object.keys(this.ext.wallet))
    }
    
    if (this.ext.signer) {
      console.log('📋 Signer:', Object.keys(this.ext.signer))
      if (this.ext.signer.publicAPIClient) {
        console.log('  - PublicAPIClient:', Object.keys(this.ext.signer.publicAPIClient))
      }
    }
    
    if (this.ext.documents) {
      console.log('📋 Documents:', Object.keys(this.ext.documents))
    }
    
    if (this.ext.stateTransitions) {
      console.log('📋 StateTransitions:', Object.keys(this.ext.stateTransitions))
      if (this.ext.stateTransitions.documentsBatch) {
        console.log('  - documentsBatch:', Object.keys(this.ext.stateTransitions.documentsBatch))
      }
    }
  }

  /**
   * Helper to extract identity ID from various formats
   */
  private extractIdentityId(identity: any): string | null {
    if (!identity) return null
    
    if (typeof identity === 'string') {
      return identity
    }
    
    if (typeof identity.toString === 'function') {
      return identity.toString()
    }
    
    if (typeof identity.getId === 'function') {
      const id = identity.getId()
      return typeof id === 'string' ? id : id?.toString() || null
    }
    
    if (identity.id) {
      return typeof identity.id === 'string' ? identity.id : identity.id.toString()
    }
    
    return null
  }

  /**
   * Try to detect identity from extension UI (browser-specific hack)
   */
  private async detectIdentityFromExtensionUI(): Promise<string | null> {
    // This is a fallback method that tries to read the identity from
    // the extension's UI if it's visible in the DOM
    // This is browser-specific and may not work in all cases
    
    try {
      // Check for extension popup iframe or injected elements
      const extensionElements = document.querySelectorAll('[data-dash-identity], [data-identity-id]')
      if (extensionElements.length > 0) {
        const identity = extensionElements[0].getAttribute('data-dash-identity') || 
                        extensionElements[0].getAttribute('data-identity-id')
        if (identity) {
          return identity
        }
      }
      
      // Check localStorage (some extensions might store current identity)
      const stored = localStorage.getItem('dash-current-identity')
      if (stored) {
        return stored
      }
    } catch (e) {
      // Ignore errors in this fallback method
    }
    
    return null
  }

  /**
   * Log state transition details for debugging
   */
  // @ts-ignore - Method is kept for debugging purposes
  private logStateTransitionDetails(stage: string, stateTransition: any): void {
    try {
      if (typeof stateTransition.toJSON === 'function') {
        const json = stateTransition.toJSON()
        console.log(`📋 [Adapter] State transition ${stage}:`, {
          type: json.type,
          hasSignature: !!json.signature,
          signatureLength: json.signature?.length,
          signaturePreview: json.signature ? 
            json.signature.substring(0, 20) + '...' : 'none',
          transitions: json.transitions?.length
        })
      } else {
        console.log(`📋 [Adapter] State transition ${stage}: [no toJSON method]`)
      }
    } catch (e) {
      console.log(`⚠️ [Adapter] Could not log state transition ${stage}`)
    }
  }

  /**
   * Debug extension state for troubleshooting
   */
  // @ts-ignore - Method is kept for debugging purposes
  private async debugExtensionState(): Promise<void> {
    console.log('🔍 [Adapter] Debugging extension state...')
    
    try {
      // Try to get current identity
      const identity = await this.getCurrentIdentity()
      console.log('Current identity:', identity)
      
      // Check if extension has active wallet
      if (this.ext.wallet?.isActive) {
        const isActive = await this.ext.wallet.isActive()
        console.log('Wallet active:', isActive)
      }
      
      // Check network
      if (this.ext.signer?.publicAPIClient?.getNetwork) {
        const network = await this.ext.signer.publicAPIClient.getNetwork()
        console.log('Network:', network)
      }
    } catch (e) {
      console.log('⚠️ [Adapter] Debug failed:', e instanceof Error ? e.message : String(e))
    }
  }
}