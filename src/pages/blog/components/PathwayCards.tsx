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
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Learning Pathways</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {pathways.map((path) => (
          <article
            key={path.id}
            onClick={() => onSelect && onSelect(path.title)}
            className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
                <PathIcon icon={path.icon} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{path.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{path.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500">{path.articleCount} articles</span>
              <span className="text-indigo-600">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
