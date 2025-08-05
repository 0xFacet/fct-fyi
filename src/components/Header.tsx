import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'

interface HeaderProps {
  onManualRefresh: () => void
}


export function Header({ onManualRefresh }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      onManualRefresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [onManualRefresh])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    onManualRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <header className="bg-gradient-to-b from-[#1e1f2a] to-[#1e1f2a]/95 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-violet-500 to-blue-400 bg-clip-text text-transparent">FCT</span>
            <span className="text-gray-500 font-normal">.fyi</span>
          </h1>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* What is FCT Link */}
            <a
              href="https://docs.facet.org/native-gas-token/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-gray-400 hover:bg-white/[0.05] hover:border-white/[0.1] hover:text-white transition-all text-sm font-medium"
              aria-label="What is FCT?"
            >
              <span>What is FCT?</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className={`w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-gray-400 hover:bg-white/[0.05] hover:border-white/[0.1] hover:rotate-180 transition-all duration-300 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              disabled={isRefreshing}
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}