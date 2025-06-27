# Dash Platform Extension Test Cases

This document outlines comprehensive test scenarios for the Dash Platform browser extension based on DEVELOPER_GUIDE.md. Each test case includes steps to reproduce, expected behavior, and verification methods.

## 1. Normal Successful Publish Flow

### Test Case 1.1: Basic Document Publishing
**Objective**: Verify successful document creation and publication through extension

**Prerequisites**:
- Extension installed and configured with funded identity
- Valid identity ID and data contract ID
- Sufficient credit balance (>1000 credits)

**Steps**:
1. Open application with extension installed
2. Wait for extension to be detected (check for green status indicator)
3. Enter a message in the publish input field
4. Click "Publish" button
5. Approve transaction in extension popup
6. Wait for transaction confirmation

**Expected Behavior**:
- Extension popup appears within 2 seconds
- Popup shows transaction details (document type, data contract, estimated fee)
- After approval, loading state shows "Publishing..."
- Success notification appears with transaction hash
- New document appears in feed immediately
- Document persists after page refresh

**Verification**:
```javascript
// Check transaction on Platform Explorer
const txHash = 'returned-transaction-hash';
console.log(`Verify at: https://testnet.platform-explorer.com/transaction/${txHash}`);

// Query for document via SDK
const docs = await sdk.documents.query(dataContractId, 'note', [], null, 1);
const latestDoc = docs[0];
console.assert(latestDoc.getProperties().message === 'Your test message');
```

### Test Case 1.2: Batch Document Publishing
**Objective**: Verify multiple documents can be published in single transaction

**Steps**:
1. Create multiple documents with same nonce
2. Create batch state transition
3. Sign and broadcast

**Expected Behavior**:
- All documents use same incremented nonce
- Single popup approval for all documents
- All documents appear together after confirmation

## 2. Nonce Conflict Retry Scenarios

### Test Case 2.1: Automatic Nonce Retry
**Objective**: Verify automatic retry when nonce conflict occurs

**Prerequisites**:
- Two browser tabs open with same application
- Same identity loaded in both tabs

**Steps**:
1. In Tab 1: Start publishing a document
2. In Tab 2: Immediately start publishing another document
3. Approve both transactions quickly
4. Observe retry behavior

**Expected Behavior**:
- First transaction succeeds normally
- Second transaction gets "ALREADY_EXISTS" error
- Automatic retry with fresh nonce fetch
- Retry succeeds after 1-2 attempts
- Both documents eventually appear in feed

**Verification**:
```javascript
// Monitor console for retry logs
// Should see: "Nonce conflict, retry 1/5"
// Final result: both documents published with sequential nonces
```

### Test Case 2.2: Maximum Retry Exhaustion
**Objective**: Verify behavior when all retry attempts fail

**Steps**:
1. Simulate rapid publishing that exhausts retry attempts
2. Create 6+ simultaneous publish requests

**Expected Behavior**:
- First few succeed
- Later ones retry up to 5 times
- After max retries, error: "Max retry attempts reached"
- User sees clear error message
- Can retry manually after waiting

### Test Case 2.3: Mempool Stuck Transaction
**Objective**: Test handling of stuck transactions in mempool

**Steps**:
1. Check current nonce via "Check Nonce" button
2. Create transaction that gets stuck (network congestion simulation)
3. Attempt new transaction with same nonce

**Expected Behavior**:
- "ALREADY_EXISTS: state transition already in mempool" error
- Error properly displayed to user
- Manual nonce override option available
- After mempool clears (~few minutes), transactions resume normally

**Verification**:
```javascript
// Check current nonce
const currentNonce = await sdk.identities.getIdentityContractNonce(identityId, contractId);
console.log('Current nonce:', currentNonce.toString());

