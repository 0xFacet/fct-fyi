import React from 'react'
import { FctDetails, getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'
import { formatFct, formatRate, formatBlockNumber } from '@/utils/format'
import { ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'

interface CurrentPeriodHeaderProps {
  fctData: FctDetails
  currentBlock: bigint
  ethPrice: number | undefined
}

export function CurrentPeriodHeader({ fctData, currentBlock, ethPrice }: CurrentPeriodHeaderProps) {
  const { periodStartBlock, periodMinted, mintRate, initialTargetPerPeriod, totalMinted, maxSupply } = fctData
  
  const blocksElapsed = currentBlock > periodStartBlock ? currentBlock - periodStartBlock : 0n
  const blockProgress = (Number(blocksElapsed) / ADJUSTMENT_PERIOD_TARGET_LENGTH) * 100
  
  const halvingLevel = getHalvingLevel(totalMinted, maxSupply)
  const currentTarget = getCurrentTarget(initialTargetPerPeriod, halvingLevel)
  const fctProgress = currentTarget > 0n ? (Number(periodMinted) / Number(currentTarget)) * 100 : 0
  
  const periodEndBlock = periodStartBlock + BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) - 1n

  // Calculate cost to mine 1 FCT
  const calculateMiningCost = () => {
    if (!ethPrice || mintRate === 0n) return undefined
    
    // mintRate is the amount of FCT wei you get per 1 ETH wei
    // To get 1 FCT (1e18 wei), you need: 1e18 / mintRate ETH wei
    const weiNeededForOneFCT = 1e18 / Number(mintRate)
    
    // Convert wei to ETH
    const ethNeededForOneFCT = weiNeededForOneFCT / 1e18
    // Cost in USD
    return ethNeededForOneFCT * ethPrice
  }

  const miningCostUSD = calculateMiningCost()


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Top Row - Rate and Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Mint Rate</p>
          <p className="text-2xl font-bold text-facet-blue">{formatRate(mintRate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost to Mine 1 FCT</p>
          <p className="text-2xl font-bold text-green-500">
            {miningCostUSD !== undefined ? `$${miningCostUSD.toFixed(5)}` : 'N/A'}
          </p>
          {ethPrice && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ETH: ${ethPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Period Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex flex-wrap justify-between items-center mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Block {formatBlockNumber(periodStartBlock)} → {formatBlockNumber(periodEndBlock)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Period {formatBlockNumber(blocksElapsed)} / {ADJUSTMENT_PERIOD_TARGET_LENGTH}
          </p>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Time Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Time Progress</span>
              <span>{formatBlockNumber(blocksElapsed)} / {ADJUSTMENT_PERIOD_TARGET_LENGTH} blocks ({blockProgress.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(blockProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* FCT Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>FCT Minted</span>
              <span>{formatFct(periodMinted)} / {formatFct(currentTarget)} ({fctProgress.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(fctProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}