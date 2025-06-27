# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2025-01-27

## Project Overview

Dash Feed App is a beautiful, modern, 100% client-side web application that displays documents from Dash Platform data contracts. It uses a **dual SDK architecture** for optimal performance and user experience.

### Key Features
- Beautiful feed UI with Tailwind CSS v4
- **Dual SDK Architecture**: Reading always works, publishing requires extension
- Real-time blockchain document querying
- Auto-refresh every 30 seconds
- Dark/light mode support
- Network switching (testnet/mainnet)
- Completely static - can be hosted anywhere
- Comprehensive mock extension system for development
- Full test suite with unit, integration, and E2E tests

### Project Status
- Version: 0.0.0 (initial release)
- License: MIT
- Documentation: Fully documented with organized docs/ structure
- Test Coverage: Comprehensive with mock extension support
- Production Ready: Yes, for testnet deployment

## Commands

### Development
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run dev:mock` - Start dev server with mock extension
- `npm test` - Run test suite with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:run` - Run tests once (no watch mode)
- `npm run test:mock` - Run mock extension tests
- `npm run test:mock:runner` - Run automated mock test suite
- `npm run build` - Build for production (TypeScript check + Vite build to dist/)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for type checking

### Testing Single Files
- `npx vitest run src/lib/dash-service.test.ts` - Run specific test file
- `npx vitest -t "test name"` - Run tests matching pattern

### Deployment
- Build with `npm run build`
- Deploy dist/ folder to any static host (Netlify, Vercel, GitHub Pages, etc.)
- No server or API keys needed

## Architecture

### Dual SDK Architecture ⭐
**CRITICAL**: This app uses TWO separate SDK instances for different purposes:

1. **Reading SDK** (`readOnlySDK`): 
   - Created directly with `new DashPlatformSDK({ network })`
   - Used for document queries (public operations)
   - **Always works** - no extension required
   - Handles WASM object conversion automatically

2. **Extension SDK** (`extensionSDK`):
   - Uses `window.dashPlatformSDK` injected by browser extension
   - Used for document creation/publishing (private operations)
   - Requires extension installation and user approval
   - Shows extension popup for transaction signing

### Key Benefits
- ✅ **Reading**: App works immediately without any setup
- ✅ **Publishing**: Secure via browser extension when available
- ✅ **Performance**: No unnecessary extension dependency for reads
- ✅ **UX**: Clear separation between public and private operations

### Client-Side Only
- No backend server required
- Direct blockchain communication via both SDKs
- User's private keys never leave the extension
- Reading is completely public, writing is authenticated

### Key Components
- `src/lib/dash-service.ts` - **Dual SDK implementation** (CRITICAL FILE)
- `src/hooks/useDashPlatform.ts` - Extension availability detection
- `src/contexts/NetworkContext.tsx` - Network switching for both SDKs
- `src/stores/feed-store.ts` - Document state management
- `src/components/FeedList.tsx` - Main feed component
- `src/components/PublishCard.tsx` - Publishing interface (extension required)
- `types/dash-platform-sdk.d.ts` - TypeScript definitions for SDK

## Critical SDK Implementation

### Document Query Method Signature ⚠️
**IMPORTANT**: The correct SDK query signature is:
```typescript
sdk.documents.query(
  dataContractId: string,
  documentType: string, 
  where: any[],        // Empty array [] for all documents
  orderBy: any,        // null for default sorting
  limit: number        // Number of documents to return
)
```

**WRONG** (causes "where clause must be an array" error):
```typescript
// ❌ This fails
sdk.documents.query(dataContractId, documentType, {
  where: [],
  limit: 10
})
```

**CORRECT**:
```typescript
// ✅ This works
sdk.documents.query(dataContractId, documentType, [], null, 10)
```

### WASM Object Conversion ⚠️
Documents returned from the SDK are **WASM objects** that must be converted to plain JavaScript:

```typescript
// Convert WASM document to JavaScript object
const convertDocument = (doc) => {
  const id = doc.getId()
  const ownerId = doc.getOwnerId() 
  const dataContractId = doc.getDataContractId()
  
  return {
    $id: id?.base58?.() || id,
    $ownerId: ownerId?.base58?.() || ownerId,
    $dataContractId: dataContractId?.base58?.() || dataContractId,
    $createdAt: doc.getCreatedAt(),
    $updatedAt: doc.getUpdatedAt(),
    ...doc.getProperties() // Contains document data like "message"
  }
}
```

