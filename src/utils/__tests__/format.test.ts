import { expect, test } from 'vitest'
import { formatFct, formatRate, formatEth, formatPercentage, formatBlockNumber, weiToFct, weiToEth, compact } from '@/utils/format'

test('formatFct compact view', () => {
  expect(formatFct(1_234_000_000_000_000_000_000n)).toBe('1.2 K FCT')
  expect(formatFct(1_234_567_000_000_000_000_000_000n)).toBe('1.2 M FCT')
  expect(formatFct(1_234_567_890_000_000_000_000_000_000n)).toBe('1.2 B FCT')
  expect(formatFct(500_000_000_000_000_000_000n)).toBe('500.0 FCT')
})

test('formatFct full view', () => {
  expect(formatFct(1_234_000_000_000_000_000_000n, { compactView: false })).toBe('1,234.0 FCT')
  expect(formatFct(500_000_000_000_000_000_000n, { compactView: false })).toBe('500.0 FCT')
})

test('formatRate', () => {
  expect(formatRate(1_500_000_000_000_000_000n)).toBe('1.50 FCT/ETH')
  expect(formatRate(59_146_515_000_000_000_000_000_000n)).toBe('59.15 M FCT/ETH')
  expect(formatRate(12_345_678_901_234_567_890n)).toBe('12.35 FCT/ETH')
})

test('formatEth', () => {
  expect(formatEth(0n)).toBe('0 ETH')
  expect(formatEth(50_000_000_000_000n)).toBe('0.0001 ETH')
  expect(formatEth(123_450_000_000_000n)).toBe('0.0001 ETH')
  expect(formatEth(1_234_500_000_000_000n)).toBe('0.0012 ETH')
  expect(formatEth(1_234_500_000_000_000_000n)).toBe('1.23 ETH')
  expect(formatEth(1_234_567_890_000_000_000_000n)).toBe('1,234.57 ETH')
})

test('formatPercentage', () => {
  expect(formatPercentage(50.5)).toBe('+50.5%')
  expect(formatPercentage(-72.8123)).toBe('-72.8%')
  expect(formatPercentage(0)).toBe('0.0%')
  expect(formatPercentage(25.5, { showSign: false })).toBe('25.5%')
  expect(formatPercentage(25.555, { decimals: 2 })).toBe('+25.56%')
})

test('formatBlockNumber', () => {
  expect(formatBlockNumber(1767088)).toBe('1,767,088')
  expect(formatBlockNumber(1767088n)).toBe('1,767,088')
  expect(formatBlockNumber(100)).toBe('100')
  expect(formatBlockNumber(1000000)).toBe('1,000,000')
})

test('weiToFct', () => {
  expect(weiToFct(1_000_000_000_000_000_000n)).toBe(1)
  expect(weiToFct(1_500_000_000_000_000_000n)).toBe(1.5)
  expect(weiToFct(1_234_567_890_123_456_789n)).toBeCloseTo(1.234567890123457, 15)
})

test('weiToEth', () => {
  expect(weiToEth(1_000_000_000_000_000_000n)).toBe(1)
  expect(weiToEth(1_500_000_000_000_000_000n)).toBe(1.5)
  expect(weiToEth(1_234_567_890_123_456_789n)).toBeCloseTo(1.234567890123457, 15)
})

test('compact', () => {
  expect(compact(1234)).toBe('1.2 K')
  expect(compact(1234567)).toBe('1.2 M')
  expect(compact(1234567890)).toBe('1.2 B')
  expect(compact(500)).toBe('500.0')
  expect(compact(1234.56, 2)).toBe('1.23 K')
  expect(compact(-1234567)).toBe('-1.2 M')
})