import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI } from '@/constants/fct'
import { formatBlockNumber } from '@/utils/format'
import { FctDetails } from '@/utils/fct-calculations'

interface SupplyPoint {
  block: bigint
  blockLabel: string         // e.g. "1,750,000"
  totalMinted: bigint        // wei
}

const fetchSamples = async (currentBlock: bigint, points = 10): Promise<SupplyPoint[]> => {
  if (currentBlock === 0n) return []
  
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

  // Parallel RPC calls
  const calls = blocks.map(block =>
    readContract(wagmiConfig, {
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

  return Promise.all(calls)
}

export const useTotalSupplySamples = (
  currentBlock: bigint,
  samplePoints = 10
) =>
  useQuery({
    queryKey: ['totalSupplySamples', samplePoints, currentBlock.toString()],
    queryFn: () => fetchSamples(currentBlock, samplePoints),
    enabled: currentBlock > 0n,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 60 * 60 * 1000,
  })