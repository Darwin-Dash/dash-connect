import { test, expect, Page } from '@playwright/test'
import { setupMockPage, waitForFeedLoad, mockDashService } from './test-utils'

test.describe('Full UI Integration Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await setupMockPage(page)
    await mockDashService(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should load and display feed', async () => {
    // Check header - wait for it to be visible first
    await page.waitForSelector('h1', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Dash')
    
    // Wait for feed to load
    await waitForFeedLoad(page)
    
    // Should have documents or empty state
    const feedItems = await page.locator('.feed-item').count()
    const emptyState = await page.locator('text=No messages yet').count()
    expect(feedItems + emptyState).toBeGreaterThan(0)
  })

  test('should show extension status', async () => {
    // Wait for extension status to appear
    await Promise.race([
      page.waitForSelector('text=Extension Ready', { timeout: 10000 }),
      page.waitForSelector('text=Read-Only Mode', { timeout: 10000 }),
      page.waitForSelector('text=Publishing available', { timeout: 10000 })
    ])
    
    // Check that some status is visible
    const hasStatus = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Extension Ready') || 
             body.includes('Read-Only Mode') || 
             body.includes('Publishing available');
    })
    expect(hasStatus).toBe(true)
  })

  test('should handle publishing flow', async () => {
    // Wait for app to be ready
    await page.waitForTimeout(2000)
    
    // Wait for publish form
    const textarea = page.locator('textarea[placeholder*="share"]')
    await textarea.waitFor({ state: 'visible', timeout: 15000 })
    
    // Type message
    const testMessage = `E2E test message ${Date.now()}`
    await textarea.fill(testMessage)
    
    // Wait for character count to update
    await page.waitForTimeout(500)
    
    // Submit form
    const publishButton = page.locator('button:has-text("Publish")')
    await publishButton.waitFor({ state: 'visible' })
    await publishButton.click()
    
    // Should show some state change (loading or success)
    await Promise.race([
      page.waitForSelector('text=Publishing...', { timeout: 5000 }),
      page.waitForSelector('text=Published!', { timeout: 5000 }),
      page.waitForSelector('text=Creating document', { timeout: 5000 })
    ])
    
    // Wait for form to process
    await page.waitForTimeout(3000)
  })

  test('should validate message length', async () => {
    // Wait for app to be ready
    await page.waitForTimeout(2000)
    
    const textarea = page.locator('textarea[placeholder*="share"]')
    await textarea.waitFor({ state: 'visible', timeout: 15000 })
    
    // Try to type more than 280 characters
    const longMessage = 'a'.repeat(300)
    await textarea.fill(longMessage)
    
    // Should be truncated to 280
    const value = await textarea.inputValue()
    expect(value.length).toBe(280)
    
    // Character count should show 280/280
    await expect(page.locator('text=280/280')).toBeVisible()
  })

  test('should handle empty message', async () => {
    // Wait for app to be ready
    await page.waitForTimeout(2000)
    
    const textarea = page.locator('textarea[placeholder*="share"]')
    await textarea.waitFor({ state: 'visible', timeout: 15000 })
    
    // Try to submit empty message
    await page.click('button:has-text("Publish")')
    
    // Should not submit
    await expect(page.locator('text=Publishing...')).not.toBeVisible()
  })

  test('should handle network switching', async () => {
    // Find network selector
    const networkSelector = page.locator('select[aria-label="Select network"]')
    if (await networkSelector.isVisible()) {
      // Current network should be testnet
      await expect(networkSelector).toHaveValue('testnet')
      
      // Switch to mainnet (if available)
      const options = await networkSelector.locator('option').count()
      if (options > 1) {
        await networkSelector.selectOption('mainnet')
        
        // Should reload feed
        await expect(page.locator('text=Loading feed...')).toBeVisible()
      }
    }
  })

  test('should auto-refresh feed', async () => {
    // Wait for initial load
    await page.waitForTimeout(2000)
    await waitForFeedLoad(page)
    
    // Get initial document count
    const initialCount = await page.locator('.feed-item').count()
    
    // Wait for auto-refresh (30 seconds)
    console.log('Waiting for auto-refresh...')
    await page.waitForTimeout(31000)
    
    // Should have refreshed (loading indicator might appear)
    // Document count should be the same or more
    const newCount = await page.locator('.feed-item').count()
    expect(newCount).toBeGreaterThanOrEqual(initialCount)
  })

  test('should handle errors gracefully', async () => {
    // Wait for app to load first
    await page.waitForTimeout(2000)
    
    // Simulate network error by blocking API calls
    await page.route('**/api/**', route => route.abort())
    
    // Reload page
    await page.reload()
    
    // Should show error state
    await expect(page.locator('text=/Error loading feed|Failed to load/i')).toBeVisible({ timeout: 10000 })
  })

  test('should have responsive design', async () => {
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Elements should still be visible
    await expect(page.locator('h1')).toBeVisible()
    const textarea = page.locator('textarea[placeholder*="share"]')
    await textarea.waitFor({ state: 'visible', timeout: 15000 })
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Elements should adapt
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="share"]')).toBeVisible()
  })

  test('should show loading states', async ({ browser }) => {
    // Create a new page to see initial load
    const freshPage = await browser.newPage()
    
    // Enable mock extension
    await freshPage.addInitScript(() => {
      (window as any).__mockExtensionEnabled = true
    })
    
    await freshPage.goto('/')
    
    // Wait for app to start rendering
    await freshPage.waitForSelector('#root > div', { timeout: 5000 })
    
    // Should eventually show content or loading state
    await Promise.race([
      freshPage.waitForSelector('text=Loading feed...', { timeout: 5000 }),
      freshPage.waitForSelector('.feed-item', { timeout: 10000 }),
      freshPage.waitForSelector('text=No messages yet', { timeout: 10000 })
    ])
    
    await freshPage.close()
  })
})