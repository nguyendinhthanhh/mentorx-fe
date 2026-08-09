import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface PendingItem {
  label: string
  count: number | string
  href: string
  icon: ReactNode
  tone: 'amber' | 'rose' | 'blue' | 'emerald'
}

interface DashboardPendingCardProps {
  title: string
  subtitle?: string
  items: PendingItem[]
  isLoading?: boolean
  emptyLabel?: string
}

const toneMap: Record<string, { bg: string; text: string }> = {
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
}

export default function DashboardPendingCard({
  title,
  subtitle,
  items,
  isLoading,
  emptyLabel,
}: DashboardPendingCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="flex-1 h-4 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-10 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {emptyLabel || 'No items'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item, i) => {
            const t = toneMap[item.tone]
            return (
              <Link
                key={`${item.href}-${i}`}
                to={item.href}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{item.count}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
