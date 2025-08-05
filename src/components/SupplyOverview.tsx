import { FctDetails, getHalvingLevel, getBlocksUntilNextHalving } from '@/utils/fct-calculations'
import { formatBlockNumber, weiToFct } from '@/utils/format'

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
  const remainingToMint = maxSupplyFct - totalMintedFct
  
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const blocksUntilNextHalving = getBlocksUntilNextHalving(totalMinted, maxSupply)
  
  // Compute halving thresholds dynamically based on actual max supply
  const halvingThresholds = computeHalvingThresholds(maxSupplyFct)
  
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
          Maximum Supply Cap
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
            {progress.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Supply Minted
          </div>
        </div>
        <div className="text-center p-4 sm:p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
          <div className="text-xl sm:text-2xl font-bold text-gray-100 tabular-nums">
            {Math.round(remainingToMint).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Remaining to Mint
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