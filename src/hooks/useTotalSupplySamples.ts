import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI } from '@/constants/fct'
import { formatBlockNumber } from '@/utils/format'
import { FctDetails } from '@/utils/fct-calculations'

interface SupplyPoint {
  block: bigint
  blockLabel: string         // e.g. "1,750,000"
  totalMinted: bigint        // wei
}

const fetchSamples = async (publicClient: ReturnType<typeof usePublicClient>, currentBlock: bigint, points = 10): Promise<SupplyPoint[]> => {
  if (!publicClient || currentBlock === 0n) return []
  
  // Calculate step size, round to 500 blocks
  const rawStep = currentBlock / BigInt(points - 1)
  const step = ((rawStep / 500n) * 500n) || 500n

  const blocks: bigint[] = []
  for (let i = points - 1; i >= 0; i--) {
    const blk = currentBlock - step * BigInt(i)
    if (blk > 0n) {
      blocks.push(blk)
    }
  }

  // Try to fetch data for each block, handling failures gracefully
  const results = await Promise.all(
    blocks.map(block =>
      publicClient.readContract({
        address: L1_BLOCK_ADDRESS,
        abi: FCT_DETAILS_ABI,
        functionName: 'fctDetails',
        blockNumber: block,
      }).then((d: FctDetails) => ({
        block,
        blockLabel: formatBlockNumber(block),
        totalMinted: d.totalMinted,
      }))
    )
  )

  // Filter out failed requests (likely from blocks before contract deployment)
  const successfulSamples = results
  return successfulSamples
}

export const useTotalSupplySamples = (
  currentBlock: bigint,
  samplePoints = 3
) => {
  const publicClient = usePublicClient()
  
  // Round currentBlock to nearest 500 to prevent unnecessary refetches
  const roundedBlock = currentBlock > 0n ? ((currentBlock / 500n) * 500n) : 0n
  
  return useQuery({
    queryKey: ['totalSupplySamples', samplePoints, roundedBlock.toString()],
    queryFn: () => fetchSamples(publicClient, currentBlock, samplePoints),
    enabled: currentBlock > 0n && !!publicClient,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 60 * 60 * 1000,
  })
}