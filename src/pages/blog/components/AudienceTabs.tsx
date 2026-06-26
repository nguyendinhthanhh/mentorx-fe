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
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-6 overflow-x-auto hide-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                active
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
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
