# Mock Extension Documentation

The mock extension system allows development and testing of the Dash Feed App without requiring the real browser extension. It simulates all extension functionality including transaction signing, popup approvals, and identity management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Implementation Details](#implementation-details)

## Overview

### Why Mock Extension?

- **Faster Development** - No need to install/configure real extension
- **Predictable Testing** - Deterministic behavior for tests
- **CI/CD Support** - Run tests in headless environments
- **Edge Case Testing** - Simulate errors, delays, rejections
- **No Real Credits** - Test without spending testnet credits

### Key Features

- ✅ Simulates popup approval flow with configurable delay
- ✅ Tracks identity balances and nonces
- ✅ Supports auto-approve/reject modes
- ✅ Prevents real extension interference
- ✅ Includes Buffer polyfill for browser compatibility
- ✅ Handles edge cases (called as function, etc.)
- ✅ Full API compatibility with real extension

## Architecture

### Component Structure

```
src/lib/
├── mock-extension-sdk.ts      # Core mock implementation
├── mock-extension-wrapper.ts  # Browser integration wrapper
└── mock-extension-sdk.test.ts # Mock extension tests
```

### How It Works

1. **Initialization** - Mock replaces `window.dashPlatformSDK` before real extension loads
2. **API Simulation** - Implements all SDK methods with mock behavior
3. **State Management** - Tracks balances, nonces, and pending operations
4. **Popup Simulation** - Uses setTimeout to simulate approval delays
5. **Cleanup** - Properly handles unmounting and test cleanup

## Usage

### Development Mode

```bash
# Start with mock extension
npm run dev:mock

# Or set environment variable
VITE_USE_MOCK_EXTENSION=true npm run dev
```

### In Code

```javascript
// The mock is automatically enabled based on environment
// No code changes needed - same API as real extension

const sdk = window.dashPlatformSDK;

// Use normally
const balance = await sdk.identities.getBalance(identityId);
const docs = await sdk.documents.query(contractId, type, [], null, 10);
```

### Manual Control

```javascript
import { enableMockExtension, disableMockExtension } from './mock-extension-sdk';

// Enable with options
enableMockExtension({
  autoApprove: true,
  approvalDelay: 1500,
  shouldFail: false
});

// Disable and restore
disableMockExtension();
```

## Configuration

### Configuration Options

```typescript
interface MockExtensionConfig {
  // Automatically approve all transactions
  autoApprove?: boolean;
  
  // Delay before approval (simulates popup interaction)
  approvalDelay?: number;
  
  // Force all operations to fail
  shouldFail?: boolean;
  
  // Custom error message when failing
  failureMessage?: string;
  
  // Initial identity balance
  identityBalance?: bigint;
  
  // Initial nonce values
  initialNonces?: Map<string, bigint>;
  
  // Console logging
  debug?: boolean;
}
```

### Default Configuration

```javascript
const DEFAULT_CONFIG = {
  autoApprove: true,
  approvalDelay: 1500, // 1.5 seconds
  shouldFail: false,
  identityBalance: 1000000000000n, // Plenty of credits
  debug: true
};
```

### Environment-Based Config

```javascript
// In vite.config.ts or app initialization
const mockConfig = {
  autoApprove: import.meta.env.DEV, // Auto-approve in dev
  approvalDelay: import.meta.env.VITEST ? 0 : 1500, // No delay in tests
  debug: !import.meta.env.PROD
};
```

## API Reference

### Mock Extension Instance

```typescript
class MockExtensionSDK {
  // Identity operations
  identities: {
    getBalance(identityId: string): Promise<bigint>;
    getIdentityContractNonce(
      identityId: string, 
      contractId: string
    ): Promise<bigint>;
  };
  
  // Document operations
  documents: {
    create(
      dataContractId: string,
      documentType: string,
      data: any,
      identityId: string,
      nonce: bigint
    ): Promise<MockDocument>;
    
    query(
      dataContractId: string,
      documentType: string,
      where: any[],
      orderBy: any,
      limit: number
    ): Promise<MockDocument[]>;
  };
  
  // State transitions
  stateTransitions: {
    documentsBatch: {
      create(
        documents: any,
        nonce: bigint
      ): Promise<MockStateTransition>;
    };
  };
  
  // Signing
  signer: {
    signStateTransition(
      stateTransition: any
    ): Promise<void>;
  };
}
```

### Control Methods

```typescript
// Get mock instance for testing
function getMockExtension(): MockExtensionSDK | null;

// Update configuration
mockInstance.setAutoApprove(true);
mockInstance.setApprovalDelay(2000);
mockInstance.setShouldFail(true, 'Custom error');

// State management
mockInstance.setIdentityBalance(identityId, 5000n);
mockInstance.setNonce(identityId, contractId, 10n);

// Reset state
mockInstance.reset();
```

### Mock Objects

```typescript
// Mock Document
class MockDocument {
  constructor(data: any);
  getId(): { base58: () => string };
  getOwnerId(): { base58: () => string };
  getDataContractId(): { base58: () => string };
  getProperties(): any;
  getCreatedAt(): number;
  getUpdatedAt(): number;
}

// Mock State Transition
class MockStateTransition {
  constructor();
  hash(encoding: boolean): string;
  sign(identityKey: any, privateKey: any): void;
  getSignature(): any;
}
```

## Testing

### Unit Test Setup

```javascript
// In test file
import { enableMockExtension, getMockExtension } from './mock-extension-sdk';

beforeEach(() => {
  enableMockExtension({
    autoApprove: true,
    approvalDelay: 0, // No delay in tests
  });
});

afterEach(() => {
  getMockExtension()?.reset();
});
```

### Testing Scenarios

```javascript
// Test successful flow
it('should create document with mock extension', async () => {
  const mock = getMockExtension();
  mock.setIdentityBalance('identity1', 1000000n);
  
  const result = await createDocument('Test message');
  expect(result).toBeTruthy();
});

// Test rejection
it('should handle user rejection', async () => {
  const mock = getMockExtension();
  mock.setShouldFail(true, 'User rejected');
  
  await expect(createDocument('Test')).rejects.toThrow('User rejected');
});

// Test insufficient balance
it('should fail with low balance', async () => {
  const mock = getMockExtension();
  mock.setIdentityBalance('identity1', 0n);
  
  await expect(checkBalance()).rejects.toThrow('Insufficient');
});
```

### E2E Test Setup

```javascript
// playwright.config.ts
export default {
  use: {
    // Inject mock extension
    beforeEach: async ({ page }) => {
      await page.addInitScript(() => {
        window.VITE_USE_MOCK_EXTENSION = 'true';
      });
    }
  }
};
```

### Automated Test Runner

```bash
# Run all mock tests
npm run test:mock

# Run automated browser tests
./test-mock-runner.sh
```

## Troubleshooting

### Common Issues

#### Black Screen on Load

**Cause**: Extension conflicts or initialization errors

**Solution**:
1. Disable wallet extensions (Keplr, MetaMask)
2. Clear localStorage
3. Check console for errors
4. Ensure mock loads before React

#### Real Extension Interference

**Symptoms**: 
- Mock behavior inconsistent
- Real extension popups appear
- Console shows "Real extension tried to load"

**Solution**:
```javascript
// Mock sets flag immediately
window.__mockExtensionEnabled = true;

// Check if mock is active
if (window.__mockExtensionEnabled) {
  console.log('Mock is active');
}
```

#### Mock Not Found Errors

**Cause**: Import issues or initialization order

**Solution**:
```javascript
// Ensure proper import
import { enableMockExtension } from '@/lib/mock-extension-sdk';

// Initialize early
if (import.meta.env.VITE_USE_MOCK_EXTENSION === 'true') {
  enableMockExtension();
}
```

### Debug Mode

Enable detailed logging:

```javascript
enableMockExtension({
  debug: true // Logs all operations
});

// Or at runtime
const mock = getMockExtension();
mock.debug = true;
```

### State Inspection

```javascript
// In browser console
const mock = window.dashPlatformSDK;

// Check balances
console.log('Balances:', mock.identityBalances);

// Check nonces
console.log('Nonces:', mock.nonces);

// Check pending operations
console.log('Pending:', mock.pendingOperations);
```

## Implementation Details

### Buffer Polyfill

The mock includes a critical Buffer polyfill:

```javascript
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

### Preventing Real Extension

```javascript
// Set flag before real extension can load
window.__mockExtensionEnabled = true;

// Monitor for overwrites
let checkInterval = setInterval(() => {
  if (window.dashPlatformSDK !== mockInstance) {
    console.warn('[Mock] Real extension tried to load');
    window.dashPlatformSDK = mockInstance;
  }
}, 100);
```

### Edge Case Handling

```javascript
// Handle being called as function
mockInstance.bind = function() { return mockInstance; };
mockInstance.call = function() { return mockInstance; };
mockInstance.apply = function() { return mockInstance; };

// Prevent "not a function" errors
Object.setPrototypeOf(mockInstance, Function.prototype);
```

### State Persistence

```javascript
// Optional: Persist state across reloads
const STORAGE_KEY = 'mock-extension-state';

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    balances: Array.from(mockInstance.identityBalances),
    nonces: Array.from(mockInstance.nonces)
  }));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const { balances, nonces } = JSON.parse(saved);
    mockInstance.identityBalances = new Map(balances);
    mockInstance.nonces = new Map(nonces);
  }
}
```

## Best Practices

### 1. Use Environment Variables

```javascript
// Good
if (import.meta.env.VITE_USE_MOCK_EXTENSION === 'true') {
  enableMockExtension();
}

// Bad
if (true) { // Hardcoded
  enableMockExtension();
}
```

### 2. Reset State in Tests

```javascript
afterEach(() => {
  getMockExtension()?.reset();
  // Clear any app state too
  useFeedStore.getState().reset();
});
```

### 3. Match Real Behavior

```javascript
// Simulate realistic delays
const REALISTIC_DELAYS = {
  userThinking: 3000,
  typing: 500,
  networkLatency: 200
};
```

### 4. Test Edge Cases

```javascript
// Test timeout
mock.setApprovalDelay(200000); // 3+ minutes

// Test network issues
mock.setShouldFail(true, 'Network timeout');

// Test rapid operations
for (let i = 0; i < 10; i++) {
  createDocument(`Message ${i}`);
}
```

## Conclusion

The mock extension system provides a robust development and testing environment that closely mimics the real browser extension. It enables rapid development, comprehensive testing, and reliable CI/CD pipelines while maintaining API compatibility with the production extension.