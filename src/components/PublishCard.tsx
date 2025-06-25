import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface PublishCardProps {
  onPublish: (message: string) => Promise<string>
}

export const PublishCard: React.FC<PublishCardProps> = ({ onPublish }) => {
  const [message, setMessage] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)

  const maxLength = 280
  const remainingChars = maxLength - message.length
  const isOverLimit = remainingChars < 0
  const isEmpty = message.trim().length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEmpty || isOverLimit || isPublishing) return

    setIsPublishing(true)
    setError(null)

    try {
      const txHash = await onPublish(message.trim())
      setMessage('')
      setLastTxHash(txHash)
      setShowSuccess(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setLastTxHash(null)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish message')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="group relative animate-slide-up w-full max-w-[640px] sm:max-w-[480px] max-[640px]:max-w-[90vw]">
      {/* Card glow effect on focus */}
      <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-3xl blur-3xl opacity-0 group-focus-within:opacity-20 transition duration-500" />
      
      {/* Main card */}
      <div className="relative rounded-2xl transition-all duration-300 floating-shadow">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Textarea */}
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's happening on Dash Platform?"
                rows={3}
                className="w-full resize-none bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base leading-relaxed"
                disabled={isPublishing}
              />
            </div>

            {/* Character counter and publish button */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className={remainingChars < 20 ? (isOverLimit ? 'text-red-500' : 'text-amber-500') : ''}>
                  {remainingChars}
                </span>
                <span className="ml-1">characters remaining</span>
              </div>

              <button
                type="submit"
                disabled={isEmpty || isOverLimit || isPublishing}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full button-gradient text-white font-medium text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publish
                  </>
                )}
              </button>
            </div>

            {/* Error message with retry option */}
            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="whitespace-pre-line">{error}</div>
                {/* Show retry button for certain types of errors */}
                {(error.includes('timeout') || error.includes('network') || error.includes('signing')) && (
                  <button
                    onClick={handleSubmit}
                    disabled={isPublishing}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-md bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-xs font-medium"
                  >
                    🔄 Try Again
                  </button>
                )}
                {/* Show extension setup hint for setup-related errors */}
                {(error.includes('wallet') || error.includes('identity') || error.includes('password')) && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    💡 Click the extension icon in your browser toolbar to set up your wallet
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {showSuccess && (
              <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800 animate-fade-in">
                <div className="font-medium">Message published successfully! 🎉</div>
                {lastTxHash && (
                  <div className="text-xs mt-1 font-mono break-all">
                    TX: {lastTxHash}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}