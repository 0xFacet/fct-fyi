export const L1_BLOCK_ADDRESS = '0x4200000000000000000000000000000000000015'

export const FCT_DETAILS_ABI = [
  {
    inputs: [],
    name: 'fctDetails',
    outputs: [
      {
        components: [
          { internalType: 'uint128', name: 'mintRate', type: 'uint128' },
          { internalType: 'uint128', name: 'totalMinted', type: 'uint128' },
          { internalType: 'uint128', name: 'periodStartBlock', type: 'uint128' },
          { internalType: 'uint128', name: 'periodMinted', type: 'uint128' },
          { internalType: 'uint128', name: 'maxSupply', type: 'uint128' },
          { internalType: 'uint128', name: 'initialTargetPerPeriod', type: 'uint128' }
        ],
        internalType: 'struct L1Block.FctDetails',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Bluebird fork constants
export const ADJUSTMENT_PERIOD_TARGET_LENGTH = 500
export const TARGET_NUM_BLOCKS_IN_HALVING = 5_256_000
export const MAX_RATE_ADJUSTMENT_UP = 4
export const MAX_RATE_ADJUSTMENT_DOWN = 0.25

// Display constants
export const SECONDS_PER_BLOCK = 12
