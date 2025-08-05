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
  // Build list of blocks to fetch
  const blocksToFetch: bigint[] = []
  let headDetails = currentDetails
  
  for (let i = 0; i < periodsToFetch; i++) {
    const prevPeriodEndBlock = headDetails.periodStartBlock - 1n
    if (prevPeriodEndBlock <= 0n) break
    blocksToFetch.push(prevPeriodEndBlock)
    
    // Estimate the previous period start (may be off, but good enough for iteration)
    const estimatedPrevStart = prevPeriodEndBlock - BigInt(ADJUSTMENT_PERIOD_TARGET_LENGTH) + 1n
    headDetails = { ...headDetails, periodStartBlock: estimatedPrevStart }
  }
  
  // Fetch all historical data in parallel
  const fetchPromises = blocksToFetch.map(blockNumber => 
    readContract(wagmiConfig, {
      address: L1_BLOCK_ADDRESS,
      abi: FCT_DETAILS_ABI,
      functionName: 'fctDetails',
      blockNumber,
    }) as Promise<FctDetails>
  )
  
  const historicalDetails = await Promise.all(fetchPromises)
  
  // Process the results
  const periods: HistoricalPeriod[] = []
  headDetails = currentDetails
  
  for (let i = 0; i < historicalDetails.length; i++) {
    const prevDetails = historicalDetails[i]
    const prevPeriodEndBlock = blocksToFetch[i]
    
    try {
      
      // Calculate the target for that period
      const halvingLevel = getHalvingLevel(prevDetails.totalMinted, prevDetails.maxSupply)
      const target = getCurrentTarget(prevDetails.initialTargetPerPeriod, halvingLevel)
      
      // Calculate how many blocks the period lasted
      const blocksLasted = Number(prevPeriodEndBlock - prevDetails.periodStartBlock + 1n)
      
      // A period that ran < 500 blocks ended because the target was reached
      // (even if periodMinted shows < 100% due to mid-transaction splitting)
      const reason = blocksLasted < ADJUSTMENT_PERIOD_TARGET_LENGTH ? 'over' : 'under'
      
      // Calculate the rate change percentage
      const rateChangePct = headDetails.mintRate === 0n ? 0 :
        Number(((headDetails.mintRate - prevDetails.mintRate) * 10000n) / prevDetails.mintRate) / 100
      
      // Calculate minted percentage of target
      const mintedPercent = target > 0n ? 
        Number((prevDetails.periodMinted * 10000n) / target) / 100 : 0
      
      // We'll use index instead of trying to calculate period number
      const periodNumber = 0 // Will be set later based on position
      
      periods.push({
        periodNumber,
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
      
      // Move to the previous period
      headDetails = prevDetails
      
    } catch (error) {
      console.error(`Failed to fetch period ending at block ${prevPeriodEndBlock}:`, error)
      // Continue trying to fetch earlier periods
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