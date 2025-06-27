/**
 * Wrapper to handle cases where window.dashPlatformSDK might be called as a function
 */

import { MockExtensionSDK } from './mock-extension-sdk'

export function createMockExtensionWrapper(mockSDK: MockExtensionSDK) {
  // Create a function that returns the SDK
  const wrapper = function() {
    console.warn('⚠️ window.dashPlatformSDK was called as a function - returning SDK instance')
    return mockSDK
  }
  
  // Copy all properties from the mock SDK to the wrapper function
  Object.setPrototypeOf(wrapper, mockSDK)
  Object.assign(wrapper, mockSDK)
  
  // Ensure all SDK properties are accessible
  for (const key in mockSDK) {
    if (!(key in wrapper)) {
      Object.defineProperty(wrapper, key, {
        get() {
          return (mockSDK as any)[key]
        },
        set(value) {
          (mockSDK as any)[key] = value
        },
        enumerable: true,
        configurable: true
      })
    }
  }
  
  return wrapper
}