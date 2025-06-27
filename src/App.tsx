import { useDashPlatform } from './hooks/useDashPlatform'
import { FeedList } from './components/FeedList'
import { NetworkSelector } from './components/NetworkSelector'
import { WalletIndicator } from './components/WalletIndicator'
import { ConsoleLogButton } from './components/ConsoleLogButton'
import { PendingTransactions } from './components/PendingTransactions'
import { useNetwork } from './contexts/NetworkContext'
import { Loader2 } from 'lucide-react'

const DOCUMENT_TYPE = 'note'

function App() {
  const { canPublish, isChecking, walletStatus, walletAddress } = useDashPlatform()
  const { currentNetwork, networkConfig, setNetwork, refreshIdentity } = useNetwork()

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 animate-gradient" />
        
        {/* Loading content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse-slow" />
            <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Initializing Dash Platform...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950" />
      
      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" />
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1" />
              <div className="text-center flex-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
                  <span className="gradient-text">Dash Connect</span>
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="flex flex-col gap-3">
                  <NetworkSelector 
                    currentNetwork={currentNetwork}
                    onNetworkChange={setNetwork}
                  />
                  <WalletIndicator 
                    status={walletStatus}
                    walletAddress={walletAddress}
                  />
                  <ConsoleLogButton />
                </div>
              </div>
            </div>
            
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-center">
              Connect with the Dash community in a truly decentralized way
            </p>
          </header>

          {/* Main content */}
          <main>
            <div className="animate-slide-up space-y-4">
              {/* Pending transactions */}
              <div className="flex justify-center">
                <PendingTransactions />
              </div>
              
              {/* Feed */}
              <FeedList 
                dataContractId={networkConfig.dataContractId}
                documentType={DOCUMENT_TYPE}
                canPublish={canPublish}
                networkConfig={networkConfig}
                refreshIdentity={refreshIdentity}
              />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-24 pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-start">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    currentNetwork === 'testnet' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Connected to {currentNetwork === 'testnet' ? 'Testnet' : 'Mainnet'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Powered by Dash Platform</p>
                <img src="/icon_dash_evo_white.ico" alt="Dash" style={{ width: '32px', height: '32px' }} />
              </div>
              <div className="flex-1" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App