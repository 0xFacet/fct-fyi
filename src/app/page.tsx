'use client'

import { useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI } from '@/constants/fct'
import { useCurrentBlock } from '@/hooks/useCurrentBlock'
import { useExternalData } from '@/hooks/useExternalData'
import { Header } from '@/components/Header'
import { SupplyOverview } from '@/components/SupplyOverview'
import { RateAdjustmentForecast } from '@/components/RateAdjustmentForecast'
import { CurrentPeriodHeader } from '@/components/CurrentPeriodHeader'
import { PeriodHistoryCards } from '@/components/PeriodHistoryCards'
import { CollapsibleSection } from '@/components/CollapsibleSection'
import { Zap, History, Gem } from 'lucide-react'
import { getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'
import { weiToFct, formatFct } from '@/utils/format'

export default function Home() {
  // Fetch current block with 30 second refresh
  const { currentBlock, isLoading: blockLoading } = useCurrentBlock(
    30 * 1000
  )

  // Fetch FCT data
  const { data: fctDetails, isLoading: fctLoading, error, refetch } = useReadContract({
    address: L1_BLOCK_ADDRESS,
    abi: FCT_DETAILS_ABI,
    functionName: 'fctDetails',
  })

  // Fetch external data (ETH price)
  const { ethPrice } = useExternalData()

  // Auto-refresh FCT data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [refetch])

  // Manual refresh
  const handleManualRefresh = async () => {
    await refetch()
  }

  const isLoading = blockLoading || fctLoading

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Header
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
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header
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
            {/* Collapsible Sections */}
            <div className="space-y-2">
              {/* Current Period */}
              <CollapsibleSection 
                title="Current Period" 
                icon={<Zap className="w-5 h-5" />} 
                defaultOpen={true}
                description={fctDetails ? 
                  `Facet Compute Token (FCT) minting periods end when either 500 blocks elapse OR the target issuance (${formatFct(getCurrentTarget(fctDetails.initialTargetPerPeriod, getHalvingLevel(fctDetails.totalMinted, fctDetails.maxSupply)), { compactView: true })}) is reached - whichever happens first. The mint rate then adjusts based on actual vs. target performance, increasing up to 4× if under-target or decreasing to 0.25× if over-target.` :
                  `Facet Compute Token (FCT) minting periods end when either 500 blocks elapse OR the target issuance is reached - whichever happens first. The mint rate then adjusts based on actual vs. target performance, increasing up to 4× if under-target or decreasing to 0.25× if over-target.`
                }
              >
                <CurrentPeriodHeader 
                  fctData={fctDetails}
                  currentBlock={currentBlock}
                  ethPrice={ethPrice}
                />
                <div className="mt-6">
                  <RateAdjustmentForecast fctData={fctDetails} currentBlock={currentBlock} />
                </div>
              </CollapsibleSection>

              {/* Recent Period History */}
              <CollapsibleSection 
                title="Recent Period History" 
                icon={<History className="w-5 h-5" />} 
                defaultOpen={true}
                description="Historical FCT issuance by period. Rate adjustments depend on how each period ended."
              >
                <PeriodHistoryCards 
                  currentBlock={currentBlock}
                  fctData={fctDetails}
                />
              </CollapsibleSection>

              {/* Total Supply & Halvings */}
              <CollapsibleSection 
                title="Total Supply & Halvings" 
                icon={<Gem className="w-5 h-5" />} 
                defaultOpen={true}
                description={fctDetails ?
                  `FCT has a maximum supply of ${(weiToFct(fctDetails.maxSupply) / 1e9).toFixed(2)}B tokens. Supply follows Bitcoin-style halvings where issuance targets reduce by 50% at specific thresholds, ensuring predictable and decreasing inflation over time.` :
                  `FCT has a deterministic maximum supply cap. Supply follows Bitcoin-style halvings where issuance targets reduce by 50% at specific thresholds, ensuring predictable and decreasing inflation over time.`
                }
              >
                <SupplyOverview fctData={fctDetails} currentBlock={currentBlock} />
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