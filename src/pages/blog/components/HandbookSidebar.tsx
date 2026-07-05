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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Popular topics</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicSelect(topic)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Quote className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Top contributors</h3>
        </div>
        <div className="space-y-4">
          {contributors.map((contributor) => (
            <article key={contributor.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <img
                src={contributor.avatar}
                alt={contributor.name}
                className="h-11 w-11 rounded-full bg-slate-100 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{contributor.name}</p>
                <p className="truncate text-xs text-slate-500">{contributor.role}</p>
                <p className="mt-1 text-xs font-semibold text-indigo-600">{contributor.articleCount} guides published</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Start here</h3>
        </div>
        <ol className="space-y-4">
          {startHere.map((item, index) => (
            <li key={item.slug} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                {index + 1}
              </span>
              <Link to={`/blog/${item.slug}`} className="text-sm leading-relaxed text-slate-700 transition hover:text-indigo-600">
                {item.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}
