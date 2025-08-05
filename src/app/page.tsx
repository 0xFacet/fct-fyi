'use client'

import { useReadContract } from 'wagmi'
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI } from '@/constants/fct'
import { formatEther } from 'viem'

export default function Home() {
  const { data: fctDetails, isLoading, error } = useReadContract({
    address: L1_BLOCK_ADDRESS,
    abi: FCT_DETAILS_ABI,
    functionName: 'fctDetails',
  })

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-facet-blue">F</span>
            <span className="text-gray-600">ore</span>
            <span className="text-facet-blue">C</span>
            <span className="text-gray-600">as</span>
            <span className="text-facet-blue">T</span>
          </h1>
          <p className="text-gray-600">Loading FCT data...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-facet-blue">F</span>
            <span className="text-gray-600">ore</span>
            <span className="text-facet-blue">C</span>
            <span className="text-gray-600">as</span>
            <span className="text-facet-blue">T</span>
          </h1>
          <div className="text-sm text-gray-500">
            {process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'Mainnet' : 'Sepolia'}
          </div>
        </div>

        {fctDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Supply Overview</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Minted: {formatEther(fctDetails.totalMinted)} FCT
                </p>
                <p className="text-sm text-gray-600">
                  Max Supply: {formatEther(fctDetails.maxSupply)} FCT
                </p>
                <p className="text-sm text-gray-600">
                  Progress: {((Number(fctDetails.totalMinted) / Number(fctDetails.maxSupply)) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Current Period</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Period Start Block: {fctDetails.periodStartBlock.toString()}
                </p>
                <p className="text-sm text-gray-600">
                  Period Minted: {formatEther(fctDetails.periodMinted)} FCT
                </p>
                <p className="text-sm text-gray-600">
                  Mint Rate: {formatEther(fctDetails.mintRate)} FCT/ETH
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}