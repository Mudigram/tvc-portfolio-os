import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Portfolio value', value: '$482.4M', change: '+8.2%', tone: 'up' },
  { label: 'Active companies', value: '24', change: '+3 this month', tone: 'up' },
  { label: 'Exposure alerts', value: '7', change: '-2 vs last week', tone: 'down' },
  { label: 'Capital deployed', value: '$86.1M', change: '+12.6%', tone: 'up' },
]

const pipeline = [62, 74, 68, 86, 98, 92, 118]

export default function Home() {
  return (
    <div className="space-y-6 pb-8">
      {/* Hero overview card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Portfolio overview</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Operating view for the next investment cycle
              </h1>
            </div>

            <div className="flex items-center gap-3 self-start rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Live portfolio signal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI stat cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                    stat.tone === 'up'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700',
                  ].join(' ')}
                >
                  {stat.change}
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Chart + side panels */}
      <section className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
        {/* Portfolio momentum chart */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Portfolio momentum</h2>
            </div>
            <Button variant="outline" size="sm">
              90d view
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {pipeline.map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J'][index]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Focus areas */}
          <Card size="sm">
            <CardContent>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Focus areas</p>
              <div className="mt-5 space-y-4">
                {[
                  ['Fundraising readiness', '82%'],
                  ['Governance health', '74%'],
                  ['Exposure monitoring', '91%'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                      <span>{label}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                        style={{ width: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority action — intentional dark surface */}
          <Card size="sm" className="bg-foreground text-background border-transparent shadow-none">
            <CardContent>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Priority action</p>
              <h3 className="mt-3 text-xl font-semibold">Investor report due in 4 days</h3>
              <p className="mt-2 text-sm text-slate-300">
                Three governance gaps still need attention before final sign-off.
              </p>
              <Button size="sm" className="mt-5">
                Review checklist
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