Available WASM methods:
- `doc.getId()` - Returns WASM ID object
- `doc.getOwnerId()` - Returns WASM owner ID object  
- `doc.getDataContractId()` - Returns WASM contract ID object
- `doc.getProperties()` - Returns document data (plain object)
- `id.base58()` - Converts WASM ID to base58 string

## Configuration

### Data Contract Settings
Network configurations in `src/contexts/NetworkContext.tsx`:
```typescript
const NETWORK_CONFIGS = {
  testnet: {
    dataContractId: '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
    identityId: '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc'
  },
  mainnet: {
    // Add mainnet configuration
  }
}
```

Document type in `src/App.tsx`:
```typescript
const DOCUMENT_TYPE = 'note'
```

## How It Works

1. **App loads** → Creates standalone SDK for reading
2. **Documents display** → Queries blockchain directly (no extension needed)
3. **Extension detection** → Checks for `window.dashPlatformSDK` periodically
4. **Publishing UI** → Shows when extension available
5. **Auto-refresh** → Polls for new documents every 30 seconds
6. **Network switching** → Updates both SDKs automatically

## Testing & Debugging

### E2E Testing with Playwright
The project uses Playwright for end-to-end testing:

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run with mock extension
npm run test:e2e:mock

# Test with real browser extension
EXTENSION_PATH=/path/to/extension npm run test:extension:playwright
```

Playwright configuration:
- Test directory: `e2e/`
- Browsers: Chromium and Firefox
- Base URL: http://localhost:5173
- Auto-starts dev server before tests

### Testing with Real Extension

#### SDK Integration Testing (Debugging)
Use this when debugging SDK integration issues:
```bash
npm run test:extension
```
This script (`scripts/test-extension-integration.js`):
- Tests the extension SDK JavaScript API directly
- Provides detailed step-by-step debugging output
- Helps diagnose specific SDK errors like "Signature is missing"
- Run in browser console or with window object available
- Manual popup approval required

#### Automated E2E Testing (Playwright)
Use this for automated browser testing:
```bash
EXTENSION_PATH=/path/to/extension npm run test:extension:playwright
```
This script (`scripts/test-extension-with-playwright.js`):
- Automates full browser interaction with Playwright
- Loads extension automatically
- Tests complete user flow from UI to blockchain
- Attempts to handle extension popup automatically
- Takes screenshots on failure
- Good for CI/CD and regression testing

#### Manual Testing
Use the test page directly:
1. Open `test-extension-publish.html` in browser
2. Click "Run Full Test"
3. Approve transaction in extension popup
4. Check Platform Explorer for transaction

### SDK Testing Script
When debugging SDK issues, create a test script:
```javascript
// test-sdk.js
import { DashPlatformSDK } from 'dash-platform-sdk';

