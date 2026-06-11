import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500">{eyebrow}</p> : null}
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = 'indigo',
}: {
  label: string
  value: ReactNode
  helper?: string
  icon?: ReactNode
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
}) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone]

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</div>
        </div>
        {icon ? <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses}`}>{icon}</div> : null}
      </div>
      {helper ? <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{helper}</p> : null}
    </div>
  )
}

export function StateCard({
  title,
  message,
  action,
  tone = 'slate',
}: {
  title: string
  message: string
  action?: ReactNode
  tone?: 'slate' | 'error'
}) {
  const isError = tone === 'error'
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${isError ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
        {isError ? <AlertCircle className="h-5 w-5" /> : <Loader2 className="h-5 w-5" />}
      </div>
      <h2 className="mt-4 text-base font-black text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function StatusPill({ label, tone = 'slate' }: { label: string; tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone]

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${toneClasses}`}>
      {label}
    </span>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${props.className || ''}`}
    />
  )
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${props.className || ''}`}
    />
  )
}
