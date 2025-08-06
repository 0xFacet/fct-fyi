import { FctDetails, getHalvingLevel, getBlocksUntilNextHalving } from '@/utils/fct-calculations'
import { formatBlockNumber, weiToFct, formatFct } from '@/utils/format'
import { TARGET_NUM_BLOCKS_IN_HALVING, SECONDS_PER_BLOCK } from '@/constants/fct'
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

interface SupplyOverviewProps {
  fctData: FctDetails
  currentBlock: bigint
}

// Dynamically compute halving thresholds based on max supply
function computeHalvingThresholds(maxSupplyFct: number) {
  const thresholds = [
    { level: 0, name: 'Pre-Halving', percent: '0-50%', cumulativePercent: 0.5 },
    { level: 1, name: 'Halving #1', percent: '50-75%', cumulativePercent: 0.75 },
    { level: 2, name: 'Halving #2', percent: '75-87.5%', cumulativePercent: 0.875 },
    { level: 3, name: 'Halving #3', percent: '87.5-93.75%', cumulativePercent: 0.9375 },
    { level: 4, name: 'Halving #4', percent: '93.75-96.875%', cumulativePercent: 0.96875 },
    { level: 5, name: 'Halving #5+', percent: '96.875-100%', cumulativePercent: 1.0 },
  ]
  
  return thresholds.map((t, i) => {
    const cumulative = Math.floor(maxSupplyFct * t.cumulativePercent)
    const prevCumulative = i > 0 ? Math.floor(maxSupplyFct * thresholds[i - 1].cumulativePercent) : 0
    const periodIssuance = cumulative - prevCumulative
    
    return {
      ...t,
      periodIssuance,
      cumulative
    }
  })
}

