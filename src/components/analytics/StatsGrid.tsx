interface StatItem {
  label: string
  value: string | number
  helper?: string
}

interface StatsGridProps {
  title: string
  stats: StatItem[]
}

export default function StatsGrid({ title, stats }: StatsGridProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950 dark:text-slate-100">{stat.value}</p>
            {stat.helper && <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{stat.helper}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
