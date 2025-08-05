import React from 'react'
import { formatBlockNumber, weiToFct, compact } from '@/utils/format'
import { useHistoricalPeriods } from '@/hooks/useHistoricalPeriods'
import { FctDetails } from '@/utils/fct-calculations'
import { 
  prepareChartData
} from '@/utils/historical-helpers'

interface HistoricalChartProps {
  currentBlock: bigint
  fctData: FctDetails | undefined
  currentPeriod: bigint
  currentIssued: bigint
  currentTarget: bigint
}

export function HistoricalChart({ 
  currentBlock,
  fctData,
  currentPeriod, 
  currentIssued, 
  currentTarget 
}: HistoricalChartProps) {
  const { data: historicalPeriods } = useHistoricalPeriods(
    currentBlock, 
    fctData,
    9 // Fetch last 9 periods
  )
  
  // Combine historical data with current period
  const allData = React.useMemo(() => {
    const historical = prepareChartData(historicalPeriods)
    
    // Add current period (in progress)
    const currentData = {
      periodNumber: Number(currentPeriod),
      startBlock: undefined as bigint | undefined,
      endBlock: undefined as bigint | undefined,
      minted: currentIssued,
      target: currentTarget,
      mintedPercent: currentTarget > 0n ? Number((currentIssued * 100n) / currentTarget) : 0,
      rate: fctData ? fctData.mintRate : 0n,
      rateChangePct: 0, // N/A for current period
      reason: 'current' as const,
      blocksLasted: 0,
      endReasonText: 'In Progress',
      durationText: 'Ongoing',
    }
    
    return [...historical, currentData]
  }, [historicalPeriods, currentPeriod, currentIssued, currentTarget, fctData])

  // Find max value for intensity scaling (convert to numbers for comparison)
  const maxValue = Math.max(...allData.map(d => Math.max(weiToFct(d.minted), weiToFct(d.target))))
  
  // Since we always add the current period, allData will never be empty
  // The chart will always show at least the current period
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Past FCT Issuance
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        The heatmap below shows FCT issuance for the most recent Adjustment Periods, including the{' '}
        <span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">current period</span> in progress, with
        lighter shades indicating lower issuance and darker purple shades indicating higher issuance.
      </p>

      {/* Grid Container */}
      <div className="space-y-4">
        {/* Grid of periods */}
        <div className="grid grid-cols-5 gap-2">
          {allData.map((data, index) => {
            const isCurrentPeriod = index === allData.length - 1
            const intensity = weiToFct(data.minted) / maxValue
            
            return (
              <div 
                key={`period-${index}`} 
                className="group relative cursor-pointer"
              >
                <div 
                  className={`
                    aspect-square rounded-lg p-4 flex flex-col items-center justify-center text-center
                    transition-all duration-200 hover:scale-105 hover:shadow-lg
                    ${isCurrentPeriod ? 'bg-yellow-400 dark:bg-yellow-600 ring-2 ring-yellow-500' : ''}
                  `}
                  style={{
                    backgroundColor: isCurrentPeriod ? undefined : `rgba(63, 25, 217, ${0.3 + intensity * 0.7})`,
                  }}
                >
                  {/* Content */}
                  <div className="text-white">
                    <div className="text-lg font-bold">
                      {compact(weiToFct(data.minted))} FCT
                    </div>
                    <div className="text-xs opacity-90 mt-1">
                      {data.startBlock ? formatBlockNumber(data.startBlock) : 'In Progress'}
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap">
                      {data.startBlock && data.endBlock ? (
                        <>
                          <div className="font-semibold mb-1">
                            Block {formatBlockNumber(data.startBlock)} → {formatBlockNumber(data.endBlock)}
                          </div>
                          <div>Minted: {compact(weiToFct(data.minted))} FCT</div>
                          <div className="text-gray-400">Target: {compact(weiToFct(data.target))} FCT</div>
                          <div className="text-gray-400">{data.durationText}</div>
                          {data.reason !== 'current' && (
                            <div className="text-xs text-gray-300 mt-1">
                              {data.endReasonText}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">Current Period</div>
                          <div>In Progress: {compact(weiToFct(data.minted))} FCT</div>
                          <div className="text-gray-400">Target: {compact(weiToFct(data.target))} FCT</div>
                        </>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
                
                {/* Period label below */}
                <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {data.startBlock ? 
                    `${formatBlockNumber(data.startBlock)}` : 
                    'Now'
                  }
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-facet-blue rounded opacity-70" />
            <span className="text-gray-600 dark:text-gray-400">Past Periods</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-600 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Current Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 border-t-2 border-dashed border-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Target Issuance</span>
          </div>
        </div>

        {/* Scale indicator */}
        <div className="mt-4 bg-gradient-to-r from-facet-blue/20 to-facet-blue rounded-full h-2" />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Lower issuance</span>
          <span>Higher issuance</span>
        </div>
      </div>
    </div>
  )
}