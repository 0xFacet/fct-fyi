'use client'

import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI, ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'
import { useCurrentBlock } from '@/hooks/useCurrentBlock'
import { useExternalData } from '@/hooks/useExternalData'
import { getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'
import { Header } from '@/components/Header'
import { SupplyOverview } from '@/components/SupplyOverview'
import { RateAdjustmentForecast } from '@/components/RateAdjustmentForecast'
import { CurrentPeriodHeader } from '@/components/CurrentPeriodHeader'
import { HistoricalChart } from '@/components/HistoricalChart'
import { CollapsibleSection } from '@/components/CollapsibleSection'
import { Clock, ChartBar, Info, BarChart3 } from 'lucide-react'

export default function Home() {
  const [autoRefresh, setAutoRefresh] = useState(10)

  // Fetch current block
  const { currentBlock, isLoading: blockLoading } = useCurrentBlock(
    autoRefresh > 0 ? autoRefresh * 1000 : undefined
  )

  // Fetch FCT data
  const { data: fctDetails, isLoading: fctLoading, error, refetch } = useReadContract({
    address: L1_BLOCK_ADDRESS,
    abi: FCT_DETAILS_ABI,
    functionName: 'fctDetails',
  })

  // Fetch external data (ETH price)
  const { ethPrice } = useExternalData()

  // Auto-refresh FCT data
  useEffect(() => {
    if (autoRefresh === 0) return

    const interval = setInterval(() => {
      refetch()
    }, autoRefresh * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refetch])

  // Manual refresh
  const handleManualRefresh = async () => {
    await refetch()
  }

  const isLoading = blockLoading || fctLoading

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          currentBlock={0n}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onManualRefresh={handleManualRefresh}
        />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
              Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-facet-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        currentBlock={currentBlock}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onManualRefresh={handleManualRefresh}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-facet-blue mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading FCT data...</p>
            </div>
          </div>
        ) : fctDetails ? (
          <div className="space-y-6">
            {/* Current Period Header - Always visible */}
            <CurrentPeriodHeader 
              fctData={fctDetails}
              currentBlock={currentBlock}
              ethPrice={ethPrice}
            />

            {/* Collapsible Sections */}
            <div className="space-y-2">
              {/* Forecasted Issuance */}
              <CollapsibleSection title="Forecasted FCT Issuance" icon={<ChartBar />} defaultOpen={true}>
                <RateAdjustmentForecast fctData={fctDetails} currentBlock={currentBlock} />
              </CollapsibleSection>

              {/* Historical Chart */}
              <CollapsibleSection title="Past FCT Issuance" icon={<BarChart3 />} defaultOpen={true}>
                <HistoricalChart 
                  currentBlock={currentBlock}
                  fctData={fctDetails}
                  currentPeriod={currentBlock / BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) + 1n}
                  currentIssued={fctDetails.periodMinted}
                  currentTarget={getCurrentTarget(fctDetails.initialTargetPerPeriod, getHalvingLevel(fctDetails.totalMinted, fctDetails.maxSupply))}
                />
              </CollapsibleSection>

              {/* Supply Information */}
              <CollapsibleSection title="Total Supply Information" icon={<Clock />} defaultOpen={false}>
                <SupplyOverview fctData={fctDetails} />
              </CollapsibleSection>

              {/* Additional Information */}
              <CollapsibleSection title="Additional Information" icon={<Info />} defaultOpen={false}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Issuance Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                    Issuance Metrics
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Issuance Pace</span>
                      <span className="text-gray-800 dark:text-gray-200">-2.3% (slightly behind)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time to Max Supply</span>
                      <span className="text-gray-800 dark:text-gray-200">~5.2 years</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                    Quick Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Network</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'Mainnet' : 'Sepolia'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Contract</span>
                      <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                        {L1_BLOCK_ADDRESS.slice(0, 6)}...{L1_BLOCK_ADDRESS.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Developer Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                    Developer Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <a
                      href={`https://explorer.facet.org/address/${L1_BLOCK_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-facet-blue hover:underline"
                    >
                      View Contract ↗
                    </a>
                    <p className="text-gray-600 dark:text-gray-400">
                      Method: fctDetails()
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No FCT data available</p>
          </div>
        )}
      </main>
    </div>
  )
}