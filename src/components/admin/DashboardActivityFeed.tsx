import { type ReactNode } from 'react'

interface ActivityItem {
  id: string
  avatar: string
  avatarColor: string
  body: ReactNode
  time: string
}

interface DashboardActivityFeedProps {
  title: string
  subtitle?: string
  items: ActivityItem[]
  isLoading?: boolean
  emptyLabel?: string
}

export default function DashboardActivityFeed({
  title,
  subtitle,
  items,
  isLoading,
  emptyLabel,
}: DashboardActivityFeedProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      {isLoading ? (
        <div className="px-4 py-2 divide-y divide-slate-100 dark:divide-slate-800">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5 py-2.5 animate-pulse">
              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {emptyLabel || 'No recent activity'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 px-4 py-1 dark:divide-slate-800">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2.5 py-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${item.avatarColor}, ${item.avatarColor}dd)` }}
              >
                {item.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</div>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
