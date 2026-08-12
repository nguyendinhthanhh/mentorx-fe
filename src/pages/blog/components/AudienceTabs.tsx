import type { BlogTab } from '../blogData'

export function AudienceTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: BlogTab[]
  activeTab: BlogTab
  onChange: (tab: BlogTab) => void
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="scrollbar-hide -mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                active
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
