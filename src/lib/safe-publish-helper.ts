/**
 * Safe publishing helper that respects the extension's rate limits
 * Automatically handles the 3-5 operation limit with configurable strategies
 */

import { dashService } from './dash-service'

export interface SafePublishOptions {
  maxConsecutiveRequests?: number  // Default: 3 (safe limit)
  delayBetweenRequests?: number    // Default: 0 (milliseconds)
  delayAfterLimit?: number         // Default: 30000 (30 seconds)
  onLimitReached?: () => void      // Callback when limit is reached
}

class SafePublishHelper {
  private consecutiveRequests = 0
  private lastRequestTime = 0
  
  async publish(
    dataContractId: string,
    documentType: string,
    data: any,
    identity: string,
    options: SafePublishOptions = {}
  ): Promise<string> {
    const {
      maxConsecutiveRequests = 3,  // Safe default
      delayBetweenRequests = 0,
      delayAfterLimit = 30000,
      onLimitReached
    } = options
    
    // Check if we've hit the limit
    if (this.consecutiveRequests >= maxConsecutiveRequests) {
      console.log(`🛑 Reached safe limit of ${maxConsecutiveRequests} consecutive requests`)
      console.log(`⏳ Waiting ${delayAfterLimit / 1000} seconds before continuing...`)
      
      if (onLimitReached) {
        onLimitReached()
      }
      
      await new Promise(resolve => setTimeout(resolve, delayAfterLimit))
      this.consecutiveRequests = 0  // Reset counter
    }
    
    // Add delay between requests if configured
    if (delayBetweenRequests > 0 && this.lastRequestTime > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime
      const remainingDelay = delayBetweenRequests - timeSinceLastRequest
      
      if (remainingDelay > 0) {
        console.log(`⏳ Waiting ${remainingDelay / 1000}s between requests...`)
        await new Promise(resolve => setTimeout(resolve, remainingDelay))
      }
    }
    
    try {
      // Attempt to publish
      const txHash = await dashService.createDocument(
        dataContractId,
        documentType,
        data,
        identity
      )
      
      // Success - increment counter
      this.consecutiveRequests++
      this.lastRequestTime = Date.now()
      
      console.log(`✅ Published successfully (${this.consecutiveRequests}/${maxConsecutiveRequests})`)
      
      return txHash
    } catch (error) {
      // On failure, log analytics
      console.error('❌ Publish failed:', error)
      
      // Reset counter on failure (extension needs recovery time)
      this.consecutiveRequests = 0
      
      throw error
    }
  }
  
  // Reset the helper's state
  reset(): void {
    this.consecutiveRequests = 0
    this.lastRequestTime = 0
    console.log('🔄 Safe publish helper reset')
  }
  
  // Get current state
  getState(): { consecutiveRequests: number, canPublish: boolean } {
    return {
      consecutiveRequests: this.consecutiveRequests,
      canPublish: this.consecutiveRequests < 3  // Use safe default
    }
  }
}

export const safePublish = new SafePublishHelper()

// Example usage:
/*
import { safePublish } from './safe-publish-helper'

// Basic usage with safe defaults
await safePublish.publish(contractId, 'note', { message: 'Hello' }, identity)

// Custom configuration
await safePublish.publish(contractId, 'note', { message: 'Hello' }, identity, {
  maxConsecutiveRequests: 4,     // Living dangerously
  delayBetweenRequests: 5000,    // 5s between each request
  delayAfterLimit: 60000,        // 1 minute cooldown
  onLimitReached: () => {
    console.log('Taking a break...')
  }
})

// Check state
const { canPublish } = safePublish.getState()
if (!canPublish) {
  console.log('Need to wait before publishing again')
}

// Reset after error or page refresh
safePublish.reset()
*/