// If stuck, increment manually
const nextNonce = currentNonce + 2n; // Skip stuck nonce
```

## 3. Extension Not Found Scenarios

### Test Case 3.1: No Extension Installed
**Objective**: Verify graceful degradation without extension

**Steps**:
1. Access application without extension installed
2. Observe UI state and functionality

**Expected Behavior**:
- Red status indicator shows "Dash Extension not found"
- Publish UI is disabled/hidden
- "Install Extension" link displayed
- Reading functionality works normally
- Feed updates continue without extension

**Verification**:
```javascript
// Extension detection check
console.assert(window.dashPlatformSDK === undefined);
// Verify read-only SDK still works
const readSDK = new DashPlatformSDK({ network: 'testnet' });
const docs = await readSDK.documents.query(contractId, type, [], null, 10);
```

### Test Case 3.2: Extension Loads After Page
**Objective**: Test delayed extension detection

**Steps**:
1. Disable extension
2. Load application
3. Enable extension while app is running
4. Wait for detection

**Expected Behavior**:
- Initial state: "Extension not found"
- After enabling: Status updates within 3 seconds
- Publish UI becomes available
- No page reload required

### Test Case 3.3: Extension Blocked by Browser
**Objective**: Handle browser blocking extension APIs

**Steps**:
1. Use browser with strict extension policies
2. Block extension runtime access

**Expected Behavior**:
- Detect blocking via `chrome?.runtime?.id` check
- Show specific error: "Extension APIs blocked"
- Provide browser settings guidance
- Fallback to read-only mode

## 4. User Rejection Scenarios

### Test Case 4.1: Transaction Rejection
**Objective**: Verify handling when user rejects transaction

**Steps**:
1. Create document and request signing
2. Click "Reject" in extension popup
3. Observe application behavior

**Expected Behavior**:
- Popup closes immediately
- Error: "User rejected transaction"
- No retry attempts (user intent is clear)
- Publish form returns to ready state
- User can try again immediately

**Verification**:
```javascript
try {
  await sdk.signer.signStateTransition(st);
} catch (error) {
  console.assert(error.message.includes('User rejected'));
  console.assert(error.code === 'USER_REJECTED');
}
```

### Test Case 4.2: Popup Timeout
**Objective**: Test 3-minute timeout for approval

**Steps**:
1. Request transaction signing
2. Leave popup open without action
3. Wait for timeout (3 minutes)

**Expected Behavior**:
- After 3 minutes: timeout error
- Popup auto-closes
- Error message: "Transaction approval timed out"
- Can retry immediately

## 5. Insufficient Balance Scenarios

### Test Case 5.1: Zero Balance
**Objective**: Verify behavior with no credits

**Prerequisites**:
- Identity with 0 credit balance

**Steps**:
1. Attempt to publish document
2. Observe error handling

**Expected Behavior**:
- Balance check before transaction creation
- Early error: "Insufficient credits"
- No popup shown (fails before signing)
- Shows current balance and required amount
- Link to faucet or top-up instructions

**Verification**:
```javascript
const balance = await sdk.identities.getBalance(identityId);
console.assert(balance === 0n);
// Should fail before creating state transition
```

### Test Case 5.2: Insufficient for Fee
**Objective**: Test when balance covers document but not fee

**Steps**:
1. Have minimal balance (< 1000 credits)
2. Attempt large document creation

**Expected Behavior**:
- Transaction creation succeeds
- Popup shows estimated fee
- Signing fails with "Insufficient balance for fee"
- Shows exact shortfall amount

## 6. Popup Blocked Scenarios

### Test Case 6.1: Browser Popup Blocker
**Objective**: Handle browser blocking extension popup

**Steps**:
1. Enable strict popup blocking in browser
2. Attempt transaction signing
3. Observe application response

**Expected Behavior**:
- Detect popup was blocked
- Show clear message: "Please allow popups for this site"
- Provide browser-specific instructions
- Retry works after allowing popups

**Verification**:
```javascript
// Popup blocking detection
window.addEventListener('error', (e) => {
  if (e.message.includes('popup')) {
    console.log('Popup blocked by browser');
  }
});
```

### Test Case 6.2: Extension Update/Restart
**Objective**: Handle extension being updated/restarted

**Steps**:
1. Start transaction
2. Update/disable/enable extension
3. Observe behavior

**Expected Behavior**:
- Graceful error handling
- "Extension disconnected" message
- Automatic re-detection after restart
- Can retry transaction after reconnection

## 7. Advanced Test Scenarios

### Test Case 7.1: Network Switching During Transaction
**Objective**: Test network change while transaction pending

**Steps**:
1. Start transaction on testnet
2. Switch to mainnet before approval
3. Complete approval

**Expected Behavior**:
- Transaction uses original network
- Or: Transaction cancelled with network mismatch error
- Clear indication of which network was used

### Test Case 7.2: Identity Switching
**Objective**: Test identity change during session

**Steps**:
1. Load app with Identity A
2. Switch to Identity B in extension
3. Attempt publishing

**Expected Behavior**:
- Detect identity change
- Update UI to show new identity
- Use correct identity for signing
- Handle nonce for new identity

### Test Case 7.3: Concurrent Operations
**Objective**: Test multiple simultaneous operations

**Steps**:
1. Open 3+ tabs
2. Publish from all tabs simultaneously
3. Approve all popups

**Expected Behavior**:
- Each popup queued properly
- Nonces handled correctly
- All transactions eventually succeed
- Proper retry logic for conflicts

## Test Execution Framework

### Automated Test Runner
```javascript
// Example automated test structure
class ExtensionTestRunner {
  async runTestSuite() {
    const results = [];
    
    // Test 1: Normal flow
    results.push(await this.testNormalPublish());
    
    // Test 2: Nonce conflicts
    results.push(await this.testNonceConflicts());
    
    // Test 3: Error scenarios
    results.push(await this.testErrorScenarios());
    
    return this.generateReport(results);
  }
  