export function SupplyOverview({ fctData, currentBlock }: SupplyOverviewProps) {
  const { totalMinted, maxSupply } = fctData
  
  // Convert to exact FCT amounts
  const totalMintedFct = weiToFct(totalMinted)
  const maxSupplyFct = weiToFct(maxSupply)
  const progress = (totalMintedFct / maxSupplyFct) * 100
  
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const blocksUntilNextHalving = getBlocksUntilNextHalving(totalMinted, maxSupply)
  
  // Compute halving thresholds dynamically based on actual max supply
  const halvingThresholds = computeHalvingThresholds(maxSupplyFct)
  
  // Calculate halving progress tracking
  // We want halvings to occur every TARGET_NUM_BLOCKS_IN_HALVING blocks
  // Compare issuance progress vs block progress
  const currentHalvingThreshold = halvingLevel === 0 ? 
    maxSupplyFct / 2 : // First halving at 50%
    halvingThresholds[Math.min(halvingLevel, halvingThresholds.length - 1)].cumulative
  
  const previousHalvingThreshold = halvingLevel === 0 ? 
    0 : 
    halvingThresholds[Math.max(0, halvingLevel - 1)].cumulative
  
  // Progress within current halving period
  const issuanceInPeriod = totalMintedFct - previousHalvingThreshold
  const issuanceTargetInPeriod = currentHalvingThreshold - previousHalvingThreshold
  const issuanceProgress = issuanceTargetInPeriod > 0 ? 
    (issuanceInPeriod / issuanceTargetInPeriod) * 100 : 0
  
  // Block progress since last halving
  // Estimate blocks elapsed based on halving level
  const blocksElapsedInPeriod = halvingLevel === 0 ? 
    Number(currentBlock) : // For pre-halving, use current block
    Number(currentBlock) % TARGET_NUM_BLOCKS_IN_HALVING // For other periods, use modulo
  
  const blockProgress = (blocksElapsedInPeriod / TARGET_NUM_BLOCKS_IN_HALVING) * 100
  
  // Tracking delta: negative means behind schedule, positive means ahead
  const trackingDelta = issuanceProgress - blockProgress
  const isOnTrack = Math.abs(trackingDelta) < 1 // Within 1% is considered on track
  const isBehind = trackingDelta < -1
  const isAhead = trackingDelta > 1
  
  // Calculate projected halving block
  const remainingIssuance = currentHalvingThreshold - totalMintedFct
  const currentRate = issuanceInPeriod / Math.max(1, blocksElapsedInPeriod)
  const projectedBlocksToHalving = currentRate > 0 ? 
    Math.round(remainingIssuance / currentRate) : 0
  const projectedHalvingBlock = Number(currentBlock) + projectedBlocksToHalving
  const targetHalvingBlock = (halvingLevel + 1) * TARGET_NUM_BLOCKS_IN_HALVING
  const blocksDifference = projectedHalvingBlock - targetHalvingBlock
  
  // Required rate adjustment to get back on track
  const blocksRemaining = TARGET_NUM_BLOCKS_IN_HALVING - blocksElapsedInPeriod
  const requiredRate = blocksRemaining > 0 ? 
    remainingIssuance / blocksRemaining : 0
  const requiredRateAdjustment = currentRate > 0 ? 
    ((requiredRate / currentRate) - 1) * 100 : 0
  
  // Determine current halving period
  const getCurrentHalving = () => {
    if (halvingLevel === Infinity) return null
    if (halvingLevel === 0) return halvingThresholds[0]
    if (halvingLevel <= 5) return halvingThresholds[halvingLevel]
    return halvingThresholds[5] // Final period
  }

  const currentHalving = getCurrentHalving()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      {/* Supply Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent mb-2 tabular-nums">
          {Math.round(maxSupplyFct).toLocaleString()} FCT
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Maximum Supply
        </p>
      </div>

      {/* Supply Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="text-center p-4 sm:p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
          <div className="text-xl sm:text-2xl font-bold text-gray-100 tabular-nums">
            {Math.round(totalMintedFct).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Current Supply
          </div>
        </div>
        <div className="text-center p-4 sm:p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
          <div className="text-xl sm:text-2xl font-bold text-gray-100">
            {progress.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Of Max Supply
          </div>
        </div>
        <div className="text-center p-4 sm:p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
          <div className="text-xl sm:text-2xl font-bold text-gray-100 tabular-nums">
            {formatFct(BigInt(Math.round(currentHalvingThreshold - totalMintedFct)) * 10n**18n, { compactView: true })}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Until Halving #{halvingLevel + 1}
          </div>
        </div>
      </div>
      
      {/* Halving Progress Tracking */}
      <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/10 border border-purple-800/30 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            📊 Current Halving Period Progress
          </h3>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
            isBehind ? 'bg-red-900/30 border border-red-700/50 text-red-400' :
            isAhead ? 'bg-blue-900/30 border border-blue-700/50 text-blue-400' :
            'bg-green-900/30 border border-green-700/50 text-green-400'
          }`}>
            {isBehind ? <ChevronDown className="w-3.5 h-3.5" /> : 
             isAhead ? <ChevronUp className="w-3.5 h-3.5" /> : 
             <TrendingUp className="w-3.5 h-3.5" />}
            {isBehind ? 'Behind Schedule' : 
             isAhead ? 'Ahead of Schedule' : 
             'On Track'}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Supply Issuance Progress */}
          <div>
            <div className="flex justify-between items-center mb-2.5 text-sm">
              <span className="text-gray-400 font-medium">💎 Supply Issuance Progress</span>
              <span className="text-gray-400 tabular-nums">
                {formatFct(totalMinted, { compactView: true })} / {formatFct(BigInt(Math.round(currentHalvingThreshold)) * 10n**18n, { compactView: true })} ({issuanceProgress.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-900/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, issuanceProgress)}%` }}
              />
            </div>
          </div>
          
          {/* Block Progress */}
          <div>
            <div className="flex justify-between items-center mb-2.5 text-sm">
              <span className="text-gray-400 font-medium">⏱️ Block Progress</span>
              <span className="text-gray-400 tabular-nums">
                {blocksElapsedInPeriod.toLocaleString()} / {TARGET_NUM_BLOCKS_IN_HALVING.toLocaleString()} blocks ({blockProgress.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-900/60 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, blockProgress)}%` }}
              />
              {/* Target indicator showing where issuance should be */}
              {Math.abs(trackingDelta) > 1 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white/30 border-l border-dashed border-white/20"
                  style={{ left: `${Math.min(100, issuanceProgress)}%` }}
                  title="Issuance target"
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Tracking Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800/50">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking Delta</div>
            <div className={`text-lg font-semibold tabular-nums ${
              isBehind ? 'text-red-400' : isAhead ? 'text-blue-400' : 'text-green-400'
            }`}>
              {trackingDelta > 0 ? '+' : ''}{trackingDelta.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isBehind ? 'Issuance behind' : isAhead ? 'Issuance ahead' : 'Aligned'}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Projected Halving</div>
            <div className="text-lg font-semibold tabular-nums text-gray-100">
              ~{(projectedHalvingBlock / 1e6).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {Math.abs(blocksDifference) > 1000 ? 
                `${(Math.abs(blocksDifference) / 1000).toFixed(0)}k blocks ${blocksDifference > 0 ? 'late' : 'early'}` :
                'On target'
              }
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Blocks Remaining</div>
            <div className="text-lg font-semibold tabular-nums text-gray-100">
              {(blocksRemaining / 1e6).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              ~{Math.round(blocksRemaining * SECONDS_PER_BLOCK / 86400)} days
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Required Rate</div>
            <div className="text-lg font-semibold tabular-nums text-gray-100">
              {requiredRateAdjustment > 0 ? '+' : ''}{requiredRateAdjustment.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              To align with target
            </div>
          </div>
        </div>
      </div>
      
      {/* Supply Progress Bar with Markers */}
      <div className="mb-8">
        <div className="relative h-5 bg-gray-900/80 rounded-full overflow-visible">
          {/* Progress Fill */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          
          {/* Halving Markers */}
          <div className="absolute inset-0">
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600/50" style={{ left: '50%' }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600/50" style={{ left: '75%' }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600/50" style={{ left: '87.5%' }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600/50" style={{ left: '93.75%' }} />
          </div>
        </div>
      </div>

      {/* Halving Timeline */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {halvingThresholds.map((threshold) => {
          const isPassed = totalMintedFct >= threshold.cumulative
          const isCurrent = currentHalving && currentHalving.level === threshold.level
          
          return (
            <div 
              key={threshold.level}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 shadow-lg shadow-green-500/10'
                  : isPassed 
                  ? 'bg-gray-800/40 border-gray-700/30' 
                  : 'bg-gray-900/40 border-gray-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`text-xs font-semibold ${
                  isCurrent 
                    ? 'text-green-400'
                    : isPassed 
                    ? 'text-gray-500' 
                    : 'text-gray-600'
                }`}>
                  {threshold.name}
                </div>
                {isPassed && !isCurrent && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </div>
              <div className={`text-xs mb-1 ${
                isCurrent ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {threshold.percent}
              </div>
              <div className={`text-sm font-semibold tabular-nums ${
                isCurrent ? 'text-gray-100' : 'text-gray-400'
              }`}>
                {(threshold.periodIssuance / 1e6).toFixed(0)}M FCT
              </div>
            </div>
          )
        })}
      </div>
      
      {blocksUntilNextHalving > 0n && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Next halving in {formatBlockNumber(blocksUntilNextHalving)} blocks
        </div>
      )}
    </div>
  )
}