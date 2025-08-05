import { useState, useEffect } from 'react'
import { formatBlockNumber } from '@/utils/format'
import { RefreshCw } from 'lucide-react'

interface HeaderProps {
  currentBlock: bigint
  autoRefresh: number
  onAutoRefreshChange: (seconds: number) => void
  onManualRefresh: () => void
}

const AUTO_REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
]

export function Header({ currentBlock, autoRefresh, onAutoRefreshChange, onManualRefresh }: HeaderProps) {
  const [countdown, setCountdown] = useState(autoRefresh)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'Mainnet' : 'Sepolia'

  useEffect(() => {
    if (autoRefresh === 0) {
      setCountdown(0)
      return
    }

    setCountdown(autoRefresh)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return autoRefresh
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await onManualRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-facet-blue">F</span>
            <span className="text-gray-600 dark:text-gray-400">ore</span>
            <span className="text-facet-blue">C</span>
            <span className="text-gray-600 dark:text-gray-400">as</span>
            <span className="text-facet-blue">T</span>
          </h1>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${network === 'Mainnet' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{network}</span>
            </div>

            {/* Block Number */}
            {currentBlock > 0n && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Block: <span className="font-mono font-medium">{formatBlockNumber(currentBlock)}</span>
              </div>
            )}

            {/* Auto Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                disabled={isRefreshing}
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              <select
                value={autoRefresh}
                onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-facet-blue"
              >
                {AUTO_REFRESH_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {autoRefresh > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 min-w-[20px]">
                  {countdown}s
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}