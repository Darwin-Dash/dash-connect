# Testing Guide for Dash Feed App

This guide explains how to test the Dash Feed App, including unit tests, integration tests, and E2E tests with the browser extension.

## Test Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright (for E2E tests)
```bash
npx playwright install
```

## Running Tests

### Unit Tests
Run unit tests with Vitest:
```bash
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Run tests with UI
```

### Mock Extension Mode
Run the app with a mock extension for development:
```bash
npm run dev:mock        # Start dev server with mock extension
```

This enables testing without needing the real browser extension installed.

### E2E Tests
Run E2E tests with Playwright:
```bash
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Run with Playwright UI
```

### Extension Integration Test
Run a diagnostic script to test the extension integration:
```bash
npm run test:extension  # Test real extension flow
```

## Test Structure

### Unit Tests (`src/**/*.test.ts`)
- `dash-service.test.ts` - Tests for the DashService with mock extension
- Component tests - Testing React components in isolation

### E2E Tests (`e2e/**/*.spec.ts`)
- `extension-integration.spec.ts` - Full integration tests with extension

## Mock Extension

The mock extension (`src/lib/mock-extension-sdk.ts`) simulates the real browser extension for development and testing.

### Features:
- Simulates popup approval delays
- Can be configured to auto-approve or reject
- Tracks identity balances and nonces
- Supports all extension API methods
- Prevents real extension from interfering
- Handles being called as a function (edge case)

### Configuration:
```javascript
enableMockExtension({
  autoApprove: true,           // Auto-approve transactions
  approvalDelay: 1500,         // Popup delay in ms
  shouldFail: false,           // Force failures
  identityBalance: 1000000000000n  // Mock balance
})
```

### Using in Tests:
```javascript
import { enableMockExtension, getMockExtension } from './mock-extension-sdk'

// Enable for test
enableMockExtension()

// Configure behavior
const mock = getMockExtension()
mock.setShouldFail(true, 'User rejected')
mock.setIdentityBalance('identity-id', 0n)
```

### Automated Testing:
Run the automated test suite for mock extension:
```bash
./test-mock-runner.sh        # Run all mock extension tests
npm test -- src/test/mock-extension.test.ts  # Run unit tests only
```

### Troubleshooting Mock Extension:

**Black screen on startup:**
- Check browser console for errors
- Disable other wallet extensions (Keplr, MetaMask)
- Clear localStorage and reload

**"mockInstance is not a function" error:**
- This is usually caused by extension conflicts
- The mock now handles this case gracefully

**Real extension still loading:**
- Mock mode sets `window.__mockExtensionEnabled` immediately
- Mock monitors and prevents overwrites
- Check console for "[Mock] Real extension tried to load" messages

## Testing Scenarios

### 1. Successful Document Creation
- User has extension installed
- User has sufficient credits
- User approves transaction
- Document is created and appears in feed

### 2. User Rejection
- User cancels in extension popup
- App shows appropriate error message

### 3. Insufficient Credits
- Identity has low balance
- App prevents transaction and shows error

### 4. Extension Not Installed
- App works in read-only mode
- Publishing UI is hidden

### 5. Network Issues
- Transaction times out
- App shows timeout error

## Debugging Extension Issues

### 1. Check Extension Logs
Open browser console and look for:
- `content script loaded` - Extension injected successfully
- `injected Dash Platform SDK` - SDK available to page
- Error messages about signature or authentication

### 2. Check App Logs
The app logs detailed information:
- `📋 State transition details` - Structure before signing
- `📄 State transition JSON structure` - Signature status
- `📄 State transition after signing` - Post-signing state

### 3. Common Issues

**"Signature is missing" Error**
- Extension didn't properly sign the state transition
- Version mismatch between app and extension
- State transition format incompatibility

**"Invalid State Transition signature" Error**
- Signature was added but is invalid
- Identity mismatch between app and extension
- Network mismatch (testnet vs mainnet)

### 4. Manual Testing Flow
1. Open app with `npm run dev`
2. Open browser console
3. Try to publish a message
4. Watch console logs for detailed debugging info
5. Check extension popup for errors

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Best Practices

1. **Always test both with and without extension**
   - Ensure app degrades gracefully
   - Test read-only mode functionality

2. **Test error scenarios**
   - User rejection
   - Insufficient credits
   - Network timeouts

3. **Use mock extension for development**
   - Faster feedback loop
   - Predictable behavior
   - No need for real credits

4. **Log extensively**
   - Add console logs for debugging
   - Log state transition structure
   - Log error details

5. **Test on multiple browsers**
   - Chrome/Brave (primary)
   - Firefox (if extension supports)
   - Safari (read-only mode)