  async testNormalPublish() {
    try {
      const txHash = await this.publishDocument('Test message');
      return { test: 'normal-publish', status: 'pass', txHash };
    } catch (error) {
      return { test: 'normal-publish', status: 'fail', error: error.message };
    }
  }
}
```

### Manual Test Checklist
- [ ] Extension detection works
- [ ] Publishing succeeds with approval
- [ ] Rejection handling works
- [ ] Nonce conflicts retry automatically
- [ ] Insufficient balance shows proper error
- [ ] Popup blocking detected and handled
- [ ] Network switching handled gracefully
- [ ] All errors show user-friendly messages

## Verification Tools

### Platform Explorer URLs
- Transaction: `https://testnet.platform-explorer.com/transaction/{txHash}`
- Identity: `https://testnet.platform-explorer.com/identity/{identityId}`
- Data Contract: `https://testnet.platform-explorer.com/dataContract/{contractId}`

### SDK Verification Commands
```javascript
// Verify document was created
const docs = await sdk.documents.query(contractId, type, [], null, 1);

// Check identity balance
const balance = await sdk.identities.getBalance(identityId);

// Verify nonce incremented
const nonce = await sdk.identities.getIdentityContractNonce(identityId, contractId);
```

### Browser Console Commands
```javascript
// Check extension status
console.log('Extension available:', !!window.dashPlatformSDK);

// Monitor for errors
window.addEventListener('error', console.error);
window.addEventListener('unhandledrejection', console.error);

// Enable debug logging
localStorage.setItem('debug', 'dash:*');
```

## Known Issues to Test

1. **ALREADY_EXISTS in mempool**: Test proper error handling, not false success
2. **Identity detection limitation**: Verify hardcoded identity workaround
3. **Buffer polyfill**: Test SDK works in browser without Node.js Buffer
4. **Extension conflicts**: Test with Keplr/MetaMask installed
5. **Transport errors**: Verify non-critical errors don't break flow

## Success Criteria

A test is considered successful when:
1. Expected behavior matches actual behavior
2. Error messages are clear and actionable
3. User can recover from errors without reload
4. No console errors except expected ones
5. Transaction appears on Platform Explorer
6. Document persists in application state