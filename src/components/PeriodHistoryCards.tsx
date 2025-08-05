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
  reason: 'over' | 'under' | 'current'
  active: boolean
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
  
  // Convert to uniform card format
  const cards: PeriodCard[] = [
    ...(historicalPeriods || []).map(p => ({
      periodNumber: p.periodNumber,
      minted: p.minted,
      rate: p.oldRate, // Use the rate that was ACTIVE DURING this period
      reason: p.reason,
      active: false
    })),
    {
      periodNumber: Number(currentPeriod),
      minted: fctData.periodMinted,
      rate: fctData.mintRate,
      reason: 'current' as const,
      active: true
    }
  ].slice(-10) // Keep only the last 10 periods
  
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {cards.map((period) => (
          <div
            key={period.periodNumber}
            className={`
              relative p-3 sm:p-4 rounded-xl border transition-all duration-200
              ${period.active 
                ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-purple-900/10 border-purple-800/20 hover:bg-purple-900/20 hover:border-purple-800/30 hover:-translate-y-0.5'
              }
            `}
          >
            {/* Period Number */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Period {period.periodNumber}
            </div>
            
            {/* Amount Minted */}
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {formatFct(period.minted, { compactView: true, decimals: 1 })}
            </div>
            
            {/* Mint Rate */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {formatRate(period.rate)}
            </div>
            
            {/* Status Badge */}
            <div className={`
              inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider
              ${period.active 
                ? 'bg-orange-500/30 text-orange-300'
                : period.reason === 'over'
                ? 'bg-green-900/30 text-green-400'
                : period.reason === 'under'
                ? 'bg-gray-700/30 text-gray-400'
                : 'bg-blue-900/30 text-blue-400'
              }
            `}>
              {period.active ? 'Active' : 
               period.reason === 'over' ? 'Target' : 
               period.reason === 'under' ? 'Timeout' : 
               'Current'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}