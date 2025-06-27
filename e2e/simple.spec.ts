import { test, expect } from '@playwright/test'

test.describe('Simple App Tests', () => {
  // Skip browser projects that require special setup
  test.skip(({ browserName }) => browserName !== 'chromium', 'Only run on chromium')

  test('app should load successfully', async ({ page }) => {
    // Go to the app
    await page.goto('/')
    
    // Wait for React to load - the app shows either loading state or the main content
    const appLoaded = await page.waitForSelector(
      'text=/Dash Feed|Loading|Initializing/i',
      { timeout: 10000 }
    ).catch(() => null)
    
    expect(appLoaded).not.toBeNull()
  })

  test('app should show content when mock extension is enabled', async ({ page }) => {
    // The dev server is already running with VITE_USE_MOCK_EXTENSION=true
    await page.goto('/')
    
    // Wait for either the app content or an error message
    await page.waitForTimeout(3000)
    
    // Check if we have any meaningful content
    const hasContent = await page.evaluate(() => {
      const body = document.body.innerText
      return body.length > 50 // More than just scripts
    })
    
    expect(hasContent).toBe(true)
  })

  test('mock extension should initialize when environment is set', async ({ page }) => {
    // When running with VITE_USE_MOCK_EXTENSION=true, the mock should be available
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const mockStatus = await page.evaluate(() => {
      return {
        hasMockFlag: !!(window as any).__mockExtensionEnabled,
        hasSDK: !!(window as any).dashPlatformSDK
      }
    })
    
    console.log('Mock status:', mockStatus)
    
    // With VITE_USE_MOCK_EXTENSION=true, we should have the mock
    expect(mockStatus.hasMockFlag).toBe(true)
  })
})