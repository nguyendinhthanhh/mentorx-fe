import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useViewTimeline } from '@/hooks/useAnalytics'
import { ViewGranularity } from '@/api/analyticsApi'

const GRANULARITY_OPTIONS: { value: ViewGranularity; label: string }[] = [
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
]

interface ViewTimelineChartProps {
  targetType: string
  targetId: string | undefined
}

export default function ViewTimelineChart({ targetType, targetId }: ViewTimelineChartProps) {
  const [granularity, setGranularity] = useState<ViewGranularity>('DAY')
  const { data: timeline, isLoading } = useViewTimeline(targetType, targetId, granularity)

  if (!targetId) return null

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black text-slate-950">Views over time</h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGranularity(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                granularity === opt.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-100" />
      ) : timeline && timeline.timeline.length > 0 ? (
        <div className="mt-4">
          <div className="mb-3 flex items-baseline gap-4">
            <span className="text-2xl font-black text-slate-950">{timeline.totalViews.toLocaleString()}</span>
            <span className="text-sm font-medium text-slate-500">total views</span>
            <span className="text-sm font-medium text-slate-500">·</span>
            <span className="text-sm font-medium text-slate-500">{timeline.uniqueViewers.toLocaleString()} unique</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={timeline.timeline.map((b) => ({ date: formatLabel(b.date), views: b.totalViews, unique: b.uniqueViewers }))}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }}
                formatter={(value: any, name: any) => [Number(value).toLocaleString(), name === 'views' ? 'Total' : 'Unique']}
              />
              <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unique" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 text-center text-sm font-medium text-slate-400">
          No view data available for this period.
        </div>
      )}
    </section>
  )
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
