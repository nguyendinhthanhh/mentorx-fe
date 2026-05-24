import { SearchX, RotateCcw } from 'lucide-react'
import type { BlogTab } from '../blogData'

export function EmptyState({
  activeTab,
  query,
  onReset,
}: {
  activeTab: BlogTab
  query: string
  onReset: () => void
}) {
  return (
    <section className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <SearchX className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">No guides found</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        We couldn&apos;t find results for tab <strong>{activeTab}</strong>
        {query ? <> with keyword <strong>&ldquo;{query}&rdquo;</strong></> : null}. Try a broader topic or reset filters.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <RotateCcw className="h-4 w-4" />
        Reset filters
      </button>
    </section>
  )
}
