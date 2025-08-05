import { HistoricalPeriod } from '@/hooks/useHistoricalPeriods'

export function getRateChangeSymbol(changePct: number): string {
  if (changePct > 0.5) return '↑'
  if (changePct < -0.5) return '↓'
  return '↔'
}

export function getRateChangeColor(changePct: number): string {
  if (changePct > 0) return 'text-green-600 dark:text-green-400'
  if (changePct < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

export function formatRateChange(changePct: number): string {
  const symbol = getRateChangeSymbol(changePct)
  const absPercent = Math.abs(changePct).toFixed(1)
  return `${symbol} ${absPercent}%`
}

export function getEndReasonText(period: HistoricalPeriod): string {
  if (period.reason === 'over') {
    return `Target hit after ${period.blocksLasted} blocks`
  } else {
    return `500-block timeout (${period.mintedPercent.toFixed(1)}% of target)`
  }
}

export function getPeriodDurationText(blocks: number): string {
  const minutes = Math.round(blocks * 12 / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = (minutes / 60).toFixed(1)
  return `${hours} hrs`
}

// Prepare chart data keeping BigInt values intact
export function prepareChartData(periods: HistoricalPeriod[] | undefined) {
  if (!periods) return []
  return periods.map(period => ({
    periodNumber: period.periodNumber,
    startBlock: period.periodStart,
    endBlock: period.periodEnd,
    minted: period.minted, // Keep as BigInt
    target: period.target, // Keep as BigInt
    mintedPercent: period.mintedPercent,
    rate: period.newRate, // Keep as BigInt
    rateChangePct: period.rateChangePct,
    reason: period.reason,
    blocksLasted: period.blocksLasted,
    endReasonText: getEndReasonText(period),
    durationText: getPeriodDurationText(period.blocksLasted),
  }))
}