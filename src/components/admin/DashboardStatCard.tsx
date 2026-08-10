import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'

type IconColor = 'teal' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface DashboardStatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: { value: string; direction: 'up' | 'down' }
  subtext?: string
  href?: string
  iconColor: IconColor
  sparkValues?: number[]
  isLoading?: boolean
}

const colorMap: Record<IconColor, { bg: string; text: string; spark: string }> = {
  teal:   { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', spark: 'bg-emerald-500' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', spark: 'bg-blue-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', spark: 'bg-green-500' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', spark: 'bg-amber-500' },
  red:    { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', spark: 'bg-rose-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', spark: 'bg-purple-500' },
}

export default function DashboardStatCard({
  icon,
  label,
  value,
  change,
  subtext,
  href,
  iconColor,
  sparkValues,
  isLoading,
}: DashboardStatCardProps) {
  const c = colorMap[iconColor]

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3.5 animate-pulse">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-6 w-24 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex items-end gap-0.5 h-7">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-1 rounded-sm bg-slate-100 dark:bg-slate-800" style={{ height: `${20 + Math.random() * 60}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const content = (
    <div className="flex items-center gap-3.5 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{value}</span>
          {change && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${change.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                {change.direction === 'up' ? <path d="M6 9V3M3 6l3-3 3 3" /> : <path d="M6 3v6M3 6l3 3 3-3" />}
              </svg>
              {change.value}
            </span>
          )}
        </div>
        {subtext && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtext}</p>}
      </div>
      {sparkValues && sparkValues.length > 0 && (
        <div className="flex items-end gap-0.5 h-7 shrink-0">
          {sparkValues.map((h, i) => {
            const opacity = 0.25 + (i / sparkValues.length) * 0.55
            return (
              <div
                key={i}
                className={`w-1 rounded-sm ${c.spark}`}
                style={{ height: `${Math.max(8, h)}%`, opacity }}
              />
            )
          })}
        </div>
      )}
    </div>
  )

  const className = 'block rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900'

  if (href) {
    return <Link to={href} className={className}>{content}</Link>
  }

  return <div className={className}>{content}</div>
}
