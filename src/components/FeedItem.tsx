import React from 'react'
import type { DashDocument } from '../types'
import { formatTimestamp } from '../lib/utils'

interface FeedItemProps {
  document: DashDocument
  index: number
  isNew?: boolean
}

export const FeedItem: React.FC<FeedItemProps> = ({ document, index, isNew = false }) => {
  const truncateId = (id: string) => {
    return `${id.slice(0, 6)}...${id.slice(-4)}`
  }

  return (
    <div
      className={`group relative w-full max-w-[640px] sm:max-w-[480px] max-[640px]:max-w-[90vw] transition-all duration-500 ${
        isNew 
          ? 'animate-slide-down-new opacity-0' 
          : 'animate-slide-up'
      }`}
      style={{ 
        animationDelay: isNew ? '0ms' : `${index * 100}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Card glow effect on hover and new item highlight */}
      <div className={`absolute -inset-4 rounded-3xl blur-3xl transition duration-500 ${
        isNew 
          ? 'bg-gradient-to-r from-green-400 to-blue-400 opacity-30 animate-pulse' 
          : 'bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20'
      }`} />
      
      {/* Main card */}
      <div className="relative rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 floating-shadow hover:shadow-2xl">
        <div className={`glass rounded-2xl p-6 sm:p-8 ${
          isNew ? 'ring-2 ring-green-400/50 dark:ring-green-500/50' : ''
        }`}>
          {/* Header - User and Time on same line */}
          <div className="flex items-center gap-2 text-sm mb-4 text-gray-600 dark:text-gray-400">
            <span className="font-mono font-medium text-xs sm:text-sm">{truncateId(document.$ownerId)}</span>
            <span>•</span>
            <time className="text-xs sm:text-sm">{formatTimestamp(document.$createdAt || Date.now())}</time>
          </div>
          
          {/* Message content */}
          <div>
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-sm sm:text-base">
              {document.message || 'No message content'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}