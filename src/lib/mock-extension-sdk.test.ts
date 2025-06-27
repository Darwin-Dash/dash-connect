import { describe, it, expect, afterEach } from 'vitest'
import { MockExtensionSDK, enableMockExtension, disableMockExtension } from './mock-extension-sdk'

describe('MockExtensionSDK', () => {
  afterEach(() => {
    disableMockExtension()
  })

  it('should create a mock instance', () => {
    const mock = new MockExtensionSDK()
    expect(mock).toBeInstanceOf(MockExtensionSDK)
    expect(mock.identities).toBeDefined()
    expect(mock.documents).toBeDefined()
    expect(mock.stateTransitions).toBeDefined()
    expect(mock.signer).toBeDefined()
  })

  it('should enable mock extension on window', () => {
    enableMockExtension()
    expect(window.dashPlatformSDK).toBeDefined()
    expect(window.dashPlatformSDK!.identities).toBeDefined()
    expect(window.dashPlatformSDK!.documents).toBeDefined()
    expect(window.dashPlatformSDK!.stateTransitions).toBeDefined()
    expect(window.dashPlatformSDK!.signer).toBeDefined()
    // Check it's callable
    expect(() => (window.dashPlatformSDK as any)()).not.toThrow()
    expect((window as any).__mockExtensionEnabled).toBe(true)
  })

  it('should handle identity operations', async () => {
    const mock = new MockExtensionSDK()
    const nonce = await mock.identities.getIdentityContractNonce('test-id', 'test-contract')
    expect(nonce).toBe(0n)
    
    const balance = await mock.identities.getBalance('test-id')
    expect(balance).toBe(1000000000000)
  })
})