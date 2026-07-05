'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface ChartRow {
  company_name: string
  Equity: number
  SAFE: number
  'Convertible Note': number
  Option: number
  Warrant: number
  'Advisory Equity': number
}

interface ExposureStackedBarChartProps {
  data: ChartRow[]
}

// Institutional color hierarchy matching our asset ledger palette
const COLOURS: Record<string, string> = {
  'Equity':           '#1a23bd',  // TVCLabs Signature Blue
  'SAFE':             '#2563eb',  // Premium Investment Blue
  'Convertible Note': '#7c3aed',  // Violet Audit Note
  'Option':           '#d97706',  // Deep Amber
  'Warrant':          '#ea580c',  // Muted Orange
  'Advisory Equity':  '#71717a',  // Slate Zinc
}

const TYPES = [
  'Equity',
  'SAFE',
  'Convertible Note',
  'Option',
  'Warrant',
  'Advisory Equity',
] as const

function formatCurrency(n: number): string {
  if (n === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function activeTypes(data: ChartRow[]): string[] {
  return TYPES.filter((type) =>
    data.some((row) => Number(row[type as keyof ChartRow]) > 0)
  )
}

export function ExposureStackedBarChart({ data }: ExposureStackedBarChartProps) {
  if (data.length === 0) return null

  const types = activeTypes(data)

  // Calculate dynamic heights to handle larger portfolios elegantly
  const chartHeight = Math.max(280, data.length * 36)

  return (
    // minWidth: 0 is required here because this component is rendered inside
    // a CSS grid cell (lg:col-span-7) in PortfolioExposureView. Grid items
    // default to min-width: auto / min-height: auto, which creates a
    // circular sizing dependency with ResponsiveContainer and produces the
    // "width(-1) height(-1)" warning on first paint. The grid cell itself
    // also needs `min-w-0` — see PortfolioExposureView fix.
    <div
      className="w-full min-w-0"
      style={{ height: chartHeight, minHeight: chartHeight, width: '100%', minWidth: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 8, top: 8, bottom: 8 }}
          barGap={0}
        >
          {/* Subtle horizontal tracking lines to guide the eyes across assets */}
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />

          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 10, fill: '#71717a', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            dataKey="company_name"
            tick={{ fontSize: 11, fill: '#18181b', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={130} // Expanded layout footprint for full company asset names
          />

          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={{
              fontSize: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              color: '#ffffff',
              padding: '8px 12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: '#ffffff', padding: '2px 0' }}
            labelStyle={{ color: '#a1a1aa', fontWeight: 600, marginBottom: '4px' }}
            cursor={{ fill: 'rgba(244, 244, 245, 0.6)' }}
          />

          <Legend
            iconType="circle"
            iconSize={6}
            verticalAlign="top"
            align="left"
            wrapperStyle={{ paddingTop: 0, paddingBottom: 20 }}
            formatter={(value) => (
              <span className="text-xs font-semibold text-zinc-600 ml-1 mr-4">{value}</span>
            )}
          />

          {types.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              fill={COLOURS[type]}
              maxBarSize={14}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}