const sdk = new DashPlatformSDK({ network: 'testnet' });
const docs = await sdk.documents.query(contractId, type, [], null, 10);
console.log('Documents:', docs.map(doc => ({
  id: doc.getId().base58(),
  data: doc.getProperties()
})));
```

### Common SDK Errors

#### "where clause must be an array"
**Cause**: Using object syntax instead of parameter list
**Solution**: Use `query(contract, type, [], null, limit)`

#### Documents show as `{ __wbg_ptr: 12345 }`
**Cause**: WASM objects not converted to JavaScript
**Solution**: Use conversion methods (`getId().base58()`, `getProperties()`)

#### TypeScript errors for SDK
**Cause**: Missing type definitions
**Solution**: Check `types/dash-platform-sdk.d.ts` is included in tsconfig

## Security Model

- **Private keys**: Only stored in extension, never in app
- **Reading**: Completely public, no authentication required
- **Publishing**: Requires extension popup approval
- **Network calls**: Direct to Dash Platform nodes
- **App permissions**: Read-only access to public blockchain data

## Common Tasks

### Change Data Contract
Edit `src/contexts/NetworkContext.tsx`:
```typescript
const NETWORK_CONFIGS = {
  testnet: {
    dataContractId: 'your-new-contract-id',
    identityId: 'your-identity-id'
  }
}
```

### Add New Document Type
1. Update document type in `src/App.tsx`
2. Update TypeScript interface in `src/types/index.ts`
3. Update UI components to display new fields

### Deploy to Static Hosts

#### Netlify (Recommended)
1. Build the app: `npm run build`
2. Go to [netlify.com](https://netlify.com) and drag the `dist/` folder to deploy
3. Or use Netlify CLI: `npx netlify deploy --prod --dir=dist`

#### Any Static Host
The `dist/` folder contains all files needed - just upload to any web server.

## Technical Implementation

### Dependencies
- `dash-platform-sdk` - Direct SDK for reading documents
- `react` - UI framework
- `zustand` - State management  
- `tailwindcss` - Styling (v4)
- `@playwright/test` - E2E testing framework
- TypeScript - Type safety

### Tailwind CSS v4 Configuration
This project uses **Tailwind CSS v4**:

#### Critical Setup:
1. **CSS Import Syntax**: Uses `@import "tailwindcss"` (not `@tailwind`)
2. **Config Directive**: Requires `@config "../tailwind.config.js"` in CSS file
3. **PostCSS**: Uses `@tailwindcss/postcss` plugin
4. **Dark Mode**: Uses `:is(.dark)` selector syntax

#### File Structure:
```
src/index.css - Main CSS with Tailwind v4 imports
tailwind.config.js - Tailwind v4 configuration  
postcss.config.js - PostCSS setup
types/dash-platform-sdk.d.ts - SDK type definitions
```

### Dark Mode Implementation
- **Detection**: Automatic system preference via `matchMedia`
- **Application**: Applies `dark` class to `<html>` element
- **Styling**: Custom CSS uses `:is(.dark)` selectors
- **Flash Prevention**: Script in `index.html` applies class before React loads

### UI Design System
- **Floating Cards**: Custom `floating-shadow` class with layered shadows
- **Glass Morphism**: Custom `glass` class with backdrop-filter
- **Responsive Design**: Cards max-width 640px with responsive breakpoints
- **Status Indicators**: Colored dots (🟢 green connected, 🔴 red disconnected)
- **Animations**: Custom fade-in, slide-up, and hover effects

### Common Issues & Solutions

#### Issue: SDK Query Errors
**Cause**: Wrong method signature or WASM conversion issues
**Solution**: 
1. Use correct signature: `query(contract, type, [], null, limit)`
2. Convert WASM objects: `doc.getId().base58()`
3. Test with standalone script first

#### Issue: Extension Not Detected
**Cause**: Extension loads after app or not installed
**Solution**: App shows "Read-Only Mode" and works without extension

#### Issue: TypeScript Errors
**Cause**: Missing SDK type definitions
**Solution**: Ensure `types/dash-platform-sdk.d.ts` exists and is in tsconfig

#### Issue: Network Switching Not Working
**Cause**: SDK instances not updated
**Solution**: Both SDKs are recreated when network changes in `NetworkContext`

#### Issue: "Buffer is not defined" Error
**Cause**: SDK uses Node.js Buffer which doesn't exist in browsers
**Solution**: Mock extension includes Buffer polyfill automatically. For production extension, ensure Buffer polyfill is loaded before SDK initialization

#### Issue: Mock Extension Not Working
**Cause**: Conflicting browser extensions or incorrect setup
**Solution**:
1. Check `VITE_USE_MOCK_EXTENSION=true` is set
2. Disable wallet extensions (Keplr, MetaMask)
3. Clear localStorage and reload
4. Check console for "[Mock]" prefixed logs

#### Issue: Tests Hanging or Failing
**Cause**: Mock extension timing or state issues
**Solution**:
1. Ensure clean test environment
2. Check mock approval delay settings
3. Verify mock identity has sufficient balance
4. Look for race conditions in async operations

### Architecture Best Practices
- **Separation of Concerns**: Reading vs writing operations
- **Error Handling**: Graceful degradation when extension unavailable
- **Performance**: Minimal dependencies, efficient polling
- **User Experience**: Clear status indicators and feedback
- **Security**: Private keys never leave extension

### Development Workflow
1. **Reading development**: Works immediately with standalone SDK
2. **Publishing testing**: Install browser extension for full functionality
3. **Network testing**: Use NetworkSelector to test both testnet/mainnet
4. **Error testing**: Disconnect extension to test read-only mode

## Project Structure

### Core Files Hierarchy
```
src/lib/dash-service.ts          # Heart of the dual SDK architecture
    ├── Manages both SDKs (reading & extension)
    ├── Handles WASM conversions
    └── Implements retry logic for signing

