// src/utils/format.ts
import { formatEther } from 'viem'

/* ---------- constants ---------- */
export const WEI       = 10n ** 18n
export const FCT_DECIMALS = 18n           // FCT has 18 decimals like ETH

/* ---------- intl helpers ---------- */
const numberFmt = (dec: number, locale?: string) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })

/* ---------- core converters ---------- */
export const weiToEth = (wei: bigint): number =>
  parseFloat(formatEther(wei))                // viem already BigInt-safe

export const weiToFct = (wei: bigint): number =>
  Number(wei / WEI) + Number(wei % WEI) / 1e18 // stays < 2^53

/* ---------- compact helpers ---------- */
export const compact = (value: number, dec = 1): string => {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(dec)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(dec)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(dec)}k`
  return value.toFixed(dec)
}

/* ---------- public API ---------- */
export const formatFct = (
  wei: bigint,
  { compactView = true, decimals = 1 } = {}
): string => {
  const fct = weiToFct(wei)
  return compactView ? `${compact(fct, decimals)} FCT`
                     : `${numberFmt(decimals).format(fct)} FCT`
}

export const formatEth = (
  wei: bigint,
  { decimalsLarge = 2, decimalsSmall = 4 } = {}
): string => {
  const eth = weiToEth(wei)
  if (eth === 0) return '0 ETH'
  if (eth < 0.0001) return '<0.0001 ETH'
  const dec = eth >= 1 ? decimalsLarge : decimalsSmall
  return `${numberFmt(dec).format(Math.floor(eth * 10 ** dec) / 10 ** dec)} ETH`
}

export const formatRate = (
  rate: bigint,
  { decimals = 2 } = {}
): string => {
  // rate is already FCT per ETH (just as a number, not wei/wei)
  const rateNum = Number(rate)
  return `${compact(rateNum, decimals)} FCT/ETH`
}

export const formatCostPerFct = (mintRate: bigint, ethPrice: number): string => {
  if (ethPrice === 0 || mintRate === 0n) return 'N/A'
  
  // mintRate is FCT per ETH, so 1 FCT costs 1/mintRate ETH
  const ethPerFct = 1 / Number(mintRate)
  const costPerFct = ethPerFct * ethPrice
  
  if (costPerFct < 0.000001) return '<$0.000001'
  if (costPerFct < 0.01) return `$${costPerFct.toFixed(6)}`
  if (costPerFct < 1) return `$${costPerFct.toFixed(4)}`
  return `$${costPerFct.toFixed(2)}`
}

export const formatPercentage = (
  pct: number,
  { decimals = 1, showSign = true } = {}
): string => {
  const sign = showSign && pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(decimals)}%`
}

export const formatBlockNumber = (block: bigint | number): string =>
  numberFmt(0).format(typeof block === 'bigint' ? Number(block) : block)

/* ---------- time helpers ---------- */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`
  return `${(seconds / 86400).toFixed(1)} days`
}