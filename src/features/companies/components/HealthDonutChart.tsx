'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface HealthDonutChartProps {
  red: number
  amber: number
  green: number
  unset: number
}

const SEGMENTS = [
  { key: 'Red',      color: '#f87171' },  // red-400
  { key: 'Amber',    color: '#fbbf24' },  // amber-400
  { key: 'Green',    color: '#34d399' },  // emerald-400
  { key: 'Not set',  color: '#e4e4e7' },  // zinc-200
]

export function HealthDonutChart({ red, amber, green, unset }: HealthDonutChartProps) {
  const data = [
    { name: 'Red',     value: red },
    { name: 'Amber',   value: amber },
    { name: 'Green',   value: green },
    { name: 'Not set', value: unset },
  ].filter((d) => d.value > 0)  // Hide empty segments

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width={120} height={120}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={55}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry) => {
            const segment = SEGMENTS.find((s) => s.key === entry.name)
            return <Cell key={entry.name} fill={segment?.color ?? '#e4e4e7'} />
          })}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} companies`, name]}
          contentStyle={{
            fontSize: '12px',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            padding: '6px 10px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}