import { BookOpen, Briefcase, GraduationCap, Lightbulb, ArrowRight } from 'lucide-react'
import type { Pathway } from '../blogData'

function PathIcon({ icon }: { icon: Pathway['icon'] }) {
  if (icon === 'learner') return <GraduationCap className="h-5 w-5" />
  if (icon === 'mentor') return <Lightbulb className="h-5 w-5" />
  if (icon === 'jobs') return <Briefcase className="h-5 w-5" />
  return <BookOpen className="h-5 w-5" />
}

export function PathwayCards({ pathways, onSelect }: { pathways: Pathway[], onSelect?: (query: string) => void }) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Goal-based navigation</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Start with your goal</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pathways.map((path) => (
          <article
            key={path.id}
            onClick={() => onSelect && onSelect(path.title)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
                <PathIcon icon={path.icon} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-black tracking-tight text-slate-950">{path.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{path.description}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{path.articleCount} articles</span>
                <span>{path.progress}% complete</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${path.progress}%` }} />
              </div>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600"
            >
              Explore path
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
