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
    <aside className="space-y-4 xl:sticky xl:top-24">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="text-lg font-black tracking-tight text-slate-950">Popular topics</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicSelect(topic)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-indigo-600" />
          <h3 className="text-lg font-black tracking-tight text-slate-950">Mentor insights</h3>
        </div>
        <div className="mt-4 space-y-3">
          {insights.map((insight) => (
            <article key={insight.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm leading-6 text-slate-700">&ldquo;{insight.quote}&rdquo;</p>
              <p className="mt-2 text-xs font-bold text-slate-900">{insight.mentor}</p>
              <p className="text-xs text-slate-500">{insight.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-black tracking-tight text-slate-950">Start here</h3>
        </div>
        <ol className="mt-4 space-y-3">
          {startHere.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600">
                {index + 1}
              </span>
              <span className="text-sm leading-6 text-slate-700">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}