src/hooks/useDashPlatform.ts     # Extension detection & state
    └── Monitors window.dashPlatformSDK availability

src/contexts/NetworkContext.tsx   # Network configuration hub
    ├── Manages network switching
    └── Provides SDK instances to entire app

src/stores/feed-store.ts          # Global state management
    └── Caches documents & loading states
```

### Mock Development
- `src/lib/mock-extension-sdk.ts` - Mock browser extension for development
- Enable by setting `VITE_USE_MOCK_EXTENSION=true` or use `npm run dev:mock`
- Simulates the browser extension without needing it installed

## Mock Extension Development

### Using Mock Extension
The mock extension allows development without the real browser extension:

```bash
# Start with mock extension
npm run dev:mock

# Run tests with mock
npm run test:mock

# Run automated test suite
./test-mock-runner.sh
```

### Mock Extension Features
- Simulates popup approval with configurable delay (default 1.5s)
- Tracks identity balances and nonces
- Can be configured to auto-approve or reject
- Prevents real extension from interfering
- Handles edge cases (called as function, etc.)
- Works in both browser and test environments

### Configuration
```javascript
enableMockExtension({
  autoApprove: true,           // Auto-approve transactions
  approvalDelay: 1500,         // Popup delay in ms
  shouldFail: false,           // Force failures for testing
  identityBalance: 1000000000000n  // Mock balance
})
```

### Troubleshooting Mock Extension

#### Black Screen Issues
If you see a black screen when running with mock:
1. Check browser console for errors
2. Look for conflicts with other wallet extensions
3. Disable Keplr, MetaMask, or other wallet extensions
4. Clear localStorage and reload

#### Real Extension Still Loading
The mock prevents real extension from overwriting:
- Look for "[Mock] Real extension tried to load" in console
- Mock sets `window.__mockExtensionEnabled` immediately
- Uses monitoring to restore mock if overwritten

#### Extension Conflicts
Other browser extensions may cause issues:
- Keplr trying to redefine `window.keplr`
- MetaMask/Ethereum wallets conflicting
- Solution: Run in incognito mode or disable conflicting extensions

### Testing With Mock Extension

#### Unit Tests
All mock extension tests pass:
```bash
npm run test:mock  # Run mock extension tests
```

#### E2E Tests
```bash
npm run test:e2e:mock  # Run Playwright with mock
```

#### Manual Testing
1. Start dev server: `npm run dev:mock`
2. Open browser console to see mock logs
3. Try publishing - should see 1.5s approval delay
4. Check console for "[Mock]" prefixed operations

#### Automated Testing Suite
The project includes a comprehensive automated test runner:
```bash
./test-mock-runner.sh  # Runs automated browser tests
```

This script:
- Starts the dev server with mock extension
- Runs automated browser actions (load, publish, refresh)
- Takes screenshots at each step
- Validates UI states and mock operations
- Generates a test report with all results

Test flow:
1. Initial page load with mock extension
2. Wait for feed to populate
3. Type and publish a message
4. Handle mock approval popup
5. Verify publication success
6. Test page refresh persistence

### Buffer Compatibility Fix

The mock extension includes a critical Buffer polyfill for browser compatibility:

```javascript
// Buffer polyfill for browser compatibility
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

This fix is essential because:
- The Dash Platform SDK uses Node.js Buffer internally
- Browsers don't have Buffer natively
- Without this polyfill, you'll see "Buffer is not defined" errors
- The polyfill provides minimal Buffer methods needed by the SDK

## Known Issues

### Nonce Management and ALREADY_EXISTS Errors
**Issue**: Transactions can get stuck in mempool, causing subsequent transactions with the same nonce to be rejected with "ALREADY_EXISTS" error.

**Symptoms**:
- Transaction appears to succeed but doesn't appear on blockchain
- "ALREADY_EXISTS: state transition already in mempool" error
- Test claims success by finding old documents with similar content

**Solution**:
1. Check current nonce with "Check Nonce" button in test-extension-publish.html
2. Use manual nonce override to skip stuck nonces
3. Wait for mempool to clear (usually a few minutes)
4. The test now properly treats ALREADY_EXISTS as an error, not success

**Root Cause**: When a transaction fails to be mined but remains in mempool, attempting to use the same nonce creates an identical transaction hash, which the network rejects as a duplicate.

