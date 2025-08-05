import { useQuery } from '@tanstack/react-query'
import { fetchEthPrice } from '@/utils/external-apis'

export interface ExternalData {
  ethPrice: number | undefined
}

export function useExternalData() {
  // Fetch ETH price
  const { data: ethPrice } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: fetchEthPrice,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })

  return {
    ethPrice,
  }
}