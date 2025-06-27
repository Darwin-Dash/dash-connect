import React from 'react'
import { Wallet, AlertCircle, X } from 'lucide-react'

export type WalletStatus = 'not-available' | 'not-connected' | 'connected'

interface WalletIndicatorProps {
  status: WalletStatus
  walletAddress?: string
}

export const WalletIndicator: React.FC<WalletIndicatorProps> = ({ 
  status
}) => {
  const getStatusConfig = (): {
    color: string
    text: string
    icon: typeof Wallet | typeof AlertCircle | typeof X
    description: string
    link?: string
  } => {
    switch (status) {
      case 'not-available':
        return {
          color: 'bg-red-500',
          text: 'Extension Required',
          icon: X,
          description: 'Install Dash Platform Extension to publish messages',
          link: 'https://github.com/pshenmic/dash-platform-extension'
        }
      case 'not-connected':
        return {
          color: 'bg-blue-500',
          text: 'Extension Ready',
          icon: Wallet,
          description: 'Extension detected - ready to publish (wallet setup checked during publishing)'
        }
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Extension Ready',
          icon: Wallet,
          description: 'Extension detected - ready to publish'
        }
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown Status',
          icon: AlertCircle,
          description: 'Unknown extension status'
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <div className="relative group">
      {/* Status Indicator Button */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 cursor-default">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.text}
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs">
          <div className="font-medium mb-1">{config.description}</div>
          {config.link && (
            <a 
              href={config.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Get Extension →
            </a>
          )}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
        </div>
      </div>
    </div>
  )
}