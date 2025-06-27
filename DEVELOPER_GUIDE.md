# Dash Platform Extension Developer Guide

This comprehensive guide covers everything developers need to know about building applications with the Dash Platform Browser Extension, including detailed explanations of nonce handling, document creation, and the distinction between public and private APIs.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Understanding Nonces](#understanding-nonces)
5. [Document Operations](#document-operations)
6. [API Architecture](#api-architecture)
7. [Communication Protocols](#communication-protocols)
8. [Security Considerations](#security-considerations)
9. [Best Practices](#best-practices)
10. [Common Patterns and Examples](#common-patterns-and-examples)
11. [Troubleshooting](#troubleshooting)

## Introduction

The Dash Platform Browser Extension enables web applications to interact with the Dash Platform blockchain without requiring users to expose their private keys to websites. It follows a similar pattern to MetaMask but is specifically designed for Dash Platform operations including identity management, document creation, and state transitions.

### Key Features

- **Secure Key Management**: Private keys never leave the extension
- **User Approval Flow**: All transactions require explicit user consent
- **Network Support**: Currently testnet with mainnet coming soon
- **Identity Management**: Support for multiple identities and wallets
- **Document Operations**: Create, query, and manage platform documents
- **State Transitions**: Sign and broadcast all types of state transitions

## Architecture Overview

### Three-Layer Architecture

1. **Injected Script (`injected.js`)**
   - Runs in the webpage context
   - Exposes `window.dashPlatformSDK` to web applications
   - Creates a custom `ExtensionSigner` that communicates with the extension

2. **Content Script (`content-script.js`)**
   - Runs in an isolated context
   - Acts as a bridge between the webpage and extension
   - Manages two API layers: PublicAPI and PrivateAPI
   - Handles storage, migrations, and repository patterns

3. **Extension UI (React-based popup)**
   - Provides wallet management and transaction approval UI
   - Communicates with content script via Chrome messaging
   - Handles password management and key encryption

### Data Flow

```
Web Page → Injected SDK → Content Script → Extension UI
    ↑                                           ↓
    └───────── Response with signature ─────────┘
```

## Getting Started

### Installation

Currently, the extension requires manual installation:

1. Clone the repository
2. Run `npm install` and `npm run build`
3. Load the unpacked extension in Chrome from the `dist` folder

### Basic Integration

```javascript
// Check if extension is available
if (!window.dashPlatformSDK) {
  console.error('Dash Platform Extension not found!');
  return;
}

// The SDK is automatically injected
const sdk = window.dashPlatformSDK;

// Available namespaces:
// - sdk.identities
// - sdk.documents
// - sdk.stateTransitions
// - sdk.signer (extension-specific)
```

### Extension Detection Pattern

```javascript
async function waitForExtension(timeout = 3000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (window.dashPlatformSDK) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

// Usage
const extensionAvailable = await waitForExtension();
if (!extensionAvailable) {
  // Show user message to install extension
}
```

## Understanding Nonces

### What Are Nonces?

Nonces (Number used ONCE) are critical security mechanisms that:
- Prevent replay attacks by ensuring each transaction is unique
- Maintain proper transaction ordering
- Provide unique transaction identification

### Types of Nonces

1. **Identity Nonce**: Global nonce for identity-level operations
2. **Identity Contract Nonce**: Per-contract nonce for document operations (most commonly used)

### Identity Contract Nonce Details

- Scoped to identity + data contract combination
- Starts at 0, must increment by 1 for each transaction
- Stored as 40-bit value (max: 1,099,511,627,775)
- Must be fetched before creating documents

### Working with Nonces

#### Fetching Current Nonce

```javascript
const currentNonce = await sdk.identities.getIdentityContractNonce(
  identityId,    // Identity ID (base58 string)
  dataContractId // Data Contract ID (base58 string)
);

console.log(`Current nonce: ${currentNonce}`); // BigInt value
```

#### Using Nonces Correctly

```javascript
// ALWAYS increment by 1 using BigInt notation
const newNonce = currentNonce + 1n;

// Create document with incremented nonce
const document = await sdk.documents.create(
  dataContractId,
  documentType,
  documentData,
  identityId,
  newNonce  // Use the incremented nonce
);

// Use SAME nonce for state transition
const stateTransition = await sdk.stateTransitions.documentsBatch.create(
  document,
  newNonce  // Same nonce as document
);
```

### Handling Nonce Conflicts

Nonce conflicts occur when multiple transactions try to use the same nonce:

```javascript
async function createDocumentWithRetry(data, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Get fresh nonce each attempt
      const nonce = await sdk.identities.getIdentityContractNonce(
        identityId,
        dataContractId
      );
      
      const document = await sdk.documents.create(
        dataContractId,
        'note',
        data,
        identityId,
        nonce + 1n
      );
      
      const stateTransition = await sdk.stateTransitions.documentsBatch.create(
        document,
        nonce + 1n
      );
      
      await sdk.signer.signStateTransition(stateTransition);
      return stateTransition.hash(true);
      
    } catch (error) {
      if (error.message.includes('ALREADY_EXISTS')) {
        console.log(`Nonce conflict, retry ${attempt + 1}/${maxAttempts}`);
        // Wait with exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Max retry attempts reached');
}
```

### Batch Operations and Nonces

Multiple documents in one batch use the SAME nonce:

```javascript
const nonce = await sdk.identities.getIdentityContractNonce(identity, contract);

// All documents use the same incremented nonce
const docs = await Promise.all([
  sdk.documents.create(contract, type, data1, identity, nonce + 1n),
  sdk.documents.create(contract, type, data2, identity, nonce + 1n),
  sdk.documents.create(contract, type, data3, identity, nonce + 1n)
]);

// Batch transition also uses the same nonce
const stateTransition = await sdk.stateTransitions.documentsBatch.create(
  docs,
  nonce + 1n
);
```

### Common Nonce Errors

1. **IdentityContractNonceOutOfBoundsError**: Nonce exceeds 40-bit limit
2. **ALREADY_EXISTS**: Nonce already used (in mempool)
3. **Nonce too low**: Using an already processed nonce

## Document Operations

### Document Creation Flow

1. Get identity contract nonce
2. Create document with incremented nonce
3. Create state transition
4. Sign via extension
5. Broadcast to network

### Complete Document Creation Example

```javascript
async function publishDocument(message) {
  const sdk = window.dashPlatformSDK;
  
  // Configuration
  const config = {
    dataContractId: '5TShWDTorV1TXXBsQ5Xo1zAzYt9w2LstgbcB8J4SKifF',
    identityId: 'DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq',
    documentType: 'note'
  };
  
  try {
    // Step 1: Check identity balance
    const balance = await sdk.identities.getBalance(config.identityId);
    if (balance < 1000) {
      throw new Error('Insufficient credits');
    }
    
    // Step 2: Get current nonce
    const nonce = await sdk.identities.getIdentityContractNonce(
      config.identityId,
      config.dataContractId
    );
    
    // Step 3: Create document
    const document = await sdk.documents.create(
      config.dataContractId,
      config.documentType,
      { message, timestamp: Date.now() },
      config.identityId,
      nonce + 1n
    );
    
    // Step 4: Create state transition
    const stateTransition = await sdk.stateTransitions.documentsBatch.create(
      document,
      nonce + 1n
    );
    
    // Step 5: Sign (opens extension popup)
    console.log('Please approve in extension popup...');
    await sdk.signer.signStateTransition(stateTransition);
    
    const txHash = stateTransition.hash(true);
    console.log(`Success! Transaction: ${txHash}`);
    
    return txHash;
    
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
}
```

### Querying Documents

For reading documents, you can use either the extension SDK or a standalone SDK:

```javascript
// Option 1: Using extension SDK (if available)
const docs = await window.dashPlatformSDK.documents.query(
  dataContractId,
  documentType,
  [],     // Where clause
  null,   // Order by
  10      // Limit
);

// Option 2: Using standalone SDK (no extension required)
import { DashPlatformSDK } from 'dash-platform-sdk';
const readOnlySDK = new DashPlatformSDK({ network: 'testnet' });

const docs = await readOnlySDK.documents.query(
  dataContractId,
  documentType,
  [],     // Where clause
  null,   // Order by
  10      // Limit
);

// Process WASM documents
docs.forEach(doc => {
  console.log({
    id: doc.getId().base58(),
    owner: doc.getOwnerId().base58(),
    data: doc.getProperties(),
    created: new Date(doc.getCreatedAt())
  });
});
```

### Advanced Queries

```javascript
// Query with filters
const whereClause = [
  ['field1', '==', 'value1'],
  ['field2', '>', 100],
  ['field3', 'in', ['option1', 'option2']]
];

const orderBy = [
  ['createdAt', 'desc']
];

const documents = await sdk.documents.query(
  dataContractId,
  documentType,
  whereClause,
  orderBy,
  20  // limit
);
```

### Document Schema Examples

```javascript
// DPNS Domain Document
const domainDoc = {
  label: 'myname',
  normalizedLabel: 'myname',
  normalizedParentDomainName: 'dash',
  parentDomainName: 'dash',
  preorderSalt: Buffer.from('randomsalt').toString('base64'),
  records: {
    dashUniqueIdentityId: identityId
  },
  subdomainRules: {
    allowSubdomains: false
  }
};

// DashPay Profile Document
const profileDoc = {
  avatarUrl: 'https://example.com/avatar.jpg',
  displayName: 'John Doe',
  aboutMe: 'Dash Platform Developer',
  publicMessage: 'Building on Dash!'
};

// Custom Application Document
const customDoc = {
  title: 'My Document',
  content: 'Lorem ipsum...',
  tags: ['tag1', 'tag2'],
  metadata: {
    version: 1,
    createdBy: 'app-v1.0'
  }
};
```

## API Architecture

### Public vs Private APIs

The extension implements strict separation between public and private APIs:

#### PublicAPI (Web Page Access)

Available methods:
- `CONNECT_APP`: Request permission to connect
- `REQUEST_STATE_TRANSITION_APPROVAL`: Request transaction signing

Characteristics:
- Uses `window.postMessage` for communication
- Limited functionality
- Cannot access sensitive data
- All operations require user approval

#### PrivateAPI (Extension Internal)

Available methods:
- Identity management: Create, switch, list identities
- Wallet operations: Create, switch wallets
- State transitions: Approve, reject, get details
- Security: Password setup and verification
- App connections: Manage connected applications

Characteristics:
- Uses Chrome runtime messaging
- Full access to sensitive operations
- Requires password authentication
- Only accessible within extension context

### Using the Public API

```javascript
// The extension automatically injects the SDK with custom signer
const sdk = window.dashPlatformSDK;

// Connect your app (optional, for permission management)
await sdk.signer.connect(window.location.origin);

// Sign a state transition (opens popup)
await sdk.signer.signStateTransition(stateTransition);
```

### Security Boundaries

1. Web pages can only request user actions
2. All sensitive operations require explicit approval
3. Private keys never leave the extension
4. Each wallet has isolated app connections

## Communication Protocols

### Message Structure

All extension messages follow this format:

```typescript
interface EventData {
  id: string;              // Unique request ID
  context: string;         // Always 'dash-platform-extension'
  method: string;          // Method name from MessagingMethods
  payload?: any;           // Method-specific data
  error?: any;             // Error if failed
  type: 'request' | 'response';
}
```

### Communication Flow

1. **Web Page → Content Script**: Via `window.postMessage`
2. **Content Script → Extension UI**: Via `chrome.runtime.onMessage`
3. **Async Polling**: For user approval results
4. **Timeout Handling**: 3-minute timeout for all operations

### Approval Flow Example

```javascript
// 1. DApp creates state transition
const stateTransition = await createStateTransition();

// 2. Request signing (opens popup)
const signer = window.dashPlatformSDK.signer;
await signer.signStateTransition(stateTransition);

// Behind the scenes:
// - Extension creates pending request
// - Opens popup for user approval
// - User enters password and approves
// - Extension signs with private key
// - Returns signed transaction
```

## Security Considerations

### Key Storage

- Private keys encrypted with password-derived keys
- Stored in Chrome's local storage
- Isolated per wallet, network, and identity

### Best Practices

1. **Never trust user input**: Always validate
2. **Check identity balance**: Before operations
3. **Handle popup blocking**: Some browsers block popups
4. **Implement timeouts**: For approval flows
5. **Store minimal data**: In your application

### Common Security Patterns

```javascript
// Validate identity ownership
async function validateIdentity(identityId) {
  try {
    const identity = await sdk.identities.getByIdentifier(identityId);
    const balance = await sdk.identities.getBalance(identityId);
    
    return {
      valid: true,
      balance,
      publicKeys: identity.getPublicKeys().length
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Secure document creation with validation
async function secureCreateDocument(data) {
  // Validate data
  if (!data.message || typeof data.message !== 'string') {
    throw new Error('Invalid message');
  }
  
  if (data.message.length > 1000) {
    throw new Error('Message too long');
  }
  
  // Sanitize data
  const sanitized = {
    message: data.message.trim(),
    timestamp: Date.now()
  };
  
  // Create document...
}
```

## Best Practices

### 1. Nonce Management

```javascript
class NonceManager {
  constructor(sdk, identityId) {
    this.sdk = sdk;
    this.identityId = identityId;
    this.nonceCache = new Map();
  }
  
  async getNonce(contractId) {
    const cacheKey = `${this.identityId}-${contractId}`;
    const cached = this.nonceCache.get(cacheKey);
    
    // Use cached if less than 1 minute old
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.nonce;
    }
    
    const nonce = await this.sdk.identities.getIdentityContractNonce(
      this.identityId,
      contractId
    );
    
    this.nonceCache.set(cacheKey, {
      nonce,
      timestamp: Date.now()
    });
    
    return nonce;
  }
  
  invalidateCache(contractId) {
    const cacheKey = `${this.identityId}-${contractId}`;
    this.nonceCache.delete(cacheKey);
  }
}
```

### 2. Error Handling

```javascript
class DashPlatformError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function handleDocumentCreation(data) {
  try {
    return await createDocument(data);
  } catch (error) {
    if (error.message.includes('ALREADY_EXISTS')) {
      throw new DashPlatformError(
        'Transaction already in progress',
        'NONCE_CONFLICT',
        { shouldRetry: true }
      );
    }
    
    if (error.message.includes('Insufficient')) {
      throw new DashPlatformError(
        'Not enough credits',
        'INSUFFICIENT_BALANCE',
        { shouldRetry: false }
      );
    }
    
    if (error.message.includes('User rejected')) {
      throw new DashPlatformError(
        'User cancelled transaction',
        'USER_REJECTED',
        { shouldRetry: false }
      );
    }
    
    throw error;
  }
}
```

### 3. Dual SDK Architecture

For optimal user experience, use two SDK instances:

```javascript
// Reading SDK - No extension required
const readSDK = new DashPlatformSDK({ network: 'testnet' });

// Writing SDK - Requires extension
const writeSDK = window.dashPlatformSDK;

class DashService {
  async getDocuments(contractId, type) {
    // Use read SDK for queries
    return readSDK.documents.query(contractId, type, [], null, 100);
  }
  
  async createDocument(contractId, type, data, identityId) {
    // Use extension SDK for writes
    if (!writeSDK) {
      throw new Error('Extension required for this operation');
    }
    
    const nonce = await writeSDK.identities.getIdentityContractNonce(
      identityId,
      contractId
    );
    
    // ... create and sign
  }
}
```

### 4. Browser Compatibility

Add Buffer polyfill for browser compatibility:

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

## Common Patterns and Examples

### Pattern 1: Extension Status Component

```javascript
function ExtensionStatus() {
  const [status, setStatus] = useState('checking');
  const [identity, setIdentity] = useState(null);
  
  useEffect(() => {
    checkExtension();
  }, []);
  
  async function checkExtension() {
    // Wait for extension
    const available = await waitForExtension();
    
    if (!available) {
      setStatus('not-installed');
      return;
    }
    
    try {
      // Try to get current identity (may fail if not set up)
      const sdk = window.dashPlatformSDK;
      // This would need the actual implementation
      setStatus('ready');
    } catch (error) {
      setStatus('not-configured');
    }
  }
  
  return (
    <div>
      {status === 'checking' && 'Checking extension...'}
      {status === 'not-installed' && 'Please install Dash Extension'}
      {status === 'not-configured' && 'Please set up your identity'}
      {status === 'ready' && 'Extension ready!'}
    </div>
  );
}
```

### Pattern 2: Transaction Queue

```javascript
class TransactionQueue {
  constructor(sdk) {
    this.sdk = sdk;
    this.queue = [];
    this.processing = false;
  }
  
  async add(operation) {
    this.queue.push(operation);
    if (!this.processing) {
      this.process();
    }
  }
  
  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      
      try {
        await this.executeWithRetry(operation);
      } catch (error) {
        console.error('Operation failed:', error);
        operation.reject(error);
      }
    }
    
    this.processing = false;
  }
  
  async executeWithRetry(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation.execute();
        operation.resolve(result);
        return;
      } catch (error) {
        if (error.message.includes('ALREADY_EXISTS') && i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  }
}

// Usage
const queue = new TransactionQueue(sdk);

function createDocument(data) {
  return new Promise((resolve, reject) => {
    queue.add({
      execute: async () => {
        // Document creation logic
        return txHash;
      },
      resolve,
      reject
    });
  });
}
```

### Pattern 3: Real-time Document Updates

```javascript
class DocumentWatcher {
  constructor(sdk, contractId, documentType) {
    this.sdk = sdk;
    this.contractId = contractId;
    this.documentType = documentType;
    this.callbacks = new Set();
    this.lastCheck = 0;
    this.polling = false;
  }
  
  subscribe(callback) {
    this.callbacks.add(callback);
    if (!this.polling) {
      this.startPolling();
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stopPolling();
      }
    };
  }
  
  async startPolling() {
    this.polling = true;
    
    while (this.polling) {
      try {
        const docs = await this.sdk.documents.query(
          this.contractId,
          this.documentType,
          [['$createdAt', '>', this.lastCheck]],
          [['$createdAt', 'asc']],
          100
        );
        
        if (docs.length > 0) {
          this.lastCheck = docs[docs.length - 1].getCreatedAt();
          
          // Notify all subscribers
          docs.forEach(doc => {
            this.callbacks.forEach(cb => cb(doc));
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      
      // Wait 5 seconds between polls
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  stopPolling() {
    this.polling = false;
  }
}

// Usage
const watcher = new DocumentWatcher(sdk, contractId, 'message');

const unsubscribe = watcher.subscribe(doc => {
  console.log('New document:', doc.getProperties());
});

// Later: unsubscribe();
```

## Troubleshooting

### Common Issues and Solutions

#### Extension Not Detected

```javascript
// Solution 1: Wait longer
const found = await waitForExtension(5000); // 5 seconds

// Solution 2: Check if being blocked
if (!chrome?.runtime?.id) {
  console.error('Extension APIs blocked - check browser settings');
}

// Solution 3: Manual reload
window.location.reload();
```

#### Popup Blocked

```javascript
// Detect popup blocking
let popupBlocked = false;

try {
  await sdk.signer.signStateTransition(st);
} catch (error) {
  if (error.message.includes('popup')) {
    popupBlocked = true;
    alert('Please allow popups for this site');
  }
}
```

#### Nonce Conflicts

```javascript
// Implement smart retry with backoff
async function smartRetry(fn, maxAttempts = 5) {
  const delays = [0, 1000, 2000, 4000, 8000]; // Exponential backoff
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('ALREADY_EXISTS') && i < maxAttempts - 1) {
        console.log(`Retry ${i + 1}/${maxAttempts} after ${delays[i]}ms`);
        await new Promise(r => setTimeout(r, delays[i]));
        continue;
      }
      throw error;
    }
  }
}
```

#### Identity Not Found

```javascript
// Validate identity before operations
async function validateBeforeOperation(identityId) {
  try {
    const identity = await sdk.identities.getByIdentifier(identityId);
    const balance = await sdk.identities.getBalance(identityId);
    
    if (balance < 1000) {
      throw new Error('Insufficient balance for operation');
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new Error('Identity does not exist on network');
    }
    throw error;
  }
}
```

### Debug Logging

```javascript
// Enable detailed logging
class DebugLogger {
  constructor(enabled = true) {
    this.enabled = enabled;
  }
  
  log(action, data) {
    if (!this.enabled) return;
    
    console.log(`[DashPlatform] ${action}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
  
  error(action, error) {
    console.error(`[DashPlatform] ${action} failed`, {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
  }
}

const logger = new DebugLogger();

// Use throughout your code
logger.log('CREATE_DOCUMENT', { contractId, type, nonce });
logger.error('CREATE_DOCUMENT', error);
```

## Conclusion

The Dash Platform Extension provides a secure, user-friendly way to interact with the Dash Platform blockchain. By following this guide and the patterns shown, you can build robust applications that leverage the full power of Dash Platform while maintaining security and providing excellent user experience.

### Key Takeaways

1. **Always handle nonces carefully** - They're critical for transaction success
2. **Implement retry logic** - Network conditions can cause temporary failures
3. **Use dual SDK approach** - Separate read/write operations for better UX
4. **Handle errors gracefully** - Provide clear feedback to users
5. **Test thoroughly** - Use the patterns shown for comprehensive testing

### Additional Resources

- [Dash Platform Documentation](https://docs.dash.org/projects/platform/)
- [Extension GitHub Repository](https://github.com/dashpay/platform)
- [Dash Developer Discord](https://discord.gg/PXbUxJB)

For the latest updates and more examples, check the official repositories and join the Dash developer community.