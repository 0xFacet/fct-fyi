// External API integrations for price data

interface CoinGeckoResponse {
  ethereum: {
    usd: number
  }
}

export async function fetchEthPrice(): Promise<number | undefined> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 60 } } // Cache for 1 minute
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch ETH price')
    }
    
    const data: CoinGeckoResponse = await response.json()
    return data.ethereum?.usd
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return undefined
  }
}

// Calculate the cost to mine 1 FCT in USD
export function calculateMiningCostUSD(
  mintRate: bigint,
  ethPrice: number | undefined
): number | undefined {
  if (!ethPrice || mintRate === 0n) return undefined
  
  try {
    // mintRate is the amount of FCT wei you get per 1 ETH wei
    // To get 1 FCT (1e18 wei), you need: 1e18 / mintRate ETH wei
    const weiNeededForOneFCT = 1e18 / Number(mintRate)
    
    // Convert wei to ETH
    const ethNeededForOneFCT = weiNeededForOneFCT / 1e18
    
    // Cost in USD
    const usdPerFct = ethNeededForOneFCT * ethPrice
    
    return usdPerFct
  } catch (error) {
    console.error('Error calculating mining cost:', error)
    return undefined
  }
}

// Calculate how much FCT would be minted for a given amount of ETH
export function calculateFctForEth(
  ethAmountWei: bigint,
  mintRate: bigint
): bigint {
  // FCT minted = ETH amount * mint rate / 1e18
  const fctMinted = (ethAmountWei * mintRate) / BigInt(1e18)
  
  return fctMinted
}