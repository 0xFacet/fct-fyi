import { FctDetails } from '@/utils/fct-calculations'
import { formatFct, formatRate } from '@/utils/format'
import { useHistoricalPeriods } from '@/hooks/useHistoricalPeriods'
import { ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'

interface PeriodHistoryCardsProps {
  currentBlock: bigint
  fctData: FctDetails
}

// Uniform card type for all periods
interface PeriodCard {
  periodNumber: number
  minted: bigint
  rate: bigint
  reason: 'over' | 'under' | 'current' | 'multiple'
  active: boolean
  intraBlockPeriods?: boolean
  totalMintedInBlock?: bigint
  rateChangePct?: number
  totalSupply?: bigint
  hiddenMint?: bigint
  severity?: 'moderate' | 'severe' // For intra-block card styling
  endBlock?: bigint // Block where this period ended
  estimatedPeriods?: number // Estimated number of periods for intra-block
  target?: bigint // Target for the period
}

export function PeriodHistoryCards({ currentBlock, fctData }: PeriodHistoryCardsProps) {
  const currentPeriod = currentBlock / BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) + 1n
  
  // Fetch actual historical data (9 historical + 1 current = 10 total)
  const { data: historicalPeriods, isLoading } = useHistoricalPeriods(currentBlock, fctData, 9)
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Convert to uniform card format, inserting intra-block indicators where needed
  const cardsWithIntraBlock: PeriodCard[] = []
  
  const historicalCards = (historicalPeriods || []).map((p, i) => {
    // Rate change % should appear on the NEXT period (where new rate is active)
    // Get the rate change from the PREVIOUS period if available
    const prevPeriod = i > 0 && historicalPeriods ? historicalPeriods[i - 1] : null
    const rateChangePct = prevPeriod ? prevPeriod.rateChangePct : undefined
    
    return {
      periodNumber: p.periodNumber,
      minted: p.minted,
      rate: p.oldRate, // Use the rate that was ACTIVE DURING this period
      reason: p.reason,
      active: false,
      intraBlockPeriods: p.intraBlockPeriods,
      totalMintedInBlock: p.totalMintedInBlock,
      rateChangePct, // This is now the rate change FROM the previous period
      totalSupply: p.totalSupply,
      hiddenMint: p.hiddenMint, // Already calculated in hook
      endBlock: p.periodEnd, // Store the end block for display
      target: p.target // Store the target for this period
    }
  })
  
  // Create cards array with intra-block indicators
  historicalCards.forEach(card => {
    cardsWithIntraBlock.push(card)
    
    // If hidden minting detected, insert an intra-block indicator
    if (card.hiddenMint && card.hiddenMint > 0n) {
      // Estimate number of periods based on hidden mint amount and actual period target
      // Use the target from the card, or fallback to a reasonable estimate
      const targetPerPeriod = card.target && card.target > 0n ? card.target : 78200n * 10n**18n
      const estimatedPeriods = targetPerPeriod > 0n ? 
        Number(card.hiddenMint * 1000n / targetPerPeriod) / 1000 : 1
      
      // Determine severity based on amount
      const severity = card.hiddenMint > (card.minted * 4n) ? 'severe' : 'moderate'
      
      cardsWithIntraBlock.push({
        periodNumber: -1, // Special marker for intra-block
        minted: card.hiddenMint,
        rate: 0n,
        reason: 'multiple' as const,
        active: false,
        intraBlockPeriods: true,
        severity, // For styling purposes
        endBlock: card.endBlock, // Intra-block happens at same block as previous period ended
        estimatedPeriods: Math.round(estimatedPeriods * 10) / 10 // Keep one decimal place
      })
    }
  })
  
  // Add current period with rate change from last historical period
  const lastHistoricalPeriod = historicalPeriods && historicalPeriods.length > 0 
    ? historicalPeriods[historicalPeriods.length - 1] 
    : null
  
  cardsWithIntraBlock.push({
    periodNumber: Number(currentPeriod),
    minted: fctData.periodMinted,
    rate: fctData.mintRate,
    reason: 'current' as const,
    active: true,
    rateChangePct: lastHistoricalPeriod ? lastHistoricalPeriod.rateChangePct : undefined
  })
  
  const cards = cardsWithIntraBlock.slice(-12) // Keep last 12 to account for intra-block cards
  
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {cards.map((period, idx) => (
          <div
            key={period.periodNumber === -1 ? `intra-${idx}` : period.periodNumber}
            className={`
              relative p-3 sm:p-4 rounded-xl border transition-all duration-200
              ${period.periodNumber === -1
                ? 'bg-gray-800/40 border-gray-700/40 shadow-sm'
                : period.active 
                ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-purple-900/10 border-purple-800/20 hover:bg-purple-900/20 hover:border-purple-800/30 hover:-translate-y-0.5'
              }
            `}
          >
            {/* Block Number or Intra-block label */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              {period.periodNumber === -1 ? '⚡ Intra-Block' : 
               period.endBlock ? `Block ${period.endBlock.toLocaleString()}` : 
               'Current'}
            </div>
            
            {/* Amount Minted + Debug Info */}
            <div className="mb-1">
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                {period.periodNumber === -1 ? (
                  <div className="text-gray-300" title="Additional FCT minted in one or more periods within the same block">
                    {formatFct(period.minted, { compactView: true, decimals: 1 })}
                  </div>
                ) : (
                  formatFct(period.minted, { compactView: true, decimals: 1 })
                )}
              </div>
              
              {/* Hidden mint is shown in separate intra-block card, not here */}
            </div>
            
            {/* Mint Rate */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {period.periodNumber === -1 ? (
                <span className="text-gray-400">
                  {period.estimatedPeriods && period.estimatedPeriods < 1 ? '<1' : `~${period.estimatedPeriods || 1}`} additional period{period.estimatedPeriods !== 1 ? 's' : ''}
                </span>
              ) : (
                formatRate(period.rate)
              )}
              {period.rateChangePct !== undefined && Math.abs(period.rateChangePct) > 50 && period.periodNumber !== -1 && (
                <div className={`text-xs mt-1 ${
                  Math.abs(period.rateChangePct) > 90 ? 'text-yellow-500' : 'text-gray-500'
                }`}>
                  {period.rateChangePct > 0 ? '↑' : '↓'} {
                    period.rateChangePct > 0 
                      ? Math.abs(period.rateChangePct).toFixed(0) // Show full % for increases (can be 300%)
                      : Math.abs(period.rateChangePct) > 99 
                        ? '99' // Cap decreases at 99%
                        : Math.abs(period.rateChangePct).toFixed(0)
                  }%
                </div>
              )}
            </div>
            
            {/* Status Badge - only show for active period */}
            {period.active && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-orange-500/30 text-orange-300">
                Active
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}