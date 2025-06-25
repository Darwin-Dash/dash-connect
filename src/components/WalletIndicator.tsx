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
  const getStatusConfig = () => {
    switch (status) {
      case 'not-available':
        return {
          color: 'bg-red-500',
          text: 'Extension Required',
          icon: X,
          description: 'Install Dash Platform Extension to publish messages'
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
    <div className="relative">
      {/* Status Indicator Button */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 cursor-default">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.text}
        </span>
      </div>
    </div>
  )
}