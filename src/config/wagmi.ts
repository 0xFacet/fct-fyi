import { createConfig, http } from 'wagmi'
import { createPublicClient } from 'viem'

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'sepolia'
const isMainnet = NETWORK === 'mainnet'

const RPC_URLS = {
  mainnet: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || 'https://mainnet.facet.org',
  sepolia: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || 'https://sepolia.facet.org',
}

const EXPLORER_URLS = {
  mainnet: process.env.NEXT_PUBLIC_EXPLORER_URL_MAINNET || 'https://explorer.facet.org',
  sepolia: process.env.NEXT_PUBLIC_EXPLORER_URL_SEPOLIA || 'https://sepolia.explorer.facet.org',
}

// Define Facet chain
export const facet = {
  id: isMainnet ? 0xface7 : 0xface7a,
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
    [0xface7]: http(RPC_URLS.mainnet),
    [0xface7a]: http(RPC_URLS.sepolia),
  },
})

export const publicClient = createPublicClient({
  chain: facet,
  transport: http(RPC_URLS[NETWORK as keyof typeof RPC_URLS]),
})
