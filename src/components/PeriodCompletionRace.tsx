import { Clock, Gem } from 'lucide-react'
import { FctDetails } from '@/utils/fct-calculations'
import { ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'
import { formatBlockNumber, formatFct } from '@/utils/format'

interface PeriodCompletionRaceProps {
  fctData: FctDetails
  currentBlock: bigint
  currentTarget: bigint
}

export function PeriodCompletionRace({ fctData, currentBlock, currentTarget }: PeriodCompletionRaceProps) {
  const { periodStartBlock, periodMinted } = fctData
  
  const blocksElapsed = currentBlock > periodStartBlock ? currentBlock - periodStartBlock : 0n
  const blocksProgress = Number(blocksElapsed) / ADJUSTMENT_PERIOD_TARGET_LENGTH * 100
  
  const fctProgress = currentTarget > 0n ? Number(periodMinted * 100n / currentTarget) : 0
  
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 sm:p-6">
      <div className="mb-4 sm:mb-5">
        <h3 className="text-sm font-semibold text-gray-100 mb-1 sm:mb-1.5 flex items-center gap-2">
          <span>🏁</span>
          Period Completion Race
        </h3>
        <p className="text-xs text-gray-500">
          First to 100% ends the period
        </p>
      </div>
      
      <div className="space-y-5">
        {/* Blocks Progress */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Blocks Elapsed
            </span>
            <span className="text-sm text-gray-300 font-medium tabular-nums">
              {formatBlockNumber(blocksElapsed)} / {ADJUSTMENT_PERIOD_TARGET_LENGTH.toLocaleString()}
            </span>
          </div>
          <div className="relative h-3 bg-gray-900/80 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(blocksProgress, 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/80 animate-pulse" />
            </div>
            <div className="absolute right-0 inset-y-0 w-0.5 bg-gray-600/50 border-r-2 border-dashed border-gray-600/30" />
          </div>
        </div>
        
        {/* FCT Progress */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
              <Gem className="w-4 h-4" />
              FCT Minted
            </span>
            <span className="text-sm text-gray-300 font-medium tabular-nums">
              {formatFct(periodMinted, { compactView: true, decimals: 1, showTiny: true }).replace(' FCT', '')} / {formatFct(currentTarget, { compactView: true, decimals: 1 }).replace(' FCT', '')}
            </span>
          </div>
          <div className="relative h-3 bg-gray-900/80 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(fctProgress, 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/80 animate-pulse" />
            </div>
            <div className="absolute right-0 inset-y-0 w-0.5 bg-gray-600/50 border-r-2 border-dashed border-gray-600/30" />
          </div>
        </div>
      </div>
    </div>
  )
}