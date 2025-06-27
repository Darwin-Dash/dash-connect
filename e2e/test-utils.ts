import { Page } from '@playwright/test'

/**
 * Initialize mock extension and wait for it to be ready
 */
export async function initializeMockExtension(page: Page) {
  // Enable mock extension before page loads
  await page.addInitScript(() => {
    // Mark that we want mock extension
    (window as any).__mockExtensionEnabled = true;
    
    // Override fetch to return mock feed data
    const originalFetch = window.fetch;
    (window as any).__originalFetch = originalFetch;
    
    // Simple mock for feed data
    (window as any).__mockFeedData = [
      {
        $id: 'mock-doc-1',
        $ownerId: 'mock-owner-1',
        $dataContractId: 'mock-contract',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        message: 'Mock message 1 for testing'
      },
      {
        $id: 'mock-doc-2',
        $ownerId: 'mock-owner-2',
        $dataContractId: 'mock-contract',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        message: 'Mock message 2 for testing'
      }
    ];
  });
}

/**
 * Wait for mock extension to be fully initialized
 */
export async function waitForMockExtension(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      return !!(window as any).dashPlatformSDK && 
             !!(window as any).dashPlatformSDK.signer &&
             !!(window as any).dashPlatformSDK.documents;
    },
    { timeout }
  );
  
  // Give it a bit more time for all initialization
  await page.waitForTimeout(500);
}

/**
 * Wait for feed to load (either real or mock data)
 */
export async function waitForFeedLoad(page: Page, timeout = 10000) {
  // Wait for app to be fully rendered first
  await page.waitForSelector('#root > div', { timeout: 5000 });
  
  // Wait for the app to initialize
  await page.waitForTimeout(1000);
  
  // Then wait for either feed items or empty state
  await Promise.race([
    page.waitForSelector('.feed-item', { timeout }),
    page.waitForSelector('text=No messages yet', { timeout }),
    page.waitForSelector('text=Be the first to share', { timeout }),
    page.waitForSelector('[data-testid="feed-list"]', { timeout })
  ]).catch(() => {
    // If nothing found, wait a bit more
    return page.waitForTimeout(2000);
  });
}

/**
 * Setup page with mock extension and navigate
 */
export async function setupMockPage(page: Page, url = '/') {
  await initializeMockExtension(page);
  
  // Navigate to the page (this will trigger the mock extension setup)
  await page.goto(url);
  
  // Wait for React to render
  await page.waitForSelector('#root > div', { timeout: 5000 });
  
  // Wait a bit for the app to initialize
  await page.waitForTimeout(1500);
  
  // Wait for either extension ready or read-only mode
  await Promise.race([
    page.waitForSelector('text=Extension Ready', { timeout: 5000 }),
    page.waitForSelector('text=Read-Only Mode', { timeout: 5000 }),
    page.waitForSelector('text=Publishing available', { timeout: 5000 })
  ]).catch(() => {
    // Continue even if status not found
  });
  
  // Additional wait for stability
  await page.waitForTimeout(500);
}

/**
 * Mock the dash service to return test data
 */
export async function mockDashService(page: Page) {
  await page.evaluate(() => {
    // Wait for dash service to be available
    const waitForService = setInterval(() => {
      const dashService = (window as any).dashService || 
                         ((window as any).require && (window as any).require('./lib/dash-service')?.dashService);
      
      if (dashService && dashService.queryDocuments) {
        clearInterval(waitForService);
        
        // Store original method
        const originalQuery = dashService.queryDocuments.bind(dashService);
        
        // Mock the query method
        dashService.queryDocuments = async () => {
          console.log('[E2E Mock] Returning mock documents');
          return (window as any).__mockFeedData || [];
        };
        
        // Store reference for restoration
        (window as any).__originalQueryDocuments = originalQuery;
      }
    }, 100);
  });
}