import { FctDetails, getHalvingLevel, getBlocksUntilNextHalving } from '@/utils/fct-calculations'
import { formatBlockNumber, weiToFct } from '@/utils/format'
import { BLOCKS_PER_SECOND } from '@/constants/fct'

interface SupplyOverviewProps {
  fctData: FctDetails
  currentBlock: bigint
}

// Halving thresholds as percentages of max supply (cumulative)
const HALVING_THRESHOLDS = [
  { level: 1, percent: 50, cumulative: 821_632_853 },     // 50% of max supply
  { level: 2, percent: 75, cumulative: 1_232_449_280 },   // 75% of max supply
  { level: 3, percent: 87.5, cumulative: 1_437_857_493 }, // 87.5% of max supply
  { level: 4, percent: 93.75, cumulative: 1_540_561_600 },// 93.75% of max supply
  { level: 5, percent: 96.875, cumulative: 1_591_913_653 },// 96.875% of max supply
  { level: 6, percent: 98.4375, cumulative: 1_617_589_680 },// 98.4375% of max supply
]

export function SupplyOverview({ fctData, currentBlock }: SupplyOverviewProps) {
  const { totalMinted, maxSupply, periodStartBlock } = fctData
  
  // Convert to exact FCT amounts
  const totalMintedFct = weiToFct(totalMinted)
  const maxSupplyFct = weiToFct(maxSupply)
  const progress = (totalMintedFct / maxSupplyFct) * 100
  
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const blocksUntilNextHalving = getBlocksUntilNextHalving(totalMinted, maxSupply)
  
  // Calculate current halving progress
  const getCurrentHalvingProgress = () => {
    if (halvingLevel === 0) {
      // Pre-first halving: 0 to 50%
      const targetAmount = HALVING_THRESHOLDS[0].cumulative
      return {
        issuanceProgress: (totalMintedFct / targetAmount) * 100,
        expectedBlocks: 5_000_000, // Approximate
        actualBlocks: Number(currentBlock),
        periodIssuance: targetAmount, // Total to be issued in this period
        periodStart: 0,
        periodEnd: targetAmount
      }
    } else if (halvingLevel < 6) {
      // Between halvings
      const prevCumulative = HALVING_THRESHOLDS[halvingLevel - 1].cumulative
      const currCumulative = halvingLevel < 6 ? HALVING_THRESHOLDS[halvingLevel].cumulative : maxSupplyFct
      const periodIssuance = currCumulative - prevCumulative
      const progressInPeriod = totalMintedFct - prevCumulative
      
      const issuanceInHalving = (progressInPeriod / periodIssuance) * 100
      const expectedBlocksForHalving = 5_000_000 / Math.pow(2, halvingLevel) // Each halving takes ~half the blocks
      
      return {
        issuanceProgress: issuanceInHalving,
        expectedBlocks: Math.round(expectedBlocksForHalving),
        actualBlocks: Number(currentBlock - periodStartBlock), // Approximate
        periodIssuance: periodIssuance,
        periodStart: prevCumulative,
        periodEnd: currCumulative
      }
    } else {
      // Post-final halving
      const lastThreshold = HALVING_THRESHOLDS[5].cumulative
      const finalIssuance = maxSupplyFct - lastThreshold
      const progressInFinal = totalMintedFct - lastThreshold
      
      return {
        issuanceProgress: (progressInFinal / finalIssuance) * 100,
        expectedBlocks: 10_000_000, // Very long period
        actualBlocks: Number(currentBlock - periodStartBlock),
        periodIssuance: finalIssuance,
        periodStart: lastThreshold,
        periodEnd: maxSupplyFct
      }
    }
  }
  
  const halvingProgress = getCurrentHalvingProgress()
  const blocksProgress = halvingProgress.actualBlocks > 0 
    ? (halvingProgress.actualBlocks / halvingProgress.expectedBlocks) * 100 
    : 0
  
  const isOnTarget = Math.abs(halvingProgress.issuanceProgress - blocksProgress) < 5 // Within 5% is "on target"

  const getHalvingDisplay = () => {
    if (halvingLevel === Infinity) return 'Max Supply Reached'
    if (halvingLevel === 0) return 'Pre-Halving'
    return `Halving #${halvingLevel}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Supply Overview
      </h2>
      
      <div className="space-y-6">
        {/* Exact Total Supply */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Minted</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(totalMintedFct).toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">FCT</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-facet-blue h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>{progress.toFixed(4)}%</span>
            <span>Max: {Math.round(maxSupplyFct).toLocaleString()} FCT</span>
          </div>
        </div>

        {/* Current Halving Progress */}
        {halvingLevel < 6 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {getHalvingDisplay()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(halvingProgress.periodIssuance).toLocaleString()} FCT period issuance
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                isOnTarget 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : halvingProgress.issuanceProgress > blocksProgress
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {isOnTarget ? 'On Target' : halvingProgress.issuanceProgress > blocksProgress ? 'Ahead' : 'Behind'}
              </div>
            </div>
            
            {/* Progress Comparison */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Issuance Progress</span>
                  <span>{halvingProgress.issuanceProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(halvingProgress.issuanceProgress, 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Time Progress</span>
                  <span>{blocksProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gray-500 h-full rounded-full"
                    style={{ width: `${Math.min(blocksProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {blocksUntilNextHalving > 0n && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Next halving in {formatBlockNumber(blocksUntilNextHalving)} blocks
              </p>
            )}
          </div>
        )}

        {/* Halving Thresholds */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Halving Schedule
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HALVING_THRESHOLDS.map((threshold, i) => {
              const thresholdSupply = (BigInt(Math.round(threshold.percent * 100)) * maxSupply) / 10000n
              const isPassed = totalMinted >= thresholdSupply
              const isCurrent = halvingLevel === threshold.level
              
              return (
                <div 
                  key={i}
                  className={`p-2 rounded-lg border ${
                    isCurrent
                      ? 'border-facet-blue bg-blue-50 dark:bg-blue-900/20'
                      : isPassed 
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-medium ${
                        isCurrent 
                          ? 'text-facet-blue'
                          : isPassed 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        Halving #{threshold.level}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {threshold.percent}% • {threshold.cumulative.toLocaleString()} FCT total
                      </p>
                    </div>
                    {isPassed && (
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}