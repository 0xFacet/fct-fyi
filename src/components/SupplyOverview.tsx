import { FctDetails, getHalvingLevel, getBlocksUntilNextHalving } from '@/utils/fct-calculations'
import { formatFct, formatBlockNumber, formatDuration } from '@/utils/format'
import { BLOCKS_PER_SECOND } from '@/constants/fct'

interface SupplyOverviewProps {
  fctData: FctDetails
}

export function SupplyOverview({ fctData }: SupplyOverviewProps) {
  const { totalMinted, maxSupply } = fctData
  const progress = (Number(totalMinted) / Number(maxSupply)) * 100
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const blocksUntilNextHalving = getBlocksUntilNextHalving(totalMinted, maxSupply)
  const timeUntilNextHalving = Number(blocksUntilNextHalving) / BLOCKS_PER_SECOND

  const getHalvingDisplay = () => {
    if (halvingLevel === Infinity) return 'Max Supply Reached'
    if (halvingLevel === 0) return 'Pre-1st Halving'
    return `Post-Halving #${halvingLevel}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Supply Overview
      </h2>
      
      <div className="space-y-4">
        {/* Total Supply */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Total Minted</span>
            <span>{formatFct(totalMinted)} / {formatFct(maxSupply)}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-facet-blue h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            {progress.toFixed(2)}%
          </div>
        </div>

        {/* Halving Info */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getHalvingDisplay()}
              </p>
              {halvingLevel < 6 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Halving {halvingLevel + 1} of 6
                </p>
              )}
            </div>
            
            {blocksUntilNextHalving > 0n && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next in {formatBlockNumber(blocksUntilNextHalving)} blocks
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ~{formatDuration(timeUntilNextHalving)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Supply Thresholds */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Halving Thresholds:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[50, 75, 87.5, 93.75, 96.875, 98.4375].map((threshold, i) => {
              const thresholdSupply = (BigInt(Math.round(threshold * 100)) * maxSupply) / 10000n
              const isPassed = totalMinted >= thresholdSupply
              
              return (
                <div 
                  key={i}
                  className={`text-center p-1 rounded ${
                    isPassed 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {threshold}%
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}