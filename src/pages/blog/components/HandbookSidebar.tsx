import { Flame, Quote, Compass } from 'lucide-react'
import type { MentorInsight } from '../blogData'

export function HandbookSidebar({
  topics,
  insights,
  startHere,
  onTopicSelect,
}: {
  topics: string[]
  insights: MentorInsight[]
  startHere: string[]
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
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Mentor insights</h3>
        </div>
        <div className="space-y-4">
          {insights.map((insight) => (
            <article key={insight.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm italic leading-relaxed text-slate-700">&ldquo;{insight.quote}&rdquo;</p>
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-900">{insight.mentor}</p>
                <p className="text-xs text-slate-500">{insight.role}</p>
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
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-slate-700">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}
