import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dashService } from './dash-service'
import { enableMockExtension, disableMockExtension, getMockExtension } from './mock-extension-sdk'

describe('DashService with Mock Extension', () => {
  
  beforeEach(async () => {
    // Enable mock extension before each test
    enableMockExtension({
      autoApprove: true,
      approvalDelay: 100, // Fast for tests
      identityBalance: 1000000000000n
    })
    
    // Wait a bit for the mock to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Reinitialize the extension SDK to detect the mock
    dashService.reinitializeExtensionSDK()
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 300))
  })
  
  afterEach(() => {
    // Clean up after each test
    disableMockExtension()
    vi.restoreAllMocks()
  })
  
  describe('createDocument', () => {
    it('should successfully create and broadcast a document', async () => {
      const contractId = import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3'
      const identityId = import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
      const result = await dashService.createDocument(
        contractId,
        'note',
        { message: 'Test message' },
        identityId
      )
      
      expect(result).toMatch(/^mock-hash-\d+$/)
    }, 10000) // 45 second timeout for verification
    
    it('should handle user rejection', async () => {
      const mockExt = getMockExtension()
      mockExt?.setShouldFail(true, 'User rejected transaction')
      
      await expect(
        dashService.createDocument(
          import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
          'note',
          { message: 'Test message' },
          import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
        )
      ).rejects.toThrow('rejected')
    }, 10000)
    
    it('should handle insufficient balance', async () => {
      const mockExt = getMockExtension()
      const testIdentityId = import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
      mockExt?.setIdentityBalance(testIdentityId, 500n) // Less than MIN_BALANCE (1000)
      
      // Need to mock the getIdentityBalance method since it uses readOnlySDK
      vi.spyOn(dashService, 'getIdentityBalance').mockResolvedValue(500)
      
      await expect(
        dashService.createDocument(
          import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
          'note',
          { message: 'Test message' },
          import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
        )
      ).rejects.toThrow('Insufficient Credits')
    }, 10000)
    
    it('should handle timeout', async () => {
      // Instead of mocking timers, we'll reduce the signing timeout
      // by mocking the setTimeout to trigger immediately
      const originalSetTimeout = globalThis.setTimeout
      
      globalThis.setTimeout = ((callback: any, delay: number) => {
        if (delay === 120000) { // Our signing timeout
          // Trigger it immediately
          Promise.resolve().then(() => callback())
          return 1
        }
        return originalSetTimeout(callback, delay)
      }) as any
      
      try {
        await expect(
          dashService.createDocument(
            import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
            'note',
            { message: 'Test message' },
            testIdentityId
          )
        ).rejects.toThrow('timed out')
      } finally {
        globalThis.setTimeout = originalSetTimeout
      }
    }, 10000)
  })
  
  describe('Extension State', () => {
    it('should detect mock extension as available', async () => {
      const status = await dashService.getExtensionStatus()
      
      expect(status.status).toBe('available')
      expect(status.isReady).toBe(true)
    })
    
    it('should detect when extension is not available', async () => {
      disableMockExtension()
      dashService.reinitializeExtensionSDK()
      const status = await dashService.getExtensionStatus()
      
      expect(status.status).toBe('not-available')
      expect(status.isReady).toBe(false)
    })
  })
  
  describe('Identity Balance', () => {
    it('should check identity balance', async () => {
      const balance = await dashService.getIdentityBalance(
        import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
      )
      
      // The getIdentityBalance method uses readOnlySDK which queries the real network
      // So we expect the real balance from testnet
      expect(typeof balance === 'number' || typeof balance === 'bigint').toBe(true)
      expect(Number(balance)).toBeGreaterThan(0)
    })
  })
})

describe('DashService State Transition Signing', () => {
  let consoleLogSpy: any
  
  beforeEach(() => {
    // Spy on console.log to verify our enhanced logging
    consoleLogSpy = vi.spyOn(console, 'log')
    
    enableMockExtension({
      autoApprove: true,
      approvalDelay: 100
    })
    
    // Reinitialize the extension SDK to detect the mock
    dashService.reinitializeExtensionSDK()
  })
  
  afterEach(() => {
    consoleLogSpy.mockRestore()
    disableMockExtension()
  })
  
  it('should log state transition details before signing', async () => {
    await dashService.createDocument(
      import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
      'note',
      { message: 'Test' },
      import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
    )
    
    // Check that state transition details were logged
    const stDetailsLog = consoleLogSpy.mock.calls.find(
      (call: any[]) => call[0]?.includes('📋 State transition details:')
    )
    expect(stDetailsLog).toBeDefined()
    
    const details = stDetailsLog[1]
    expect(details).toHaveProperty('hash')
    expect(details).toHaveProperty('type')
    expect(details).toHaveProperty('hasToJSON')
    expect(details).toHaveProperty('hasSign')
  }, 10000)
  
  it('should log state transition JSON structure', async () => {
    await dashService.createDocument(
      import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
      'note',
      { message: 'Test' },
      import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
    )
    
    // Check that JSON structure was logged
    const jsonLog = consoleLogSpy.mock.calls.find(
      (call: any[]) => call[0]?.includes('📄 State transition JSON structure:')
    )
    expect(jsonLog).toBeDefined()
    
    const structure = jsonLog[1]
    expect(structure).toHaveProperty('type')
    expect(structure).toHaveProperty('hasSignature')
    expect(structure).toHaveProperty('transitions')
  }, 10000)
  
  it('should log signature status after signing', async () => {
    await dashService.createDocument(
      import.meta.env.VITE_DATA_CONTRACT_ID || '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
      'note',
      { message: 'Test' },
      import.meta.env.VITE_IDENTITY_ID || '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
    )
    
    // Check that signature was checked after signing
    const afterSignLog = consoleLogSpy.mock.calls.find(
      (call: any[]) => call[0]?.includes('📄 State transition after signing:')
    )
    expect(afterSignLog).toBeDefined()
    
    const signatureInfo = afterSignLog[1]
    expect(signatureInfo).toHaveProperty('hasSignature')
    expect(signatureInfo.hasSignature).toBe(true)
  }, 10000)
})