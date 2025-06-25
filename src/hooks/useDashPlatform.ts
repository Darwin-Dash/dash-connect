import { useEffect, useState } from 'react'
import { dashService } from '../lib/dash-service'
import type { WalletStatus } from '../components/WalletIndicator'

export const useDashPlatform = () => {
  const [canPublish, setCanPublish] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('not-available')
  const [walletAddress, setWalletAddress] = useState<string | undefined>()

  useEffect(() => {
    const checkExtension = async (isInitial = false) => {
      if (isInitial) {
        setIsChecking(true)
      }
      
      // Give the extension time to inject the SDK
      setTimeout(async () => {
        dashService.reinitializeExtension()
        const publishAvailable = dashService.canPublish()
        
        // Get simplified extension status
        const extensionStatus = await dashService.getExtensionStatus()
        
        setCanPublish(publishAvailable)
        
        // Map extension status to wallet status for UI compatibility
        if (extensionStatus.status === 'not-available') {
          setWalletStatus('not-available')
        } else {
          // Extension is available - show as ready (wallet check happens during publishing)
          setWalletStatus('not-connected') // Will show as "Extension Ready"
        }
        
        setWalletAddress(undefined) // Don't show address since we can't reliably detect it
        
        if (isInitial) {
          setIsChecking(false)
        }
        
        if (publishAvailable) {
          console.log('✅ Extension available - publishing enabled')
        } else if (isInitial) {
          console.log('ℹ️ Extension not available - read-only mode')
        }
      }, 100)
    }

    // Initial check with loading state
    checkExtension(true)
    
    // Check periodically if extension becomes available (silent checks)
    const interval = setInterval(() => {
      if (!canPublish) {
        checkExtension(false) // Silent check, no loading state
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [canPublish])

  return {
    // Reading always works (standalone SDK)
    canRead: true,
    // Publishing requires extension
    canPublish,
    // Wallet status information
    walletStatus,
    walletAddress,
    // Legacy compatibility (reading always works = always "connected" for viewing)
    isConnected: true,
    // Legacy compatibility (never mock mode)
    isMockMode: false,
    isChecking
  }
}