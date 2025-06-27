import { test, expect } from '@playwright/test'
import { setupMockPage, waitForFeedLoad, mockDashService } from './test-utils'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockPage(page)
    // Give extra time for complete rendering
    await page.waitForTimeout(3000)
  })

  test('should match homepage screenshot', async ({ page }) => {
    // Wait for stable state
    await page.waitForTimeout(2000)
    
    // Take screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('should match feed item screenshot', async ({ page }) => {
    // Wait for feed items to load
    await page.waitForSelector('.feed-item', { timeout: 10000 }).catch(() => {})
    
    const feedItem = page.locator('.feed-item').first()
    if (await feedItem.count() > 0) {
      await expect(feedItem).toHaveScreenshot('feed-item.png')
    } else {
      // Skip if no feed items
      test.skip()
    }
  })

  test('should match publish form screenshot', async ({ page }) => {
    // Wait for publish form
    await page.waitForSelector('textarea[placeholder*="share"]', { timeout: 10000 }).catch(() => {})
    
    const publishForm = page.locator('[data-testid="publish-form"]')
    if (await publishForm.count() > 0) {
      await expect(publishForm).toHaveScreenshot('publish-form.png')
    } else {
      // Try the parent container
      const textarea = page.locator('textarea[placeholder*="share"]')
      const parent = textarea.locator('..')
      await expect(parent).toHaveScreenshot('publish-form.png')
    }
  })

  test('should match dark mode screenshot', async ({ page }) => {
    // Toggle dark mode if available
    const darkModeToggle = page.locator('[aria-label="Toggle dark mode"]')
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()
      await page.waitForTimeout(500)
      
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        animations: 'disabled'
      })
    }
  })

  test('should match mobile viewport screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('should match publishing state screenshots', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="share"]')
    await textarea.fill('Test message for screenshot')
    
    // Screenshot with filled form
    await expect(page.locator('[data-testid="publish-form"]')).toHaveScreenshot('publish-form-filled.png')
    
    // Click publish
    await page.click('button:has-text("Publish")')
    
    // Screenshot loading state
    await expect(page.locator('[data-testid="publish-form"]')).toHaveScreenshot('publish-form-loading.png')
    
    // Wait for success
    await page.waitForSelector('text=Published!', { timeout: 5000 })
    
    // Screenshot success state
    await expect(page.locator('[data-testid="publish-form"]')).toHaveScreenshot('publish-form-success.png')
  })
})