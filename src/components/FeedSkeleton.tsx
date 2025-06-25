import React from 'react'

export const FeedSkeleton: React.FC = () => {
  return (
    <>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="relative rounded-2xl animate-pulse w-full max-w-[640px] sm:max-w-[480px] max-[640px]:max-w-[90vw] floating-shadow"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="glass rounded-2xl p-6 sm:p-8">
            {/* Header skeleton */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          
          {/* Shimmer overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      ))}
    </>
  )
}