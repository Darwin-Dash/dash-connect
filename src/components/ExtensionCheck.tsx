import React from 'react'
import { Shield, Download, ArrowRight, Info } from 'lucide-react'

interface ExtensionCheckProps {
  isMockMode: boolean
}

export const ExtensionCheck: React.FC<ExtensionCheckProps> = ({ isMockMode }) => {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20" />
      
      {/* Main card */}
      <div className="relative glass rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Content */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Dash Identity
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
            To interact with the Dash Platform, you need the browser extension that manages your 
            identities and signs transactions securely. Your private keys never leave the extension.
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://github.com/pshenmic/dash-platform-extension/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl button-gradient text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Download className="h-5 w-5" />
              Install Extension
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          
          {/* Demo mode notice */}
          {isMockMode && (
            <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-400">
                    Demo Mode Active
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300/80">
                    You're viewing sample data. Install the extension to see real Dash Platform documents 
                    and interact with the blockchain.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
      </div>
    </div>
  )
}