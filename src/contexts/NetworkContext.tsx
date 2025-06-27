import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Network } from '../components/NetworkSelector'
import { dashService } from '../lib/dash-service'

interface NetworkConfig {
  dataContractId: string
  identityId: string | null  // Can be null if no identity is available
  blockExplorerUrl: string
}

// Get configuration from environment variables
const getDataContractId = (network: Network): string => {
  const envContractId = import.meta.env.VITE_DATA_CONTRACT_ID
  if (envContractId) {
    return envContractId
  }
  throw new Error('VITE_DATA_CONTRACT_ID environment variable is required')
}

const getDefaultIdentity = (network: Network): string => {
  const envIdentityId = import.meta.env.VITE_IDENTITY_ID
  if (envIdentityId) {
    return envIdentityId
  }
  throw new Error('VITE_IDENTITY_ID environment variable is required')
}

const NETWORK_CONFIGS: Record<Network, Omit<NetworkConfig, 'identityId'>> = {
  testnet: {
    dataContractId: getDataContractId('testnet'),
    blockExplorerUrl: 'https://testnet-insight.dashevo.org'
  },
  mainnet: {
    dataContractId: getDataContractId('mainnet'),
    blockExplorerUrl: 'https://insight.dashevo.org'
  }
}

interface NetworkContextType {
  currentNetwork: Network
  networkConfig: NetworkConfig
  setNetwork: (network: Network) => void
  refreshIdentity: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

interface NetworkProviderProps {
  children: ReactNode
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState<Network>(() => {
    // Load from localStorage or default to testnet
    const saved = localStorage.getItem('dash-feed-network')
    const network = (saved as Network) || 'testnet'
    
    // Initialize dash service with the current network
    dashService.setNetwork(network)
    
    return network
  })

  const [currentIdentity, setCurrentIdentity] = useState<string | null>(null)

  // Function to fetch current identity from extension
  const refreshIdentity = async () => {
    try {
      const identity = await dashService.getCurrentIdentity()
      if (identity) {
        console.log('✅ Got identity from extension:', identity)
        setCurrentIdentity(identity)
      } else {
        // Fallback to default identity for the network
        console.log('⚠️ No identity from extension, using default')
        setCurrentIdentity(getDefaultIdentity(currentNetwork))
      }
    } catch (error) {
      console.error('❌ Error getting identity:', error)
      // Fallback to default identity
      setCurrentIdentity(getDefaultIdentity(currentNetwork))
    }
  }

  // Refresh identity when network changes or on mount
  useEffect(() => {
    refreshIdentity()
  }, [currentNetwork])

  // Also refresh identity periodically to catch extension changes
  useEffect(() => {
    const interval = setInterval(refreshIdentity, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [currentNetwork])

  const networkConfig: NetworkConfig = {
    ...NETWORK_CONFIGS[currentNetwork],
    identityId: currentIdentity
  }

  const setNetwork = (network: Network) => {
    setCurrentNetwork(network)
    localStorage.setItem('dash-feed-network', network)
    // Update the dash service network as well
    dashService.setNetwork(network)
  }

  const value: NetworkContextType = {
    currentNetwork,
    networkConfig,
    setNetwork,
    refreshIdentity
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}