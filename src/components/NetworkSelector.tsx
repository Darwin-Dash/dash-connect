import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type Network = 'testnet' | 'mainnet'

interface NetworkSelectorProps {
  currentNetwork: Network
  onNetworkChange: (network: Network) => void
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ 
  currentNetwork, 
  onNetworkChange 
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const networks = [
    { 
      id: 'testnet' as Network, 
      name: 'Testnet', 
      color: 'bg-yellow-500',
      description: 'Test network for development'
    },
    { 
      id: 'mainnet' as Network, 
      name: 'Mainnet', 
      color: 'bg-red-500',
      description: 'Live production network'
    }
  ]

  const currentNetworkInfo = networks.find(n => n.id === currentNetwork)

  const handleNetworkSelect = (network: Network) => {
    onNetworkChange(network)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 hover:border-white/30 transition-all duration-200 group"
      >
        <div className={`w-2 h-2 rounded-full ${currentNetworkInfo?.color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentNetworkInfo?.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 glass rounded-2xl border border-white/20 floating-shadow z-20 overflow-hidden">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network.id)}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 ${
                  currentNetwork === network.id ? 'bg-white/5' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${network.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {network.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {network.description}
                  </div>
                </div>
                {currentNetwork === network.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}