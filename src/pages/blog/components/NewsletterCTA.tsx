import { Mail, Send } from 'lucide-react'

export function NewsletterCTA({
  email,
  error,
  status,
  onEmailChange,
  onSubmit,
}: {
  email: string
  error: string
  status: 'idle' | 'ok'
  onEmailChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-indigo-300/40 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="absolute -left-16 -top-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute -right-10 -bottom-10 h-52 w-52 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-indigo-100">
            <Mail className="h-3.5 w-3.5" />
            Weekly Digest
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Get the Mentor X Weekly Digest</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100/90">
            No spam. Just practical mentoring, career, and learning insights.
          </p>
        </div>

        <div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@company.com"
                className="h-11 w-full rounded-xl border border-white/20 bg-white/95 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/40"
              />
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-white px-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-50"
              >
                Subscribe
                <Send className="h-4 w-4" />
              </button>
            </div>
            {error ? <p className="mt-2 text-xs font-bold text-rose-200">{error}</p> : null}
            {status === 'ok' ? <p className="mt-2 text-xs font-bold text-emerald-200">Thanks! You are subscribed.</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
