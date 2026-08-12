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
    <section className="mt-8 rounded-[28px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500">
        <SearchX className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">Không tìm thấy bài viết nào</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
        Chúng tôi không tìm thấy kết quả cho tab <strong>{activeTab}</strong>
        {query ? <> với từ khóa <strong>&ldquo;{query}&rdquo;</strong></> : null}. Hãy thử một chủ đề rộng hơn hoặc đặt lại bộ lọc.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 hover:text-emerald-600 dark:text-emerald-500"
      >
        <RotateCcw className="h-4 w-4" />
        Reset filters
      </button>
    </section>
  )
}
