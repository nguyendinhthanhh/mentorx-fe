import { Link } from 'react-router-dom'
import { Flame, Quote, Compass } from 'lucide-react'
import type { BlogContributor, StartHereLink } from '../blogData'

export function HandbookSidebar({
  topics,
  contributors,
  startHere,
  onTopicSelect,
}: {
  topics: string[]
  contributors: BlogContributor[]
  startHere: StartHereLink[]
  onTopicSelect: (topic: string) => void
}) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-8">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Chủ đề phổ biến</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicSelect(topic)}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-900/30 hover:text-emerald-600 dark:text-emerald-500"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Quote className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Người đóng góp hàng đầu</h3>
        </div>
        <div className="space-y-4">
          {contributors.map((contributor) => (
            <article key={contributor.id} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
              <img
                src={contributor.avatar}
                alt={contributor.name}
                className="h-11 w-11 rounded-full bg-slate-100 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{contributor.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{contributor.role}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">{contributor.articleCount} guides published</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Bắt đầu từ đây</h3>
        </div>
        <ol className="space-y-4">
          {startHere.map((item, index) => (
            <li key={item.slug} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                {index + 1}
              </span>
              <Link to={`/blog/${item.slug}`} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 transition hover:text-emerald-600 dark:text-emerald-500">
                {item.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}
