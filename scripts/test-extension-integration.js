#!/usr/bin/env node

/**
 * Test script for debugging extension integration issues
 * This script simulates the exact flow that the app uses to create documents
 */

import { DashPlatformSDK } from 'dash-platform-sdk'

const TEST_CONFIG = {
  dataContractId: '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
  documentType: 'note',
  identityId: '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc',
  message: 'Test message from debug script'
}

async function testExtensionFlow() {
  console.log('🧪 Testing Extension Integration Flow\n')
  
  // Step 1: Check if extension is available
  console.log('1️⃣ Checking for extension...')
  if (typeof window === 'undefined' || !window.dashPlatformSDK) {
    console.error('❌ Extension not found. Make sure the Dash Platform Extension is installed.')
    return
  }
  console.log('✅ Extension found\n')
  
  const extensionSDK = window.dashPlatformSDK
  
  // Step 2: Check extension APIs
  console.log('2️⃣ Checking extension APIs...')
  const apis = {
    documents: !!extensionSDK.documents,
    identities: !!extensionSDK.identities,
    stateTransitions: !!extensionSDK.stateTransitions,
    signer: !!extensionSDK.signer,
    signStateTransition: typeof extensionSDK.signer?.signStateTransition === 'function'
  }
  console.log('Extension APIs:', apis)
  
  if (!apis.signStateTransition) {
    console.error('❌ signStateTransition method not found')
    return
  }
  console.log('✅ All required APIs available\n')
  
  // Step 3: Get identity balance
  console.log('3️⃣ Checking identity balance...')
  try {
    const balance = await extensionSDK.identities.getBalance(TEST_CONFIG.identityId)
    console.log(`✅ Balance: ${balance} credits\n`)
    
    if (balance < 1000000) {
      console.warn('⚠️ Low balance detected')
    }
  } catch (error) {
    console.error('❌ Failed to get balance:', error)
    return
  }
  
  // Step 4: Get identity nonce
  console.log('4️⃣ Getting identity nonce...')
  let nonce
  try {
    nonce = await extensionSDK.identities.getIdentityContractNonce(
      TEST_CONFIG.identityId,
      TEST_CONFIG.dataContractId
    )
    console.log(`✅ Current nonce: ${nonce}\n`)
  } catch (error) {
    console.error('❌ Failed to get nonce:', error)
    return
  }
  
  // Step 5: Create document
  console.log('5️⃣ Creating document...')
  let document
  try {
    document = await extensionSDK.documents.create(
      TEST_CONFIG.dataContractId,
      TEST_CONFIG.documentType,
      { message: TEST_CONFIG.message },
      TEST_CONFIG.identityId,
      nonce + 1n
    )
    console.log('✅ Document created\n')
  } catch (error) {
    console.error('❌ Failed to create document:', error)
    return
  }
  
  // Step 6: Create state transition
  console.log('6️⃣ Creating state transition...')
  let stateTransition
  try {
    stateTransition = await extensionSDK.stateTransitions.documentsBatch.create(
      document,
      nonce + 1n
    )
    console.log('✅ State transition created')
    
    // Log state transition details
    console.log('State transition details:', {
      type: stateTransition.constructor?.name,
      hasToJSON: typeof stateTransition.toJSON === 'function',
      hasSign: typeof stateTransition.sign === 'function',
      hash: stateTransition.hash(true)
    })
    
    if (typeof stateTransition.toJSON === 'function') {
      const stJson = stateTransition.toJSON()
      console.log('State transition structure:', {
        type: stJson.type,
        hasSignature: !!stJson.signature,
        transitions: stJson.transitions?.length
      })
    }
    console.log('')
  } catch (error) {
    console.error('❌ Failed to create state transition:', error)
    return
  }
  
  // Step 7: Sign and broadcast
  console.log('7️⃣ Signing state transition...')
  console.log('⏳ Please approve the transaction in the extension popup...\n')
  
  try {
    await extensionSDK.signer.signStateTransition(stateTransition)
    console.log('✅ Transaction signed and broadcasted!')
    
    // Check if signature was added
    if (typeof stateTransition.toJSON === 'function') {
      const stJsonAfter = stateTransition.toJSON()
      console.log('After signing:', {
        hasSignature: !!stJsonAfter.signature,
        signatureLength: stJsonAfter.signature?.length
      })
    }
    
    console.log(`\n🎉 Success! Transaction hash: ${stateTransition.hash(true)}`)
  } catch (error) {
    console.error('❌ Signing failed:', error)
    
    // Analyze the error
    if (error.message?.includes('Signature is missing')) {
      console.error('\n⚠️ The "Signature is missing" error suggests:')
      console.error('1. The extension did not properly sign the state transition')
      console.error('2. There might be a version mismatch between the app and extension')
      console.error('3. The state transition object format might be incompatible')
    }
  }
}

// Run the test
testExtensionFlow().catch(console.error)