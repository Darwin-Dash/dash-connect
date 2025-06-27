# Troubleshooting Guide

This guide helps you resolve common issues with the Dash Feed App. If you can't find a solution here, please check the [GitHub Issues](https://github.com/dash-feed-app/issues) or open a new one.

## Table of Contents

- [Extension Issues](#extension-issues)
- [SDK Errors](#sdk-errors)
- [Transaction Errors](#transaction-errors)
- [Development Issues](#development-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Browser Compatibility](#browser-compatibility)
- [Performance Issues](#performance-issues)
- [Debugging Tools](#debugging-tools)

## Extension Issues

### Extension Not Detected

**Symptoms:**
- Red status indicator showing "Dash Extension not found"
- Publishing UI disabled
- `window.dashPlatformSDK` is undefined

**Solutions:**

1. **Install the extension:**
   - Download from [Dash Platform Extension repository](https://github.com/pshenmic/dash-platform-extension)
   - Follow installation instructions in extension README

2. **Wait for extension to load:**
   ```javascript
   // Extension may load after page
   setTimeout(() => {
     if (window.dashPlatformSDK) {
       console.log('Extension now available');
       window.location.reload();
     }
   }, 3000);
   ```

3. **Check browser compatibility:**
   - Extension works in Chrome, Brave, Edge
   - Firefox support may be limited
   - Safari not supported

4. **Disable conflicting extensions:**
   - Keplr wallet
   - MetaMask
   - Other crypto wallets

### Extension Popup Blocked

**Symptoms:**
- "Please allow popups for this site" message
- Transaction approval popup doesn't appear
- Browser shows popup blocked icon

**Solutions:**

1. **Allow popups for the site:**
   - Click popup blocked icon in address bar
   - Select "Always allow popups from this site"
   - Retry the transaction

2. **Check browser settings:**
   - Chrome: Settings → Privacy → Site Settings → Popups
   - Add site to allowed list

3. **Disable popup blockers:**
   - Browser extensions
   - Antivirus software
   - Ad blockers

### Extension API Blocked

**Symptoms:**
- Console error: "Cannot read property 'runtime' of undefined"
- Extension installed but not working
- Security software warnings

**Solutions:**

1. **Check Chrome policies:**
   ```javascript
   // Test if Chrome APIs available
   if (!chrome?.runtime?.id) {
     console.error('Chrome extension APIs blocked');
   }
   ```

2. **Run in regular browsing mode:**
   - Not incognito (unless extension enabled there)
   - Not guest mode
   - Not managed browser profile

## SDK Errors

### "where clause must be an array"

**Symptoms:**
- Error when querying documents
- Query fails with type error

**Problem:**
Using object syntax instead of parameter list for queries.

**Solution:**
```javascript
// ❌ WRONG - Object syntax
sdk.documents.query(contractId, type, { where: [], limit: 10 })

// ✅ CORRECT - Parameter list
sdk.documents.query(contractId, type, [], null, 10)
```

### Documents Show as `{ __wbg_ptr: 12345 }`

**Symptoms:**
- Documents display as objects with `__wbg_ptr` property
- Can't see document content
- WASM pointer values shown

**Problem:**
WASM objects not converted to JavaScript.

**Solution:**
```javascript
// Convert WASM document
function convertDocument(wasmDoc) {
  const id = wasmDoc.getId();
  const ownerId = wasmDoc.getOwnerId();
  
  return {
    $id: id?.base58?.() || id,
    $ownerId: ownerId?.base58?.() || ownerId,
    $createdAt: wasmDoc.getCreatedAt(),
    $updatedAt: wasmDoc.getUpdatedAt(),
    ...wasmDoc.getProperties() // Actual document data
  };
}
```

### "Buffer is not defined"

**Symptoms:**
- Error in browser console
- SDK fails to initialize
- Cryptographic operations fail

**Problem:**
Dash SDK uses Node.js Buffer which doesn't exist in browsers.

**Solution:**
```javascript
// Add before using SDK
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    from: (data) => {
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(data);
    },
    allocUnsafe: (size) => new Uint8Array(size),
    concat: (arrays) => {
      const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      arrays.forEach(arr => {
        result.set(arr, offset);
        offset += arr.length;
      });
      return result;
    }
  };
}
```

### TypeScript Errors

**Symptoms:**
- Red squiggles in VS Code
- Build fails with type errors
- "Cannot find module 'dash-platform-sdk'"

**Solutions:**

1. **Check type definitions:**
   ```typescript
   // Ensure types/dash-platform-sdk.d.ts exists
   declare module 'dash-platform-sdk' {
     export class DashPlatformSDK {
       constructor(options: { network: string });
       // ... rest of types
     }
   }
   ```

2. **Update tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "types": ["./types/dash-platform-sdk.d.ts"]
     }
   }
   ```

## Transaction Errors

### "ALREADY_EXISTS: state transition already in mempool"

**Symptoms:**
- Transaction seems to succeed but gets this error
- Same nonce used multiple times
- Transaction stuck in mempool

**Problem:**
Previous transaction with same nonce still pending.

**Solutions:**

1. **Wait for mempool to clear:**
   - Usually clears in 2-5 minutes
   - Check Platform Explorer for pending transactions

2. **Implement retry logic:**
   ```javascript
   async function retryWithFreshNonce(fn, maxAttempts = 5) {
     for (let i = 0; i < maxAttempts; i++) {
       try {
         // Get fresh nonce each attempt
         const nonce = await sdk.identities.getIdentityContractNonce(
           identityId, 
           contractId
         );
         return await fn(nonce + 1n);
       } catch (error) {
         if (error.message.includes('ALREADY_EXISTS') && i < maxAttempts - 1) {
           await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Manual nonce override:**
   - Check current nonce on blockchain
   - Skip stuck nonce by incrementing by 2

### "Signature is missing"

**Symptoms:**
- State transition created but signing fails
- Extension doesn't sign properly
- Identity mismatch errors

**Problem:**
Extension can't sign for the identity being used.

**Solutions:**

1. **Verify identity match:**
   - Extension must have the private key for the identity
   - Import correct identity into extension
   - Use identity that extension controls

2. **Check state transition structure:**
   ```javascript
   // Log state transition before signing
   console.log('State transition:', {
     type: stateTransition.getType(),
     signature: stateTransition.signature,
     identity: stateTransition.getIdentityId()
   });
   ```

### "Insufficient credits"

**Symptoms:**
- Transaction fails before popup
- Balance check shows 0 or low credits
- "Not enough credits" error

**Solutions:**

1. **Check balance:**
   ```javascript
   const balance = await sdk.identities.getBalance(identityId);
   console.log('Current balance:', balance.toString());
   ```

2. **Get testnet credits:**
   - Use Dash testnet faucet
   - Minimum ~1000 credits needed per transaction

3. **Implement balance check:**
   ```javascript
   if (balance < 1000n) {
     throw new Error(`Insufficient balance: ${balance} credits`);
   }
   ```

### "User rejected transaction"

**Symptoms:**
- Popup appears but transaction fails
- Error after clicking reject
- USER_REJECTED error code

**This is expected behavior** when user cancels. Handle gracefully:

```javascript
try {
  await sdk.signer.signStateTransition(st);
} catch (error) {
  if (error.message.includes('User rejected')) {
    // User intentionally cancelled - not an error
    showMessage('Transaction cancelled');
    return;
  }
  throw error; // Real error
}
```

## Development Issues

### Mock Extension Not Working

**Symptoms:**
- Black screen when using mock mode
- Real extension interferes
- "mockInstance is not a function" error

**Solutions:**

1. **Set environment variable:**
   ```bash
   VITE_USE_MOCK_EXTENSION=true npm run dev
   ```

2. **Disable wallet extensions:**
   - Keplr
   - MetaMask
   - Other crypto wallets

3. **Clear browser state:**
   ```javascript
   // In browser console
   localStorage.clear();
   window.location.reload();
   ```

4. **Check for conflicts:**
   ```javascript
   // Look for this in console
   console.log('[Mock] Real extension tried to load but was blocked');
   ```

### Tests Failing

**Symptoms:**
- Unit tests fail randomly
- E2E tests timeout
- Mock extension tests unreliable

**Solutions:**

1. **Run tests in isolation:**
   ```bash
   # Single test file
   npx vitest run src/lib/dash-service.test.ts
   
   # Single test
   npx vitest -t "should query documents"
   ```

2. **Clear test state:**
   ```bash
   rm -rf node_modules/.vite
   npm run test:run
   ```

3. **Check test environment:**
   - Ensure mock extension enabled for tests
   - No real extension interfering
   - Proper test setup in `src/test/setup.ts`

### Hot Reload Not Working

**Symptoms:**
- Changes don't appear in browser
- Need manual refresh
- Vite HMR disconnected

**Solutions:**

1. **Check Vite server:**
   - Look for WebSocket errors in console
   - Ensure port 5173 not blocked
   - Try different port: `vite --port 3000`

2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

## Build & Deployment Issues

### Build Errors

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Module not found errors

**Solutions:**

1. **Fix TypeScript errors:**
   ```bash
   # Check types without building
   npx tsc --noEmit
   ```

2. **Clear build cache:**
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   ```

3. **Check Node version:**
   ```bash
   node --version  # Should be 16+
   ```

### White Screen After Deployment

**Symptoms:**
- App loads blank page
- Console shows 404 errors
- Assets not loading

**Solutions:**

1. **Check base URL:**
   ```javascript
   // vite.config.ts for subdirectory deployment
   export default defineConfig({
     base: '/subdirectory/',
     // ...
   });
   ```

2. **Configure SPA routing:**
   - See deployment guide for platform-specific config
   - Ensure all routes redirect to index.html

3. **Verify file upload:**
   - All files in dist/ uploaded
   - Check file permissions
   - Verify MIME types set correctly

## Browser Compatibility

### Works Best In:
- Chrome 90+
- Brave (latest)
- Edge 90+

### Limited Support:
- Firefox (extension may not work)
- Safari (no extension support)

### Mobile Browsers:
- Read-only mode works
- No extension support
- Touch interactions supported

## Performance Issues

### Slow Initial Load

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build
   # Check dist/assets sizes
   ```

2. **Enable compression:**
   - Gzip/Brotli on server
   - CDN compression

3. **Optimize imports:**
   ```javascript
   // Import only what you need
   import { create } from 'zustand';
   // Not: import * as zustand from 'zustand';
   ```

### Slow Document Loading

**Solutions:**

1. **Limit query size:**
   ```javascript
   // Don't query too many at once
   const docs = await sdk.documents.query(
     contractId, type, [], null, 50  // Limit to 50
   );
   ```

2. **Implement pagination:**
   - Load more on scroll
   - Use offset/limit for pages

3. **Cache results:**
   - Store in Zustand
   - Implement smart refresh

## Debugging Tools

### Browser DevTools

```javascript
// Enable debug logging
localStorage.setItem('debug', 'dash:*');

// Log all SDK calls
window.dashPlatformSDK = new Proxy(window.dashPlatformSDK, {
  get(target, prop) {
    console.log('SDK call:', prop);
    return target[prop];
  }
});

// Monitor extension messages
window.addEventListener('message', (event) => {
  if (event.data.context === 'dash-platform-extension') {
    console.log('Extension message:', event.data);
  }
});
```

### Platform Explorer

Check transactions and identities:
- Testnet: https://testnet.platform-explorer.com/
- Transaction: `/transaction/{txHash}`
- Identity: `/identity/{identityId}`
- Data Contract: `/dataContract/{contractId}`

### Network Monitor

```javascript
// Log all network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args[0]);
  return originalFetch.apply(this, args);
};
```

### State Debugging

```javascript
// Zustand devtools
import { devtools } from 'zustand/middleware';

const useFeedStore = create(devtools(
  (set) => ({
    // ... store
  }),
  { name: 'feed-store' }
));
```

## Getting Help

If these solutions don't resolve your issue:

1. **Search existing issues:** [GitHub Issues](https://github.com/dash-feed-app/issues)
2. **Check documentation:** Review all docs in `/docs` folder
3. **Open new issue:** Include:
   - Clear problem description
   - Steps to reproduce
   - Error messages
   - Browser and OS info
   - Extension version
4. **Community support:** Dash Discord developer channel

Remember to remove any private keys or sensitive data from error reports!