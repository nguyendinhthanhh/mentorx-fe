import { Search } from 'lucide-react'

export function BlogHero({
  query,
  quickTopics,
  onQueryChange,
  onChipSelect,
}: {
  query: string
  quickTopics: string[]
  onQueryChange: (value: string) => void
  onChipSelect: (value: string) => void
}) {
  return (
    <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Handbook & Guides
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Practical guides for choosing mentors, building skills, and growing your career.
            </p>
          </div>

          <div className="w-full shrink-0 md:max-w-sm lg:max-w-md">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search guides, topics..."
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-emerald-600 focus:bg-white dark:bg-slate-950 focus:ring-1 focus:ring-emerald-600"
              />
            </label>
            <div className="scrollbar-hide mt-2.5 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400">Popular:</span>
              {quickTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => onChipSelect(topic)}
                  className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
