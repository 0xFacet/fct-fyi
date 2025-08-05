import { createConfig, http } from 'wagmi'
import { createPublicClient } from 'viem'

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'sepolia'
const isMainnet = NETWORK === 'mainnet'

const RPC_URLS = {
  mainnet: 'https://mainnet.facet.org',
  sepolia: 'https://sepolia.facet.org',
}

const EXPLORER_URLS = {
  mainnet: 'https://explorer.facet.org',
  sepolia: 'https://sepolia.explorer.facet.org',
}

// Define Facet chain
export const facet = {
  id: 0xface7,
  name: isMainnet ? 'Facet' : 'Facet Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [RPC_URLS[NETWORK as keyof typeof RPC_URLS]] },
    public: { http: [RPC_URLS[NETWORK as keyof typeof RPC_URLS]] },
  },
  blockExplorers: {
    default: { 
      name: 'Facet Explorer', 
      url: EXPLORER_URLS[NETWORK as keyof typeof EXPLORER_URLS] 
    },
  },
  testnet: !isMainnet,
} as const

export const wagmiConfig = createConfig({
  chains: [facet],
  transports: {
    [facet.id]: http(RPC_URLS[NETWORK as keyof typeof RPC_URLS]),
  },
})

export const publicClient = createPublicClient({
  chain: facet,
  transport: http(RPC_URLS[NETWORK as keyof typeof RPC_URLS]),
})