### Identity Detection (Temporary Workaround)
**Issue**: The current Dash Platform Extension does not expose a `getCurrentIdentity()` method in its API, making it impossible to dynamically detect which identity the extension is using.

**Current Workaround**: We are temporarily hardcoding the identity `DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq` in:
- `src/contexts/NetworkContext.tsx` - DEFAULT_IDENTITIES
- `src/lib/mock-extension-sdk.ts` - Mock identity

**TODO**: When the extension adds proper identity detection API:
1. Remove hardcoded DEFAULT_IDENTITIES from NetworkContext
2. Update extension-adapter to use the new getCurrentIdentity() method
3. Remove this workaround documentation

**Why this matters**: The extension can only sign transactions for the identity it has imported. Using a mismatched identity causes "Signature is missing" errors.

### Extension API Limitations
**Current Status**: The browser extension's `signStateTransition` method DOES automatically broadcast transactions (based on EXTENSION_README.md example). Our adapter layer:
1. Calls `signStateTransition` which signs AND broadcasts
2. Attempts `waitForStateTransitionResult` for confirmation (may fail with non-critical Transport errors)
3. Properly handles ALREADY_EXISTS errors as transaction rejections

**Platform Explorer**: 
- Use https://testnet.platform-explorer.com/ (not the insight explorer)
- Identity URL format: `/identity/{identityId}`
- Data Contract URL format: `/dataContract/{contractId}`
- Documents are not directly browsable via URL

### Private Key Usage
**Important**: The private key in `.env` is for future automated testing only. Production users MUST use the browser extension for signing transactions. Direct private key signing is:
- Not supported by the SDK's public API (requires internal PrivateKeyWASM)
- Less secure than extension-based signing
- Not the recommended pattern for web applications

## Documentation Structure

The project now has a comprehensive documentation structure:

### Root Documentation
- `README.md` - Project overview with badges and quick start
- `LICENSE` - MIT License
- `CHANGELOG.md` - Version history following Keep a Changelog format
- `CONTRIBUTING.md` - Contribution guidelines
- `DEVELOPER_GUIDE.md` - Comprehensive extension development guide (DO NOT MODIFY)
- `CLAUDE.md` - This file, AI assistant context

### Technical Documentation (docs/)
- `docs/ARCHITECTURE.md` - System design and component structure
- `docs/API.md` - SDK usage patterns and API reference
- `docs/TESTING.md` - Testing strategies and setup
- `docs/TEST-CASES.md` - Comprehensive test scenarios
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `docs/MOCK-EXTENSION.md` - Mock extension system documentation

### Code Quality Reports (code-audit-reports/)
- Comprehensive audit reports from 2025-01-26
- Quality analysis, security assessment, performance metrics
- Recommendations for improvements

## Environment Variables

```bash
# Development
VITE_USE_MOCK_EXTENSION=true           # Enable mock extension
VITE_NETWORK=testnet                   # or 'mainnet'

# Optional Configuration
VITE_DATA_CONTRACT_ID=contract-id      # Override default contract
```

## Recent Updates (2025-01-27)

1. **Documentation Reorganization**:
   - Created organized docs/ folder structure
   - Added MIT License file
   - Created comprehensive documentation for all aspects
   - Updated README with badges and better structure

2. **Known Working Configuration**:
   - Mock extension fully functional
   - All tests passing with mock
   - Buffer polyfill integrated
   - Extension conflict handling implemented

3. **Production Deployment Ready**:
   - Static build process documented
   - Multiple deployment platform guides
   - Security headers configured
   - Performance optimizations applied

## Important Notes for Development

1. **Always use parameter list format for SDK queries**, not object format
2. **Convert WASM objects** using provided conversion methods
3. **Mock extension is preferred** for development - faster and more predictable
4. **Disable wallet extensions** (Keplr, MetaMask) when using mock to avoid conflicts
5. **Run tests frequently** - comprehensive test suite available
6. **Check troubleshooting guide** for common issues

## Memories
- The extension details are in @EXTENSION_README.md 
- When committing, don't add that it was helped by Claude
- Project uses Tailwind CSS v4 with specific configuration requirements
- Dual SDK architecture is the core design pattern
- Mock extension includes critical Buffer polyfill
- Identity detection is currently hardcoded (temporary workaround)

### Default Test Configuration
- Network: testnet
- Document Type: 'note'
- Identity: DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq
- Data Contract: 9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3
