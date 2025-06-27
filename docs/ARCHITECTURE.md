# Dash Connect Architecture Documentation

## Project Overview

Dash Connect is a modern, client-side web application that demonstrates interaction with Dash Platform using a dual SDK architecture. It provides a beautiful feed interface for reading and publishing documents to the Dash blockchain.

## Core Architecture

### Dual SDK Architecture ⭐

The application uses **two separate SDK instances** for different purposes:

1. **Reading SDK** (`readOnlySDK`)
   - Direct instantiation: `new DashPlatformSDK({ network })`
   - Used for: Document queries (public operations)
   - Always works - no extension required
   - Handles WASM object conversion automatically

2. **Extension SDK** (`extensionSDK`) 
   - Uses: `window.dashPlatformSDK` injected by browser extension
   - Used for: Document creation/publishing (private operations)
   - Requires: Extension installation and user approval
   - Shows extension popup for transaction signing

### Benefits
- ✅ Reading: App works immediately without setup
- ✅ Publishing: Secure via browser extension when available
- ✅ Performance: No unnecessary extension dependency for reads
- ✅ UX: Clear separation between public and private operations

## File Structure & Responsibilities

### Core Application Files

```
src/
├── App.tsx                          # Main application component
├── main.tsx                         # React entry point
├── index.css                        # Global styles with Tailwind v4
└── vite-env.d.ts                    # Vite type definitions
```

### Components (`src/components/`)

```
components/
├── FeedList.tsx                     # Main feed container, handles publishing
├── FeedItem.tsx                     # Individual document display
├── PublishCard.tsx                  # Message publishing interface
├── NetworkSelector.tsx              # Network switching (testnet/mainnet)
├── WalletIndicator.tsx             # Extension status indicator
├── PendingTransactions.tsx         # Transaction status display
├── FeedSkeleton.tsx                # Loading placeholders
├── ErrorMessage.tsx                # Error display with retry
├── ErrorBoundary.tsx               # React error boundary
├── ExtensionCheck.tsx              # Extension availability check
└── ui/                             # Reusable UI components
    ├── card.tsx                    # Card component
    └── skeleton.tsx                # Skeleton loader
```

### Core Services (`src/lib/`)

```
lib/
├── dash-service.ts                 # 🔥 CORE: Dual SDK implementation
├── extension-adapter.ts            # Extension API abstraction layer
├── mock-extension-sdk.ts           # Mock extension for development
├── dark-mode.ts                    # Dark mode management
└── utils.ts                        # Utility functions
```

### State Management (`src/stores/`)

```
stores/
├── feed-store.ts                   # Document feed state (Zustand)
└── transaction-store.ts            # Transaction status tracking
```

### Hooks (`src/hooks/`)

```
hooks/
├── useDashPlatform.ts              # Extension detection & status
└── useDocuments.ts                 # Document fetching & caching
```

### Context (`src/contexts/`)

```
contexts/
└── NetworkContext.tsx              # Network configuration & switching
```

### Types (`src/types/`)

```
types/
└── index.ts                        # TypeScript type definitions
```

## Key Components Deep Dive

### 1. DashService (`src/lib/dash-service.ts`)
**The heart of the dual SDK architecture**

```typescript
class DashService {
  private readOnlySDK: DashPlatformSDK     // For reading (public)
  private extensionSDK: ExtensionSDK       // For writing (private)
  private extensionAdapter: DashExtensionAdapter
}
```

**Key Methods:**
- `queryDocuments()` - Uses standalone SDK for reading
- `createDocument()` - Uses extension SDK for publishing
- `setNetwork()` - Updates both SDKs when network changes
- `reinitializeExtension()` - Detects extension availability

### 2. Extension Adapter (`src/lib/extension-adapter.ts`)
**Abstraction layer for browser extension API**

Handles different extension versions and provides consistent interface:
- Identity detection from extension
- State transition signing
- API exploration for debugging
- Graceful fallbacks when methods unavailable

### 3. Feed Store (`src/stores/feed-store.ts`)
**Global state management with Zustand**

```typescript
interface FeedStore {
  documents: DashDocument[]
  isLoading: boolean
  error: string | null
  isFetching: boolean
  newDocumentIds: string[]
  
  fetchDocuments: (contractId, type) => Promise<void>
  clearNewDocuments: () => void
  reset: () => void
}
```

**Smart Features:**
- Merge new documents without duplicates
- Highlight newly discovered documents
- Auto-clear highlights after 3 seconds
- Sort by creation time (newest first)

### 4. Network Context (`src/contexts/NetworkContext.tsx`)
**Network configuration hub**

```typescript
interface NetworkConfig {
  dataContractId: string
  identityId: string | null
  blockExplorerUrl: string
}
```

**Responsibilities:**
- Network switching (testnet/mainnet)
- Identity management
- Data contract configuration
- SDK network updates

## Data Flow

### Reading Documents (Public)
```
1. User opens app
2. useDashPlatform() initializes standalone SDK
3. useDocuments() polls for documents every 10s
4. dashService.queryDocuments() queries blockchain
5. WASM objects converted to JavaScript
6. FeedStore updates with new documents
7. UI renders document list
```

### Publishing Documents (Private)
```
1. User types message in PublishCard
2. Extension detection via useDashPlatform()
3. User clicks "Publish"
4. FeedList.handlePublish() called
5. Identity refreshed from extension
6. dashService.createDocument() creates transaction
7. Extension popup shows for signing
8. User approves in extension
9. Transaction broadcast to network
10. UI updates with success/error
11. Feed refreshes to show new document
```

