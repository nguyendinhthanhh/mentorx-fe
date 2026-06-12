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
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2 pb-1 sm:flex-nowrap sm:overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`inline-flex h-10 items-center rounded-xl px-4 text-sm font-bold transition sm:shrink-0 ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </div>
  )
}
