import { Link } from 'react-router-dom'
import { Clock3, Search, Sparkles } from 'lucide-react'
import type { BlogPost } from '../blogData'

export function BlogHero({
  query,
  onQueryChange,
  onChipSelect,
  todayGuide,
}: {
  query: string
  onQueryChange: (value: string) => void
  onChipSelect: (value: string) => void
  todayGuide: BlogPost
}) {
  const quickTopics = ['Mentoring', 'Career', 'Proposals', 'Courses', 'Escrow', 'Freelance']

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200/80 bg-[#f6f5f1]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_5%,rgba(59,130,246,0.14),transparent_36%),radial-gradient(circle_at_92%_8%,rgba(99,102,241,0.14),transparent_34%)]" />
      <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute -right-10 top-10 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-[560px] max-w-[1240px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-8 lg:py-16">
        <div className="self-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.17em] text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Mentor X Handbook
          </span>

          <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
            Learn faster.
            <br />
            Grow with mentors.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Practical guides for choosing mentors, building skills, launching courses, writing proposals, and growing your career.
          </p>

          <label className="relative mt-8 block max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search guides, topics, and insights..."
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.06)] outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {quickTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => onChipSelect(topic)}
                className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <article className="relative self-end overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="relative h-[260px] overflow-hidden">
            <img src={todayGuide.coverImage} alt={todayGuide.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-800">
              Today&apos;s Guide
            </span>
          </div>
          <div className="p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">{todayGuide.category}</p>
            <h2 className="mt-3 text-2xl font-black leading-8 tracking-tight text-slate-950">{todayGuide.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{todayGuide.excerpt}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <span>
                {todayGuide.author} · {todayGuide.authorRole}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {todayGuide.readTime}
              </span>
            </div>
            <Link
              to={`/blog/${todayGuide.slug}`}
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-indigo-600"
            >
              Read guide
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