## Testing Architecture

### Test Structure
```
tests/
├── src/test/setup.ts               # Test configuration
├── src/lib/*.test.ts               # Unit tests for services
├── src/components/*.test.ts        # Component tests
├── e2e/                            # End-to-end tests
│   ├── basic.spec.ts              # Basic app functionality
│   ├── extension.spec.ts          # Extension integration
│   ├── mock-extension.spec.ts     # Mock extension tests
│   └── visual.spec.ts             # Visual regression tests
└── scripts/                       # Test automation scripts
    ├── test-extension-integration.js
    └── test-extension-with-playwright.js
```

### Mock Extension System
**For development without real extension**

**Key Files:**
- `src/lib/mock-extension-sdk.ts` - Mock implementation
- `src/lib/mock-extension-wrapper.ts` - Browser integration
- Environment variable: `VITE_USE_MOCK_EXTENSION=true`

**Features:**
- Simulates popup approval with configurable delay
- Tracks identity balances and nonces
- Auto-approve or reject for testing
- Prevents real extension interference
- Buffer polyfill for browser compatibility

### Testing Commands
```bash
npm test                    # Unit tests with Vitest
npm run test:e2e           # End-to-end with Playwright
npm run test:mock          # Mock extension tests
npm run dev:mock           # Development with mock extension
```

## Styling Architecture

### Tailwind CSS v4
**Key Configuration:**
- `src/index.css` - Main styles with `@import "tailwindcss"`
- `tailwind.config.js` - Tailwind v4 configuration
- `postcss.config.js` - PostCSS with `@tailwindcss/postcss`

### Design System
```css
/* Custom utilities */
.floating-shadow    /* Layered shadow effects */
.glass             /* Backdrop-filter glass morphism */
.gradient-text     /* Gradient text effects */
.button-gradient   /* Button gradients */
```

### Dark Mode
- **Detection:** Automatic system preference via `matchMedia`
- **Implementation:** `dark` class on `<html>` element
- **Styling:** `:is(.dark)` selectors in CSS
- **Script:** `index.html` prevents flash of unstyled content

## Configuration

### Environment Variables
```env
VITE_DATA_CONTRACT_ID=        # Data contract ID
VITE_IDENTITY_ID=             # Default identity ID
VITE_USE_MOCK_EXTENSION=true  # Enable mock extension
```

### Network Configurations
```typescript
const NETWORK_CONFIGS = {
  testnet: {
    dataContractId: '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
    blockExplorerUrl: 'https://testnet-insight.dashevo.org'
  },
  mainnet: {
    dataContractId: 'TBD',
    blockExplorerUrl: 'https://insight.dashevo.org'
  }
}
```

## Security Model

### Private Key Management
- **Extension Only:** Private keys never leave browser extension
- **No Direct Access:** App cannot access private keys directly
- **Popup Approval:** All transactions require user approval
- **Signature Verification:** Extension handles all cryptographic operations

### API Boundaries
- **Public API:** Document queries, identity balance checks
- **Private API:** Document creation, state transitions
- **Extension API:** Identity management, transaction signing
- **Network API:** Direct blockchain communication

## Performance Optimizations

### Efficient Data Loading
- **Smart Merging:** Only add truly new documents
- **Deduplication:** Filter by document ID
- **Sorting:** Client-side by creation time
- **Limiting:** Keep only 50 most recent documents

### Background Operations
- **Polling:** Every 10 seconds for new documents
- **Silent Updates:** Background fetching without loading states
- **Optimistic UI:** Immediate feedback for user actions
- **Auto-refresh:** Periodic extension detection

## Known Issues & Workarounds

### 1. Identity Detection
**Issue:** Extension doesn't expose `getCurrentIdentity()` method
**Workaround:** Hardcoded identity `DcoJJ3W9JauwLD51vzNuXJ9vnaZT7mprVm7wbgVYifNq`
**TODO:** Remove when extension adds proper identity API

### 2. Nonce Management
**Issue:** Transactions can get stuck in mempool
**Symptoms:** "ALREADY_EXISTS" errors with same nonce
**Solution:** Manual nonce override, wait for mempool clearing

### 3. Buffer Compatibility
**Issue:** SDK uses Node.js Buffer, not available in browsers
**Solution:** Buffer polyfill in mock extension and production setup

## Development Workflow

### Local Development
1. `npm run dev` - Basic development server
2. `npm run dev:mock` - Development with mock extension
3. `npm test` - Run test suite
4. `npm run lint` - Type checking and linting

### Extension Testing
1. `npm run test:extension` - Manual extension testing
2. `npm run test:extension:playwright` - Automated browser testing
3. Load `test-extension-publish.html` for manual testing

### Production Deployment
1. `npm run build` - Build static files to `dist/`
2. Deploy `dist/` folder to any static host
3. No server or API keys required

## Future Improvements

### Short Term
- [ ] Dynamic identity detection from extension
- [ ] Mainnet configuration
- [ ] Enhanced error handling for nonce conflicts
- [ ] Real-time document updates via WebSocket

### Long Term
- [ ] Multi-contract support
- [ ] Advanced document filtering
- [ ] Offline mode with sync
- [ ] Mobile app version

## Conclusion

Dash Connect demonstrates a robust architecture for blockchain applications with its dual SDK approach. The separation of public reading operations from private writing operations provides an optimal balance of functionality, security, and user experience.

The comprehensive testing suite, including mock extension support, ensures reliable development and deployment. The modular architecture makes it easy to extend and maintain while following React and TypeScript best practices.