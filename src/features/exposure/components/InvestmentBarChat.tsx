'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { ExposureRow } from '@/features/companies/types'

interface InvestmentBarChartProps {
  rows: ExposureRow[]
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function InvestmentBarChart({ rows }: InvestmentBarChartProps) {
  const data = rows
    .filter((r) => r.amount_invested && r.amount_invested > 0)
    .map((r) => ({
      name: r.holder_name,
      value: Number(r.amount_invested),
    }))
    .sort((a, b) => b.value - a.value)  // Largest first

  if (data.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        Amount invested
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Invested']}
            contentStyle={{
              fontSize: '12px',
              border: '1px solid #e4e4e7',
              borderRadius: '6px',
              padding: '6px 10px',
            }}
            cursor={{ fill: '#f4f4f5' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === 0 ? '#18181b' : '#d4d4d8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}