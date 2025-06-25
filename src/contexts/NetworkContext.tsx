import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Network } from '../components/NetworkSelector'
import { dashService } from '../lib/dash-service'

interface NetworkConfig {
  dataContractId: string
  identityId: string
  blockExplorerUrl: string
}

const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  testnet: {
    dataContractId: '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3',
    identityId: '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc',
    blockExplorerUrl: 'https://testnet-insight.dashevo.org'
  },
  mainnet: {
    dataContractId: '9jf2T5mLuoEXN2r24w9Kd5MNtJUnoMoB7YtFQNRznem3', // TODO: Replace with mainnet contract
    identityId: '8eTDkBhpQjHeqgbVeriwLeZr1tCa6yBGw76SckvD1cwc', // TODO: Replace with mainnet identity
    blockExplorerUrl: 'https://insight.dashevo.org'
  }
}

interface NetworkContextType {
  currentNetwork: Network
  networkConfig: NetworkConfig
  setNetwork: (network: Network) => void
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

  const networkConfig = NETWORK_CONFIGS[currentNetwork]

  const setNetwork = (network: Network) => {
    setCurrentNetwork(network)
    localStorage.setItem('dash-feed-network', network)
    // Update the dash service network as well
    dashService.setNetwork(network)
  }

  const value: NetworkContextType = {
    currentNetwork,
    networkConfig,
    setNetwork
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