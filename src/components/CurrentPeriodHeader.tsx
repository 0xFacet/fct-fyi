import React from 'react'
import { FctDetails, getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'
import { formatFct, formatRate, formatBlockNumber, formatDuration, formatCostPerFct } from '@/utils/format'
import { ADJUSTMENT_PERIOD_TARGET_LENGTH, SECONDS_PER_BLOCK } from '@/constants/fct'
import { PeriodCompletionRace } from './PeriodCompletionRace'

interface CurrentPeriodHeaderProps {
  fctData: FctDetails
  currentBlock: bigint
  ethPrice: number | undefined
}

export function CurrentPeriodHeader({ fctData, currentBlock, ethPrice }: CurrentPeriodHeaderProps) {
  const { periodStartBlock, periodMinted, mintRate, initialTargetPerPeriod, totalMinted, maxSupply } = fctData
  
  const blocksElapsed = currentBlock > periodStartBlock ? currentBlock - periodStartBlock : 0n
  const blocksRemaining = BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) - blocksElapsed
  const periodEndBlock = periodStartBlock + BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) - 1n
  
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
  const timeUntilEnd = Math.max(0, Number(blocksUntilEnd) * SECONDS_PER_BLOCK)
  
  // Calculate projected final minted amount
  const projectedFinalMinted = projectedEndCondition === 'time' 
    ? periodMinted + (currentMintingRate * blocksRemaining)
    : currentTarget


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            {/* Current Mint Rate */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Current Mint Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
                {formatRate(mintRate)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                FCT per ETH burned • {formatCostPerFct(mintRate, ethPrice || 0)}
              </p>
            </div>
            
            {/* Period Range */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Period Range</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatBlockNumber(periodStartBlock)} → {formatBlockNumber(periodEndBlock)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Started {formatBlockNumber(blocksElapsed)} blocks ago
              </p>
            </div>
            
            {/* Period Forecast Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 sm:p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">Period Ending In</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-100">
                  {formatDuration(timeUntilEnd)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  via {projectedEndCondition === 'target' ? 'target reached' : 'time limit'}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 sm:p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">Projected Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-100">
                  {formatFct(projectedFinalMinted, { compactView: true, decimals: 1 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(Number(projectedFinalMinted * 100n / currentTarget))}% of target
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Column - Race Visualization */}
          <PeriodCompletionRace 
            fctData={fctData}
            currentBlock={currentBlock}
            currentTarget={currentTarget}
          />
        </div>
      </div>
    </div>
  )
}