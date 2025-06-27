# Intermittent Failure Solution Guide

## Root Cause Identified

The issue is caused by the browser extension's internal state management:

1. **Nonce Reset**: The extension keeps resetting the nonce from 68 back to 67
2. **4th Request Pattern**: Failures consistently occur on the 4th request
3. **Extension State Issue**: The extension appears to lose signing context after 3 operations

## Immediate Workarounds

### Option 1: Add Delays (Recommended)
Add a 30-second delay between requests:
```javascript
// Wait 30 seconds between publishing messages
await new Promise(resolve => setTimeout(resolve, 30000))
```

### Option 2: Refresh After 3 Requests
After 3 successful publishes:
1. Refresh the page (F5)
2. Wait for extension to reconnect
3. Continue publishing

### Option 3: Restart Extension
1. Close the extension popup
2. Disable and re-enable the extension
3. Reconnect to the app

## Using the Test Tool

1. Open `test-intermittent-failure.html`
2. Set delay to 30 seconds
3. Run "Test Batch" or "Test Until Failure"
4. Observe the pattern

## What the Logs Show

```
✅ Request 1: Success (nonce: 68)
✅ Request 2: Success (nonce: 68) ⚠️ Nonce reset to 67!
✅ Request 3: Success (nonce: 68) ⚠️ Nonce reset to 67!
❌ Request 4: FAILURE - "Signature is missing"
```

The nonce constantly resets, indicating the extension isn't properly maintaining state.

## Long-term Solution

This needs to be fixed in the browser extension itself:
1. Extension should maintain consistent state across multiple operations
2. Nonce tracking should persist properly
3. The 3-operation limit should be removed or documented

## Analytics Output

When a failure occurs, you'll see:
```
📊 Request Analytics:
  Total requests: 4
  Success rate: 75%
  
🔍 Failure Patterns Detected:
  - Failures occur on every 4th request
  - All failures are "Signature is missing" errors

💡 Recommendations:
  - The extension may have a limit of 3 consecutive operations
  - Try: Close and reopen extension after 3 requests
  - Add a 15-30 second delay between requests
```

## Code Example with Workaround

### Option 1: Use the Safe Publish Helper (Recommended)
```javascript
import { safePublish } from './src/lib/safe-publish-helper'

// Automatically handles the 3-operation limit
await safePublish.publish(
  contractId, 
  'note', 
  { message: 'Hello' }, 
  identity
)

// The helper will:
// - Track consecutive requests
// - Stop at 3 (safe limit)
// - Wait 30 seconds automatically
// - Reset on failures
```

### Option 2: Manual Implementation
```javascript
// Track requests manually
let requestCount = 0

async function publishWithSafetyCheck(message) {
  requestCount++
  
  // Safety check for requests 4-5
  if (requestCount >= 4) {
    console.log('⚠️ Approaching extension limit...')
    console.log('⏰ Adding 30s safety delay...')
    await new Promise(resolve => setTimeout(resolve, 30000))
    requestCount = 0  // Reset counter
  }
  
  try {
    const txHash = await dashService.createDocument(
      contractId,
      'note',
      { message },
      identity
    )
    console.log('✅ Success:', txHash)
  } catch (error) {
    console.error('❌ Failed:', error)
    requestCount = 0  // Reset on failure
    // Analytics will be automatically displayed
  }
}
```

### Option 3: Batch Processing with Breaks
```javascript
// Process multiple items with automatic breaks
async function publishBatch(messages) {
  for (let i = 0; i < messages.length; i++) {
    // Take a break every 3 messages
    if (i > 0 && i % 3 === 0) {
      console.log('🛑 Taking a 30s break after 3 publishes...')
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
    
    await dashService.createDocument(
      contractId,
      'note', 
      { message: messages[i] },
      identity
    )
  }
}
```