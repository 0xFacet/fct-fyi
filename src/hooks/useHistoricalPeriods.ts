import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI, ADJUSTMENT_PERIOD_TARGET_LENGTH } from '@/constants/fct'
import { FctDetails, getCurrentTarget, getHalvingLevel } from '@/utils/fct-calculations'

export interface HistoricalPeriod {
  periodNumber: number
  periodStart: bigint
  periodEnd: bigint
  blocksLasted: number
  minted: bigint
  target: bigint
  mintedPercent: number
  reason: 'over' | 'under' | 'multiple' // 'multiple' for intra-block periods
  oldRate: bigint
  newRate: bigint
  rateChangePct: number
  halvingLevel: number
  intraBlockPeriods: boolean // True if multiple periods occurred in same block
  totalMintedInBlock?: bigint // Total minted if intra-block periods detected
  totalSupply: bigint // Total supply at the END of this period
  prevTotalSupply?: bigint // Total supply at the END of the previous period
  hiddenMint?: bigint // Hidden minting that occurred between periods
}

interface FetchHistoricalPeriodsParams {
  currentBlock: bigint
  currentDetails: FctDetails
  periodsToFetch: number
}

async function fetchHistoricalPeriods({
  currentDetails,
  periodsToFetch
}: Omit<FetchHistoricalPeriodsParams, 'currentBlock'>): Promise<HistoricalPeriod[]> {
  const periods: HistoricalPeriod[] = []
  let headDetails = currentDetails // Start with current period details
  
  for (let i = 0; i < periodsToFetch; i++) {
    const prevPeriodEndBlock = headDetails.periodStartBlock - 1n
    if (prevPeriodEndBlock <= 0n) break
    
    try {
      // Fetch the REAL snapshot at the end of the previous period
      const prevDetails = await readContract(wagmiConfig, {
        address: L1_BLOCK_ADDRESS,
        abi: FCT_DETAILS_ABI,
        functionName: 'fctDetails',
        blockNumber: prevPeriodEndBlock,
      }) as FctDetails
      
      // Calculate the target for that period
      const halvingLevel = getHalvingLevel(prevDetails.totalMinted, prevDetails.maxSupply)
      const target = getCurrentTarget(prevDetails.initialTargetPerPeriod, halvingLevel)
      
      // Calculate how many blocks the period lasted using the ACTUAL periodStartBlock
      const blocksLasted = Number(prevPeriodEndBlock - prevDetails.periodStartBlock + 1n)
      
      // Detect intra-block periods by checking if the rate changed dramatically
      // Compare the rate that would be set AFTER prevDetails period ended
      // with the rate we see at the start of headDetails period
      // A huge rate drop (>75%) usually indicates multiple periods happened in one block
      const rateDropPercent = headDetails.mintRate > prevDetails.mintRate 
        ? 0  // Rate increased, not a drop
        : prevDetails.mintRate > 0n
        ? Number(((prevDetails.mintRate - headDetails.mintRate) * 100n) / prevDetails.mintRate)
        : 0
      
      // If rate dropped by more than 75%, likely multiple periods in one block
      // Each over-issuance can drop rate by up to 75% (to 0.25x)
      // So a drop to 0.25^n indicates n periods
      const intraBlockPeriods = rateDropPercent > 75
      
      // Estimate how many periods based on rate drop
      let estimatedPeriods = 1
      if (intraBlockPeriods && prevDetails.mintRate > 0n) {
        // Each 4x drop means one over-issuance period
        const rateRatio = Number(prevDetails.mintRate) / Number(headDetails.mintRate)
        estimatedPeriods = Math.max(1, Math.round(Math.log(rateRatio) / Math.log(4)))
      }
      
      // Determine reason for period end
      let reason: 'over' | 'under' | 'multiple'
      if (intraBlockPeriods) {
        reason = 'multiple' // Multiple periods in same block
      } else if (blocksLasted < ADJUSTMENT_PERIOD_TARGET_LENGTH && prevDetails.periodMinted > 0n) {
        reason = 'over' // Hit target
      } else {
        reason = 'under' // Timeout
      }
      
      // Log extreme rate changes for debugging
      if (rateDropPercent > 90) {
        console.log(`Extreme rate change detected:`, {
          block: prevPeriodEndBlock,
          oldRate: prevDetails.mintRate.toString(),
          newRate: headDetails.mintRate.toString(),
          dropPercent: rateDropPercent,
          estimatedPeriods
        })
      }
      
      // Calculate the rate change percentage
      const rateChangePct = prevDetails.mintRate === 0n ? 0 :
        Number(((headDetails.mintRate - prevDetails.mintRate) * 10000n) / prevDetails.mintRate) / 100
      
      // Calculate minted percentage of target
      const mintedPercent = target > 0n ? 
        Number((prevDetails.periodMinted * 10000n) / target) / 100 : 0
      
      // Calculate hidden mint (minting that happened between periods)
      const hiddenMint = headDetails.totalMinted - headDetails.periodMinted - prevDetails.totalMinted
      
      periods.push({
        periodNumber: 0, // Will be set later based on position
        periodStart: prevDetails.periodStartBlock,
        periodEnd: prevPeriodEndBlock,
        blocksLasted,
        minted: prevDetails.periodMinted,
        target,
        mintedPercent,
        reason,
        oldRate: prevDetails.mintRate,
        newRate: headDetails.mintRate,
        rateChangePct,
        halvingLevel,
        intraBlockPeriods,
        totalMintedInBlock: intraBlockPeriods ? prevDetails.periodMinted * BigInt(estimatedPeriods) : undefined,
        totalSupply: prevDetails.totalMinted, // Total supply at END of this period
        hiddenMint: hiddenMint > 0n ? hiddenMint : undefined // Minting between periods
      })
      
      // Step back one period using the ACTUAL start block we just fetched
      headDetails = prevDetails
      
    } catch (error) {
      console.error(`Failed to fetch period ending at block ${prevPeriodEndBlock}:`, error)
      // Continue trying to fetch earlier periods
      break // Stop if we hit an error (likely before contract deployment)
    }
  }
  
  // Return in chronological order (oldest first) and assign period numbers
  periods.reverse().forEach((p, i) => {
    p.periodNumber = i + 1 // oldest = 1
  })
  return periods
}

export function useHistoricalPeriods(
  currentBlock: bigint,
  currentDetails: FctDetails | undefined,
  periodsToFetch = 3
) {
  return useQuery<HistoricalPeriod[]>({
    queryKey: ['historicalPeriods', currentDetails?.periodStartBlock.toString(), periodsToFetch],
    queryFn: () => fetchHistoricalPeriods({
      currentDetails: currentDetails!,
      periodsToFetch
    }),
    enabled: !!currentDetails && currentBlock > 0n,
    staleTime: 5 * 60 * 1000, // 5 minutes - historical data doesn't change
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  })
}