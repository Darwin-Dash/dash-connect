# Dash Feed App API Documentation

This document describes the API patterns and SDK usage in the Dash Feed App, focusing on the dual SDK architecture and common operations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [SDK Initialization](#sdk-initialization)
- [Reading Operations](#reading-operations)
- [Writing Operations](#writing-operations)
- [Extension Integration](#extension-integration)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Architecture Overview

The Dash Feed App uses a **dual SDK architecture** to optimize for both functionality and user experience:

1. **Reading SDK** - Direct SDK instance for public operations
2. **Extension SDK** - Browser extension SDK for authenticated operations

### Why Dual SDK?

- **Reading always works** - No extension required for viewing documents
- **Writing is secure** - Private keys stay in the extension
- **Better performance** - No unnecessary extension overhead for reads
- **Clear separation** - Public vs private operations are explicit

## SDK Initialization

### Reading SDK (Standalone)

```typescript
import { DashPlatformSDK } from 'dash-platform-sdk';

// Initialize for reading operations
const readOnlySDK = new DashPlatformSDK({ 
  network: 'testnet' // or 'mainnet'
});
```

### Extension SDK

```typescript
// Wait for extension to inject SDK
async function waitForExtension(timeout = 3000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (window.dashPlatformSDK) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

// Use extension SDK for writing
const extensionSDK = window.dashPlatformSDK;
```

## Reading Operations

### Query Documents

```typescript
// Using the reading SDK (no extension required)
async function queryDocuments(
  dataContractId: string,
  documentType: string,
  limit: number = 50
): Promise<Document[]> {
  // IMPORTANT: Use parameter list format, NOT object format
  const wasmDocuments = await readOnlySDK.documents.query(
    dataContractId,
    documentType,
    [],     // where clause (empty array for all documents)
    null,   // orderBy (null for default)
    limit   // limit
  );
  
  // Convert WASM objects to JavaScript
  return wasmDocuments.map(convertWasmDocument);
}
```

### Convert WASM Documents

```typescript
function convertWasmDocument(wasmDoc: any): Document {
  const id = wasmDoc.getId();
  const ownerId = wasmDoc.getOwnerId();
  const dataContractId = wasmDoc.getDataContractId();
  
  return {
    $id: id?.base58?.() || id,
    $ownerId: ownerId?.base58?.() || ownerId,
    $dataContractId: dataContractId?.base58?.() || dataContractId,
    $createdAt: wasmDoc.getCreatedAt(),
    $updatedAt: wasmDoc.getUpdatedAt(),
    ...wasmDoc.getProperties() // Document data (e.g., message, timestamp)
  };
}
```

### Advanced Queries

```typescript
// Query with filters
async function queryWithFilters() {
  const whereClause = [
    ['timestamp', '>', Date.now() - 86400000], // Last 24 hours
    ['type', '==', 'note']
  ];
  
  const orderBy = [
    ['$createdAt', 'desc']
  ];
  
  return await readOnlySDK.documents.query(
    dataContractId,
    documentType,
    whereClause,
    orderBy,
    100
  );
}
```

## Writing Operations

### Get Identity Information

```typescript
// Check identity balance before operations
async function checkIdentityBalance(identityId: string): Promise<bigint> {
  return await extensionSDK.identities.getBalance(identityId);
}

// Get current nonce for document creation
async function getCurrentNonce(
  identityId: string,
  dataContractId: string
): Promise<bigint> {
  return await extensionSDK.identities.getIdentityContractNonce(
    identityId,
    dataContractId
  );
}
```

### Create Document

```typescript
async function createDocument(
  message: string,
  identityId: string,
  dataContractId: string,
  documentType: string
): Promise<string> {
  // Step 1: Get current nonce
  const currentNonce = await extensionSDK.identities.getIdentityContractNonce(
    identityId,
    dataContractId
  );
  
  // Step 2: Create document with incremented nonce
  const document = await extensionSDK.documents.create(
    dataContractId,
    documentType,
    {
      message,
      timestamp: Date.now()
    },
    identityId,
    currentNonce + 1n // IMPORTANT: Increment by 1n (BigInt)
  );
  
  // Step 3: Create state transition
  const stateTransition = await extensionSDK.stateTransitions.documentsBatch.create(
    document,
    currentNonce + 1n // Use same nonce as document
  );
  
  // Step 4: Sign with extension (opens popup)
  await extensionSDK.signer.signStateTransition(stateTransition);
  
  // Return transaction hash
  return stateTransition.hash(true);
}
```

### Batch Document Creation

```typescript
async function createMultipleDocuments(
  documents: Array<{ message: string }>,
  identityId: string,
  dataContractId: string
): Promise<string> {
  const nonce = await extensionSDK.identities.getIdentityContractNonce(
    identityId,
    dataContractId
  );
  
  // All documents in batch use the same nonce
  const createdDocs = await Promise.all(
    documents.map(data => 
      extensionSDK.documents.create(
        dataContractId,
        'note',
        { ...data, timestamp: Date.now() },
        identityId,
        nonce + 1n
      )
    )
  );
  
  // Single state transition for all documents
  const stateTransition = await extensionSDK.stateTransitions.documentsBatch.create(
    createdDocs,
    nonce + 1n
  );
  
  await extensionSDK.signer.signStateTransition(stateTransition);
  return stateTransition.hash(true);
}
```

## Extension Integration

### Extension Adapter Pattern

```typescript
class DashExtensionAdapter {
  private extensionSDK: any;
  
  constructor(extensionSDK: any) {
    this.extensionSDK = extensionSDK;
  }
  
  async signStateTransition(stateTransition: any): Promise<void> {
    try {
      await this.extensionSDK.signer.signStateTransition(stateTransition);
    } catch (error) {
      if (error.message?.includes('User rejected')) {
        throw new Error('USER_REJECTED');
      }
      throw error;
    }
  }
  
  async getIdentityIds(): Promise<string[]> {
    // Note: getCurrentIdentity() not available in current extension
    // Using hardcoded identity as workaround
    return ['DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq'];
  }
}
```

### Handling Extension States

```typescript
enum ExtensionState {
  NOT_INSTALLED = 'not-installed',
  NOT_CONFIGURED = 'not-configured',
  READY = 'ready',
  BUSY = 'busy'
}

function getExtensionState(): ExtensionState {
  if (!window.dashPlatformSDK) {
    return ExtensionState.NOT_INSTALLED;
  }
  
  // Try to detect if configured (this is approximate)
  try {
    // Extension exists, assume it's ready
    return ExtensionState.READY;
  } catch {
    return ExtensionState.NOT_CONFIGURED;
  }
}
```

## State Management

### Feed Store (Zustand)

```typescript
interface FeedStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  
  fetchDocuments: (contractId: string, type: string) => Promise<void>;
  addDocument: (doc: Document) => void;
  reset: () => void;
}

const useFeedStore = create<FeedStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  
  fetchDocuments: async (contractId, type) => {
    set({ isLoading: true, error: null });
    
    try {
      const docs = await queryDocuments(contractId, type);
      set({ documents: docs, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addDocument: (doc) => {
    set(state => ({
      documents: [doc, ...state.documents]
    }));
  },
  
  reset: () => set({ documents: [], isLoading: false, error: null })
}));
```

### Transaction Store

```typescript
interface Transaction {
  id: string;
  status: 'pending' | 'success' | 'error';
  hash?: string;
  error?: string;
  timestamp: number;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
}
```

## Error Handling

### Common Errors and Solutions

```typescript
async function handleDocumentCreation(data: any) {
  try {
    const txHash = await createDocument(data);
    return { success: true, txHash };
  } catch (error) {
    // Nonce conflict - retry with fresh nonce
    if (error.message?.includes('ALREADY_EXISTS')) {
      return retryWithBackoff(() => createDocument(data));
    }
    
    // User rejection - don't retry
    if (error.message?.includes('User rejected')) {
      return { success: false, error: 'User cancelled transaction' };
    }
    
    // Insufficient balance
    if (error.message?.includes('Insufficient')) {
      return { success: false, error: 'Not enough credits' };
    }
    
    // Generic error
    return { success: false, error: error.message };
  }
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5
): Promise<T> {
  const delays = [0, 1000, 2000, 4000, 8000];
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      
      if (error.message?.includes('ALREADY_EXISTS')) {
        await new Promise(r => setTimeout(r, delays[i]));
        continue;
      }
      
      throw error; // Don't retry other errors
    }
  }
  
  throw new Error('Max retry attempts reached');
}
```

## Type Definitions

### Core Types

```typescript
// Document structure after WASM conversion
interface Document {
  $id: string;
  $ownerId: string;
  $dataContractId: string;
  $createdAt: number;
  $updatedAt: number;
  // Document-specific fields
  message?: string;
  timestamp?: number;
  [key: string]: any;
}

// Network configuration
interface NetworkConfig {
  network: 'testnet' | 'mainnet';
  dataContractId: string;
  identityId: string | null;
  blockExplorerUrl: string;
}

// Extension SDK type (simplified)
interface ExtensionSDK {
  identities: {
    getBalance(identityId: string): Promise<bigint>;
    getIdentityContractNonce(
      identityId: string,
      contractId: string
    ): Promise<bigint>;
  };
  documents: {
    create(
      contractId: string,
      type: string,
      data: any,
      identityId: string,
      nonce: bigint
    ): Promise<any>;
    query(
      contractId: string,
      type: string,
      where: any[],
      orderBy: any,
      limit: number
    ): Promise<any[]>;
  };
  stateTransitions: {
    documentsBatch: {
      create(documents: any, nonce: bigint): Promise<any>;
    };
  };
  signer: {
    signStateTransition(st: any): Promise<void>;
  };
}
```

### Window Type Extension

```typescript
// Add to a global.d.ts file
declare global {
  interface Window {
    dashPlatformSDK?: ExtensionSDK;
    Buffer?: {
      from(data: string | ArrayBuffer): Uint8Array;
      allocUnsafe(size: number): Uint8Array;
      concat(arrays: Uint8Array[]): Uint8Array;
    };
  }
}
```

## Best Practices

1. **Always use the reading SDK for queries** - It doesn't require the extension
2. **Check extension availability before writing** - Provide clear feedback when unavailable
3. **Handle WASM conversion properly** - Use the provided conversion functions
4. **Increment nonces correctly** - Always use `+ 1n` for BigInt increment
5. **Implement proper error handling** - Different errors need different responses
6. **Use exponential backoff for retries** - Only for nonce conflicts
7. **Keep state transitions atomic** - All documents in a batch use the same nonce

## Example: Complete Integration

```typescript
class DashService {
  private readOnlySDK: DashPlatformSDK;
  private extensionSDK?: ExtensionSDK;
  
  constructor(network: 'testnet' | 'mainnet') {
    // Always initialize reading SDK
    this.readOnlySDK = new DashPlatformSDK({ network });
    
    // Extension SDK is optional
    this.extensionSDK = window.dashPlatformSDK;
  }
  
  // Public operations - always work
  async queryDocuments(contractId: string, type: string): Promise<Document[]> {
    const docs = await this.readOnlySDK.documents.query(
      contractId, type, [], null, 50
    );
    return docs.map(convertWasmDocument);
  }
  
  // Private operations - require extension
  async createDocument(
    contractId: string,
    type: string,
    data: any,
    identityId: string
  ): Promise<string> {
    if (!this.extensionSDK) {
      throw new Error('Extension required for this operation');
    }
    
    const nonce = await this.extensionSDK.identities.getIdentityContractNonce(
      identityId,
      contractId
    );
    
    const doc = await this.extensionSDK.documents.create(
      contractId,
      type,
      data,
      identityId,
      nonce + 1n
    );
    
    const st = await this.extensionSDK.stateTransitions.documentsBatch.create(
      doc,
      nonce + 1n
    );
    
    await this.extensionSDK.signer.signStateTransition(st);
    return st.hash(true);
  }
}
```

This API design ensures that reading always works while maintaining security for writing operations through the browser extension.