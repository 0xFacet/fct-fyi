import { useBlockNumber } from 'wagmi'
import { useEffect, useState } from 'react'

export function useCurrentBlock(refetchInterval = 10000) {
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Use wagmi's built-in block number hook with watching
  const { data: blockNumber, isError, isLoading: isLoadingBlock, refetch } = useBlockNumber({
    watch: refetchInterval > 0, // Enable watching if refetchInterval is set
    query: {
      refetchInterval: refetchInterval > 0 ? refetchInterval : undefined,
      enabled: true,
    }
  })

  useEffect(() => {
    if (blockNumber !== undefined && isInitialLoad) {
      setIsInitialLoad(false)
    }
  }, [blockNumber, isInitialLoad])

  return {
    currentBlock: blockNumber || 0n,
    isLoading: isLoadingBlock && isInitialLoad,
    error: isError ? new Error('Failed to fetch block number') : undefined,
    refetch,
    timestamp: undefined // Wagmi doesn't provide timestamp, but we weren't using it anyway
  }
}