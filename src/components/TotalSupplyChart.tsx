import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTotalSupplySamples } from '@/hooks/useTotalSupplySamples'
import { formatFct, weiToFct } from '@/utils/format'

interface TotalSupplyChartProps {
  currentBlock: bigint
}

export function TotalSupplyChart({ currentBlock }: TotalSupplyChartProps) {
  const { data, isLoading } = useTotalSupplySamples(currentBlock, 10)

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-40 bg-gray-50 dark:bg-gray-900 rounded animate-pulse" />
    )
  }

  const chartData = data.map(d => ({
    x: d.blockLabel,
    y: weiToFct(d.totalMinted), // Convert to FCT units for Recharts
  }))

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Total Supply Growth
      </h3>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis 
            dataKey="x" 
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatFct(BigInt(Math.round(v * 1e18)), { compactView: true }).replace(' FCT', '')}
            width={60}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v: number) => formatFct(BigInt(Math.round(v * 1e18)))}
            labelFormatter={(l) => `Block ${l}`}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#E5E7EB' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#3B19D9"
            strokeWidth={2}
            dot={{ r: 2, fill: '#3B19D9' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}