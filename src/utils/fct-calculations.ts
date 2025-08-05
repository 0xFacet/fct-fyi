import { 
  ADJUSTMENT_PERIOD_TARGET_LENGTH, 
  TARGET_NUM_BLOCKS_IN_HALVING,
  MAX_RATE_ADJUSTMENT_UP,
  MAX_RATE_ADJUSTMENT_DOWN 
} from '@/constants/fct'

export interface FctDetails {
  mintRate: bigint
  totalMinted: bigint
  periodStartBlock: bigint
  periodMinted: bigint
  maxSupply: bigint
  initialTargetPerPeriod: bigint
}

export interface RateAdjustmentPrediction {
  newRate: bigint
  reason: 'over-issuance' | 'under-issuance' | 'projected-over' | 'projected-under' | 'supply-exhausted'
  confidence: string
  changePercent: number
}

// Calculate current halving level based on supply
export function getHalvingLevel(totalMinted: bigint, maxSupply: bigint): number {
  if (totalMinted >= maxSupply) return Infinity

  let level = 0
  let threshold = maxSupply / 2n

  while (totalMinted >= threshold && threshold < maxSupply) {
    level++
    const remaining = maxSupply - threshold
    threshold += remaining / 2n
  }

  return level
}

// Calculate current period target
export function getCurrentTarget(initialTarget: bigint, halvingLevel: number): bigint {
  if (halvingLevel === Infinity) return 0n
  return initialTarget / (2n ** BigInt(halvingLevel))
}

// Calculate blocks until next halving
export function getBlocksUntilNextHalving(totalMinted: bigint, maxSupply: bigint): bigint {
  const currentLevel = getHalvingLevel(totalMinted, maxSupply)
  if (currentLevel === Infinity) return 0n

  // Find the supply threshold for next halving
  let nextThreshold = maxSupply / 2n
  for (let i = 0; i < currentLevel; i++) {
    const remaining = maxSupply - nextThreshold
    nextThreshold += remaining / 2n
  }

  // Estimate blocks based on current minting rate
  // This is simplified - in production you'd use historical average
  const supplyToNextHalving = nextThreshold - totalMinted
  const estimatedBlocksPerFCT = BigInt(TARGET_NUM_BLOCKS_IN_HALVING) / (maxSupply / 2n)
  
  return supplyToNextHalving * estimatedBlocksPerFCT
}

// Predict rate adjustment
export function predictRateAdjustment(
  fctData: FctDetails, 
  currentBlock: bigint
): RateAdjustmentPrediction {
  const { mintRate, periodMinted, periodStartBlock, totalMinted, maxSupply, initialTargetPerPeriod } = fctData
  
  // Check if supply is exhausted
  if (totalMinted >= maxSupply) {
    return {
      newRate: 0n,
      reason: 'supply-exhausted',
      confidence: 'final',
      changePercent: -100
    }
  }

  const blocksElapsed = currentBlock - periodStartBlock
  const currentTarget = getCurrentTarget(
    initialTargetPerPeriod,
    getHalvingLevel(totalMinted, maxSupply)
  )

  // Period complete by target
  if (periodMinted >= currentTarget) {
    const factor = Math.max(
      Number(blocksElapsed) / ADJUSTMENT_PERIOD_TARGET_LENGTH, 
      MAX_RATE_ADJUSTMENT_DOWN
    )
    const newRate = mintRate * BigInt(Math.floor(factor * 1000)) / 1000n
    
    return {
      newRate,
      reason: 'over-issuance',
      confidence: 'final',
      changePercent: ((Number(newRate) / Number(mintRate)) - 1) * 100
    }
  }

  // Period complete by time
  if (blocksElapsed >= BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH)) {
    const factor = periodMinted === 0n
      ? MAX_RATE_ADJUSTMENT_UP
      : Math.min(
          Number(currentTarget * 1000n / periodMinted) / 1000, 
          MAX_RATE_ADJUSTMENT_UP
        )
    
    const newRate = mintRate * BigInt(Math.floor(factor * 1000)) / 1000n
    
    return {
      newRate,
      reason: 'under-issuance',
      confidence: 'final',
      changePercent: ((Number(newRate) / Number(mintRate)) - 1) * 100
    }
  }

  // Period in progress - project based on current pace
  if (blocksElapsed === 0n || periodMinted === 0n) {
    return {
      newRate: mintRate,
      reason: 'projected-under',
      confidence: '0%',
      changePercent: 0
    }
  }

  const projectedIssuance = periodMinted * BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) / blocksElapsed
  const projectedFactor = Number(currentTarget * 1000n / projectedIssuance) / 1000

  const newRate = mintRate * BigInt(
    Math.floor(
      Math.max(MAX_RATE_ADJUSTMENT_DOWN, Math.min(MAX_RATE_ADJUSTMENT_UP, projectedFactor)) * 1000
    )
  ) / 1000n

  return {
    newRate,
    reason: projectedIssuance > currentTarget ? 'projected-over' : 'projected-under',
    confidence: `${Math.round(Number(blocksElapsed) / ADJUSTMENT_PERIOD_TARGET_LENGTH * 100)}%`,
    changePercent: ((Number(newRate) / Number(mintRate)) - 1) * 100
  }
}