import { type ReactNode } from 'react'

interface DashboardPanelProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export default function DashboardPanel({
  title,
  subtitle,
  children,
  actions,
  className = '',
}: DashboardPanelProps) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
