import { FctDetails, predictRateAdjustment } from '@/utils/fct-calculations'
import { formatRate, formatPercentage } from '@/utils/format'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RateAdjustmentForecastProps {
  fctData: FctDetails
  currentBlock: bigint
}

export function RateAdjustmentForecast({ fctData, currentBlock }: RateAdjustmentForecastProps) {
  // Get rate adjustment prediction
  const prediction = predictRateAdjustment(fctData, currentBlock)
  
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'over-issuance':
        return 'Projected over-issuance'
      case 'under-issuance':
        return 'Projected under-issuance'
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Next Period Rate (Projected)
            </p>
            <div className="flex items-center gap-3">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatRate(prediction.newRate)}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getReasonText(prediction.reason)}
            </p>
          </div>
          
          {prediction.changePercent !== 0 && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              prediction.changePercent > 0 
                ? 'bg-green-900/30 border border-green-700/50' 
                : 'bg-red-900/30 border border-red-700/50'
            }`}>
              {prediction.changePercent > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={`text-lg font-semibold ${
                prediction.changePercent > 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {formatPercentage(prediction.changePercent)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}