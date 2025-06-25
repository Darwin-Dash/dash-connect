# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Commands

### Development
- `npm run dev` - Start development server (http://localhost:5173)
- `npm test` - Run test suite with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:run` - Run tests once (no watch mode)
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
- `src/lib/mock-sdk.ts` - Mock SDK implementation for testing without blockchain
- Enable by setting `VITE_USE_MOCK_SDK=true` in development