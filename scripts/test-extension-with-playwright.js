#!/usr/bin/env node

/**
 * Automated test for Dash Platform Extension using Playwright
 * 
 * Usage:
 *   EXTENSION_PATH=/path/to/extension npm run test:extension:playwright
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const EXTENSION_PATH = process.env.EXTENSION_PATH;
const EXTENSION_PASSWORD = process.env.EXTENSION_PASSWORD || 'password';
const TEST_PAGE_PATH = path.join(__dirname, '..', 'test-extension-publish.html');

async function runExtensionTest() {
  console.log('🚀 Starting Dash Platform Extension test with Playwright\n');

  if (!EXTENSION_PATH) {
    console.error('❌ Please set EXTENSION_PATH environment variable');
    console.log('Example: EXTENSION_PATH=/path/to/extension npm run test:extension:playwright');
    process.exit(1);
  }

  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error(`❌ Extension not found at: ${EXTENSION_PATH}`);
    process.exit(1);
  }

  console.log(`✅ Extension found at: ${EXTENSION_PATH}`);

  // Launch browser with extension
  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    viewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Add console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('PAGE:', msg.text());
      }
    });

    // Navigate to test page
    console.log('📄 Loading test page...');
    await page.goto(`file://${TEST_PAGE_PATH}`);

    // Wait for extension SDK
    await page.waitForFunction(() => window.dashPlatformSDK, {
      timeout: 10000
    });
    console.log('✅ Extension SDK detected\n');

    // Step 1: Check extension
    console.log('📋 Step 1: Checking extension...');
    await page.click('button:text("Check Extension")');
    await page.waitForTimeout(2000);

    // Step 2: Check nonce first
    console.log('\n📋 Step 2: Checking current nonce...');
    await page.click('button:text("Check Nonce")');
    await page.waitForTimeout(3000);
    
    // Step 3: Publish with retry handling
    console.log('\n📋 Step 3: Publishing document...');
    
    // Listen for new pages (extension popup)
    browser.on('page', async (popup) => {
      console.log('🔍 New window detected:', popup.url());
      
      if (popup.url().includes('extension://')) {
        console.log('🎯 Extension popup detected!');
        await handleExtensionPopup(popup);
      }
    });

    // Monitor console for retry attempts
    let retryCount = 0;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('already exists in mempool')) {
        retryCount++;
        console.log(`⚠️ Nonce conflict detected, retry ${retryCount}`);
      }
    });

    // Click publish
    await page.click('button:text("Test Publish")');

    // Wait for success (give more time for retries)
    const successLocator = page.locator('.log-entry:has-text("Success! Transaction hash:")');
    await successLocator.waitFor({ timeout: 60000 }); // 60 seconds to handle retries

    console.log('✅ Transaction published!');
    if (retryCount > 0) {
      console.log(`ℹ️ Required ${retryCount} nonce retries to succeed`);
    }

    // Get transaction details
    const txText = await successLocator.textContent();
    const txHash = txText?.match(/([a-f0-9]{64})/)?.[0];
    
    if (txHash) {
      console.log(`📋 Transaction hash: ${txHash}`);
      console.log(`🌐 View on Platform Explorer: https://testnet.platform-explorer.com/transactions/${txHash}`);
    }

    // Wait a bit
    console.log('\n⏳ Waiting 10 seconds for blockchain propagation...');
    await page.waitForTimeout(10000);

    // Step 4: Verify
    console.log('\n📋 Step 4: Verifying on blockchain...');
    await page.click('button:text("Verify on Chain")');
    await page.waitForTimeout(5000);

    // Check result
    const foundMessage = await page.locator('.log-entry:has-text("Our message found on blockchain!")').isVisible();
    
    if (foundMessage) {
      console.log('✅ Message verified on blockchain!');
    } else {
      console.log('⚠️ Message not found yet (may still be processing)');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take screenshot on failure
    const page = browser.pages()[0];
    if (page) {
      await page.screenshot({ path: 'test-failure.png' });
      console.log('📸 Screenshot saved: test-failure.png');
    }
    
    process.exit(1);
  }

  // Keep browser open
  console.log('\n💡 Browser will remain open for inspection. Press Ctrl+C to exit.');
}

async function handleExtensionPopup(popup) {
  console.log('🔐 Attempting to handle extension popup...');
  
  try {
    await popup.waitForLoadState('domcontentloaded');
    
    // Try password field
    const passwordField = await popup.$('input[type="password"]');
    if (passwordField) {
      console.log('🔑 Entering password...');
      await passwordField.fill(EXTENSION_PASSWORD);
    }

    // Try various approve buttons
    const buttonSelectors = [
      'button:has-text("Approve")',
      'button:has-text("Sign")', 
      'button:has-text("Confirm")',
      'button[type="submit"]'
    ];

    for (const selector of buttonSelectors) {
      const button = await popup.$(selector);
      if (button && await button.isVisible()) {
        console.log(`🖱️ Clicking: ${selector}`);
        await button.click();
        break;
      }
    }

    console.log('✅ Extension popup handled');
  } catch (error) {
    console.error('⚠️ Could not handle popup automatically:', error.message);
    console.log('Please approve manually in the extension popup');
  }
}

// Run the test
runExtensionTest().catch(console.error);