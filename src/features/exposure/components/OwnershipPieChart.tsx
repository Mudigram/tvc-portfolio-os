'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ExposureRow } from '@/features/companies/types'

interface OwnershipPieChartProps {
  rows: ExposureRow[]
}

// Enough colours for up to 8 distinct holders
const COLORS = [
  '#18181b', // zinc-900
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#60a5fa', // blue-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#a3e635', // lime-400
]

export function OwnershipPieChart({ rows }: OwnershipPieChartProps) {
  // Only rows with an ownership percentage
  const data = rows
    .filter((r) => r.ownership_pct && r.ownership_pct > 0)
    .map((r) => ({
      name: r.holder_name,
      value: Number(r.ownership_pct),
    }))

  if (data.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        Ownership split
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            strokeWidth={0}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Ownership']}
            contentStyle={{
              fontSize: '12px',
              border: '1px solid #e4e4e7',
              borderRadius: '6px',
              padding: '6px 10px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#71717a' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}