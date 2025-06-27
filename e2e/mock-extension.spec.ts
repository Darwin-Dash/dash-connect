import { test, expect, Page } from '@playwright/test'
import { setupMockPage, waitForFeedLoad, mockDashService } from './test-utils'

test.describe('Mock Extension Integration', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should load app with mock extension', async () => {
    await setupMockPage(page)
    
    // Wait for app to load
    await expect(page.locator('h1')).toContainText('Dash Feed')
    
    // Check for extension status indicator
    await expect(page.locator('text=Publishing available')).toBeVisible({ timeout: 10000 })
  })

  test('should show publish form when mock extension is available', async () => {
    await setupMockPage(page)
    
    // Wait for publish form to appear
    await expect(page.locator('textarea[placeholder*="share"]')).toBeVisible({ timeout: 10000 })
  })

  test('should publish a message with mock extension', async () => {
    await setupMockPage(page)
    await mockDashService(page)
    
    // Wait for publish form
    const textarea = page.locator('textarea[placeholder*="share"]')
    await expect(textarea).toBeVisible({ timeout: 10000 })
    
    // Type a test message
    const testMessage = `Test message from Playwright ${Date.now()}`
    await textarea.fill(testMessage)
    
    // Click publish button
    await page.click('button:has-text("Publish")')
    
    // Wait for success (mock has 1.5s delay)
    await expect(page.locator('text=Publishing...')).toBeVisible()
    await expect(page.locator('text=Published!')).toBeVisible({ timeout: 5000 })
    
    // Verify message appears in feed
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 10000 })
  })

  test('should handle rejection from mock extension', async () => {
    // This would require configuring the mock to reject
    // For now, we'll skip this test
    test.skip()
  })
})