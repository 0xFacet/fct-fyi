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
  reason: 'over' | 'under'
  oldRate: bigint
  newRate: bigint
  rateChangePct: number
  halvingLevel: number
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
      
      // A period ended early (target hit) if:
      // 1. It lasted < 500 blocks AND
      // 2. Some FCT was actually minted (guards against 0-mint edge cases)
      const reason = (blocksLasted < ADJUSTMENT_PERIOD_TARGET_LENGTH && prevDetails.periodMinted > 0n)
        ? 'over' : 'under'
      
      // Calculate the rate change percentage
      const rateChangePct = prevDetails.mintRate === 0n ? 0 :
        Number(((headDetails.mintRate - prevDetails.mintRate) * 10000n) / prevDetails.mintRate) / 100
      
      // Calculate minted percentage of target
      const mintedPercent = target > 0n ? 
        Number((prevDetails.periodMinted * 10000n) / target) / 100 : 0
      
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