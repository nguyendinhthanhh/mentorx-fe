import { BookOpen, Briefcase, GraduationCap, Lightbulb, ArrowRight } from 'lucide-react'
import type { BlogTrack } from '../blogData'

function PathIcon({ icon }: { icon: BlogTrack['icon'] }) {
  if (icon === 'learner') return <GraduationCap className="h-5 w-5" />
  if (icon === 'mentor') return <Lightbulb className="h-5 w-5" />
  if (icon === 'jobs') return <Briefcase className="h-5 w-5" />
  return <BookOpen className="h-5 w-5" />
}

export function PathwayCards({ pathways, onSelect }: { pathways: BlogTrack[], onSelect?: (query: string) => void }) {
  return (
    <section>
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Khám phá theo lộ trình</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {pathways.map((path) => (
          <article
            key={path.key}
            onClick={() => onSelect && onSelect(path.title)}
            className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-900/50 group-hover:text-emerald-700 dark:text-emerald-400">
                <PathIcon icon={path.icon} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors group-hover:text-emerald-600 dark:text-emerald-500">{path.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  Explore API-backed guides grouped under this track.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{path.articleCount} articles</span>
              <span className="text-emerald-600 dark:text-emerald-500">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
