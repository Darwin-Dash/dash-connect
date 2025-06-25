import React from 'react'
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-xl opacity-20" />
      
      {/* Main card */}
      <div className="relative glass rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Oops! Something went wrong
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {message}
            </p>
            
            {/* Actions */}
            {onRetry && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl button-gradient text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <RefreshCw className="h-5 w-5" />
                  Try Again
                </button>
              </div>
            )}
            
            {/* Help text */}
            <div className="mt-8 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This might be a temporary network issue. Please check your connection and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-600" />
      </div>
    </div>
  )
}