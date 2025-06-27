import React, { useEffect, useState, useCallback } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'

interface LogEntry {
  timestamp: string
  type: 'log' | 'error' | 'warn' | 'info'
  message: string
}

export const ConsoleLogButton: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Intercept console methods and store logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    const createLogInterceptor = (type: LogEntry['type'], originalMethod: Function) => {
      return (...args: any[]) => {
        // Call original method first
        originalMethod.apply(console, args)
        
        // Store the log entry
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
        
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          type,
          message
        }
        
        setLogs(prev => [...prev, logEntry])
      }
    }

    // Override console methods
    console.log = createLogInterceptor('log', originalConsole.log)
    console.error = createLogInterceptor('error', originalConsole.error)  
    console.warn = createLogInterceptor('warn', originalConsole.warn)
    console.info = createLogInterceptor('info', originalConsole.info)

    // Cleanup function to restore original console methods
    return () => {
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      console.info = originalConsole.info
    }
  }, [])

  const copyLogsToClipboard = useCallback(async () => {
    try {
      const formattedLogs = logs.map(log => 
        `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
      ).join('\n')

      if (formattedLogs.trim() === '') {
        setCopyStatus('error')
        setTimeout(() => setCopyStatus('idle'), 2000)
        return
      }

      await navigator.clipboard.writeText(formattedLogs)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }, [logs])

  const getButtonContent = () => {
    switch (copyStatus) {
      case 'success':
        return {
          icon: Check,
          text: 'Copied!',
          color: 'text-green-600 dark:text-green-400'
        }
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error',
          color: 'text-red-600 dark:text-red-400'
        }
      default:
        return {
          icon: Copy,
          text: 'Copy Logs',
          color: 'text-gray-700 dark:text-gray-300'
        }
    }
  }

  const buttonContent = getButtonContent()
  const IconComponent = buttonContent.icon

  return (
    <div className="relative group">
      {/* Copy Button */}
      <button
        onClick={copyLogsToClipboard}
        disabled={copyStatus !== 'idle'}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 hover:border-white/30 transition-all duration-200 disabled:opacity-50"
      >
        <IconComponent className={`w-3 h-3 ${buttonContent.color}`} />
        <span className={`text-sm font-medium ${buttonContent.color}`}>
          {buttonContent.text}
        </span>
        {logs.length > 0 && copyStatus === 'idle' && (
          <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {logs.length}
          </span>
        )}
      </button>
      
      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs">
          <div className="font-medium mb-1">
            Copy Console Logs ({logs.length} entries)
          </div>
          <div className="text-gray-300">
            Copies all console output to clipboard with timestamps
          </div>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
        </div>
      </div>
    </div>
  )
}