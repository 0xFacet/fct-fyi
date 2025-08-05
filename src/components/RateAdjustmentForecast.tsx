import { FctDetails, predictRateAdjustment, getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'
import { formatRate, formatPercentage, formatFct, formatDuration } from '@/utils/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'

interface RateAdjustmentForecastProps {
  fctData: FctDetails
  currentBlock: bigint
}

export function RateAdjustmentForecast({ fctData, currentBlock }: RateAdjustmentForecastProps) {
  const { periodStartBlock, periodMinted, initialTargetPerPeriod, totalMinted, maxSupply } = fctData
  
  // Calculate current period metrics
  const blocksElapsed = currentBlock > periodStartBlock ? currentBlock - periodStartBlock : 0n
  const blocksRemaining = BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) - blocksElapsed
  
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const currentTarget = getCurrentTarget(initialTargetPerPeriod, halvingLevel)
  
  // Calculate current minting rate
  const currentMintingRate = blocksElapsed > 0n ? periodMinted / blocksElapsed : 0n
  
  // Calculate blocks needed to reach target at current rate
  const remainingToTarget = currentTarget > periodMinted ? currentTarget - periodMinted : 0n
  const blocksToTarget = currentMintingRate > 0n ? remainingToTarget / currentMintingRate : BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH)
  
  // Determine which threshold will be hit first
  const projectedEndCondition = blocksToTarget < blocksRemaining ? 'target' : 'time'
  
  // Calculate when period will actually end
  const blocksUntilEnd = projectedEndCondition === 'target' ? blocksToTarget : blocksRemaining
  const timeUntilEnd = Math.max(0, Number(blocksUntilEnd) * 12) // 12 seconds per block
  
  // Calculate projected final minted amount
  const projectedFinalMinted = projectedEndCondition === 'time' 
    ? periodMinted + (currentMintingRate * blocksRemaining)
    : currentTarget
    
  // Get rate adjustment prediction
  const prediction = predictRateAdjustment(fctData, currentBlock)
  
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'over-issuance':
        return 'Over target'
      case 'under-issuance':
        return 'Under target'
      case 'projected-over':
        return 'Tracking over target'
      case 'projected-under':
        return 'Tracking under target'
      case 'supply-exhausted':
        return 'Supply exhausted'
      default:
        return reason
    }
  }

  // Determine icon based on rate change
  const RateIcon = prediction.changePercent > 0 ? TrendingUp : 
                   prediction.changePercent < 0 ? TrendingDown : 
                   Minus

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        Period Forecast
      </h2>

      <div className="space-y-6">
        {/* Main Forecast Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period End Prediction */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Period Ending
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatDuration(timeUntilEnd)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              by {projectedEndCondition === 'target' ? 'target reached' : 'time limit'}
            </p>
          </div>

          {/* Projected Minted */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Projected Total
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatFct(projectedFinalMinted)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              of {formatFct(currentTarget)} target
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Rate Adjustment Section */}
        <div className="space-y-4">
          {/* Next Period Rate */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Next Period Rate
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatRate(prediction.newRate)}
                </p>
                {prediction.changePercent !== 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-full ${
                      prediction.changePercent > 0 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <RateIcon className={`w-4 h-4 ${
                        prediction.changePercent > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <span className={`text-lg font-semibold ${
                      prediction.changePercent > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatPercentage(prediction.changePercent)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getReasonText(prediction.reason)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}