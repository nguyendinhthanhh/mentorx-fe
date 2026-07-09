import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Inbox,
  Search,
} from 'lucide-react'

import { complaintsApi } from '@/api/complaintsApi'
import { useI18n } from '@/i18n/I18nProvider'
import { complaintPriorityKeys, complaintStatusKeys } from '@/i18n/status'
import {
  ComplaintResponse,
  ComplaintStatus,
  complaintPriorityBucket,
} from '@/types'
import { formatDateTime } from '@/utils/formatters'

const PAGE_SIZE = 10

type StatusFilter = '' | ComplaintStatus

type PriorityBucket = ReturnType<typeof complaintPriorityBucket>

function priorityClass(bucket: PriorityBucket): string {
  switch (bucket) {
    case 'urgent':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
    case 'high':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
    case 'medium':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
    case 'low':
      return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

function statusClass(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.OPEN:
    case ComplaintStatus.AWAITING_RESPONSE:
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
    case ComplaintStatus.INVESTIGATING:
    case ComplaintStatus.EVIDENCE_REVIEW:
    case ComplaintStatus.IN_MEDIATION:
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    case ComplaintStatus.RESOLVED:
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    case ComplaintStatus.CLOSED:
      return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    case ComplaintStatus.WITHDRAWN:
    case ComplaintStatus.EXPIRED:
      return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

function priorityIconColor(bucket: PriorityBucket): string {
  if (bucket === 'urgent' || bucket === 'high') {
    return 'bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30'
  }
  if (bucket === 'medium') {
    return 'bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30'
  }
  return 'bg-slate-50 text-slate-500 border-slate-100 dark:border-slate-700'
}

const STATUS_OPTIONS: ComplaintStatus[] = [
  ComplaintStatus.OPEN,
  ComplaintStatus.AWAITING_RESPONSE,
  ComplaintStatus.INVESTIGATING,
  ComplaintStatus.EVIDENCE_REVIEW,
  ComplaintStatus.IN_MEDIATION,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.CLOSED,
  ComplaintStatus.WITHDRAWN,
  ComplaintStatus.EXPIRED,
]

export default function AdminComplaintsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    ['admin-complaints', page, statusFilter],
    () =>
      complaintsApi.getAdminQueue({
        page,
        size: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    { keepPreviousData: true },
  )

  const filteredContent = useMemo(() => {
    const items = data?.content ?? []
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.complainantId.toLowerCase().includes(query),
    )
  }, [data?.content, search])

  const matchedCount = filteredContent.length
  const startIndex = matchedCount === 0 ? 0 : page * PAGE_SIZE + 1
  const endIndex = Math.min((page + 1) * PAGE_SIZE, matchedCount)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            {t('admin.complaints.title')}
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500">
            {t('admin.complaints.subtitle')}
          </p>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-white/50 dark:border-slate-700/50 shadow-sm">
          {t('admin.complaints.queue')}
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-white/50 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none overflow-hidden transition-all">
        <div className="flex flex-col gap-4 border-b border-slate-100/50 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center">
          <div className="relative flex-1 group">
            <Search className="pointer-events-none absolute left-5 top-1/2 w-5 h-5 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.complaints.searchPlaceholder')}
              className="w-full rounded-2xl border border-slate-200/60 bg-white/50 py-3.5 pl-14 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(0)
              setStatusFilter(event.target.value as StatusFilter)
            }}
            className="rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-3.5 text-sm font-bold text-slate-600 focus:border-indigo-500/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300 dark:focus:bg-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer outline-none appearance-none min-w-[200px]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">{t('admin.complaints.filter.all')}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {t(complaintStatusKeys[status])}
              </option>
            ))}
          </select>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {t('admin.complaints.error.title')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-2xl bg-gray-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-600 dark:bg-white dark:text-gray-900 dark:hover:bg-primary-400"
            >
              {t('admin.complaints.error.retry')}
            </button>
          </div>
        ) : isLoading ? (
          <ComplaintsSkeleton />
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {t('admin.complaints.empty.title')}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('admin.complaints.empty.description')}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100/50 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800/50 dark:bg-slate-800/30 dark:text-slate-500">
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.title')}
                  </th>
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.complainant')}
                  </th>
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.category')}
                  </th>
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.priority')}
                  </th>
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.status')}
                  </th>
                  <th className="px-8 py-5 text-left">
                    {t('admin.complaints.column.updatedAt')}
                  </th>
                  <th className="px-8 py-5 text-right">
                    {t('admin.complaints.column.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {filteredContent.map((complaint) => (
                  <ComplaintRow key={complaint.id} complaint={complaint} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100/50 px-8 py-6 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-800/20">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
            {t('admin.complaints.pagination.summary', {
              from: startIndex,
              to: endIndex,
              total: matchedCount,
            })}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0 || isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 dark:hover:border-indigo-800/50"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('admin.complaints.pagination.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={(data?.last ?? true) || isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 dark:hover:border-indigo-800/50"
            >
              {t('admin.complaints.pagination.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComplaintRow({ complaint }: { complaint: ComplaintResponse }) {
  const { t } = useI18n()
  const bucket = complaintPriorityBucket(complaint.priorityLevel)

  return (
    <tr className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80">
      <td className="px-8 py-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${priorityIconColor(bucket)} shadow-sm group-hover:scale-105 transition-transform`}
          >
            <Flag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {complaint.title}
            </p>
            <p className="mt-1 line-clamp-2 max-w-md text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {complaint.description}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 align-top">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {complaint.complainantId}
        </p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {formatDateTime(complaint.createdAt)}
        </p>
      </td>
      <td className="px-8 py-5 align-top">
        <span className="inline-flex rounded-xl bg-white/50 border border-slate-200/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300 shadow-sm">
          {complaint.complaintCategory || '—'}
        </span>
      </td>
      <td className="px-8 py-5 align-top">
        <span
          className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${priorityClass(bucket)} border ${bucket === 'urgent' || bucket === 'high' ? 'border-rose-200/60 dark:border-rose-800/30' : bucket === 'medium' ? 'border-amber-200/60 dark:border-amber-800/30' : 'border-slate-200/60 dark:border-slate-700/60'}`}
        >
          {t(complaintPriorityKeys[bucket])}
          <span className="ml-1 opacity-60 font-bold">L{complaint.priorityLevel}</span>
        </span>
      </td>
      <td className="px-8 py-5 align-top">
        <span
          className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent ${statusClass(complaint.status)}`}
        >
          {t(complaintStatusKeys[complaint.status])}
        </span>
      </td>
      <td className="px-8 py-5 align-top text-xs font-medium text-slate-500 dark:text-slate-400">
        {formatDateTime(complaint.updatedAt)}
      </td>
      <td className="px-8 py-5 align-top text-right">
        <Link
          to={`/admin/complaints/${complaint.id}`}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-white hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-indigo-800/50 dark:hover:text-indigo-400"
        >
          {t('admin.complaints.detail.view')}
        </Link>
      </td>
    </tr>
  )
}

function ComplaintsSkeleton() {
  return (
    <div className="divide-y divide-gray-50 dark:divide-gray-800">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 px-6 py-5">
          <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
