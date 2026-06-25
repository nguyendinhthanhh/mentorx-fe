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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
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
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-500',
  }[tone]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon ? <div className={`flex h-5 w-5 items-center justify-center ${toneClasses}`}>{icon}</div> : null}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      {helper ? <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p> : null}
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
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg ${isError ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
        {isError ? <AlertCircle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-50" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-50" />
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
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ring-1 ${toneClasses}`}>
      {label}
    </span>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm ${props.className || ''}`}
    />
  )
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm ${props.className || ''}`}
    />
  )
}
