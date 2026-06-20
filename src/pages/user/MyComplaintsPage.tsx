import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Flag, Inbox, Plus, Search } from 'lucide-react'

import { complaintsApi } from '@/api/complaintsApi'
import { useI18n } from '@/i18n/I18nProvider'
import { complaintPriorityKeys, complaintStatusKeys } from '@/i18n/status'
import { useAuthStore } from '@/store/authStore'
import { useComplaintStore } from '@/store/complaintStore'
import {
  ComplaintResponse,
  ComplaintStatus,
  complaintPriorityBucket,
} from '@/types'
import { formatDateTime } from '@/utils/formatters'

const PAGE_SIZE = 10

type StatusFilter = '' | ComplaintStatus

export default function MyComplaintsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [search, setSearch] = useState('')

  const userId = useAuthStore((s) => s.user?.userId)
  const cachedComplaints = useComplaintStore((s) => s.myComplaints)

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    ['my-complaints', userId, page, statusFilter],
    () =>
      complaintsApi.getMyComplaints(userId!, {
        page,
        size: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    { enabled: !!userId, keepPreviousData: true },
  )

  const filteredContent = useMemo(() => {
    const apiItems = data?.content ?? []
    const merged = isError ? cachedComplaints : mergeDedup(apiItems, cachedComplaints)
    const query = search.trim().toLowerCase()
    if (!query) return merged
    return merged.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    )
  }, [data?.content, cachedComplaints, search, isError])

  const showCachedFallback = isError && cachedComplaints.length > 0
  const showError = isError && cachedComplaints.length === 0 && filteredContent.length === 0
  const showLoading = isLoading && cachedComplaints.length === 0 && filteredContent.length === 0
  const showEmpty = !showLoading && !showError && filteredContent.length === 0

  const matchedCount = filteredContent.length
  const startIndex = matchedCount === 0 ? 0 : page * PAGE_SIZE + 1
  const endIndex = Math.min((page + 1) * PAGE_SIZE, matchedCount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('mentee.complaints.title')}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('mentee.complaints.subtitle')}
          </p>
        </div>
        <Link
          to="/profile/complaints/new"
          className="inline-flex items-center gap-2 self-start rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 dark:shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          {t('mentee.complaints.new')}
        </Link>
      </div>

      {showCachedFallback && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-400">
          Server đang bảo trì. Hiển thị danh sách khiếu nại từ bộ nhớ tạm.
          <button type="button" onClick={() => refetch()} className="ml-2 underline font-bold">Thử lại</button>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('mentee.complaints.searchPlaceholder')}
              className="w-full rounded-2xl border border-transparent bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-indigo-500/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(0)
              setStatusFilter(event.target.value as StatusFilter)
            }}
            className="rounded-2xl border border-transparent bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 focus:border-indigo-500/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-800 dark:text-slate-300 dark:focus:bg-slate-900"
          >
            <option value="">{t('mentee.complaints.filter.all')}</option>
            <option value={ComplaintStatus.OPEN}>
              {t(complaintStatusKeys[ComplaintStatus.OPEN])}
            </option>
            <option value={ComplaintStatus.INVESTIGATING}>
              {t(complaintStatusKeys[ComplaintStatus.INVESTIGATING])}
            </option>
            <option value={ComplaintStatus.RESOLVED}>
              {t(complaintStatusKeys[ComplaintStatus.RESOLVED])}
            </option>
            <option value={ComplaintStatus.CLOSED}>
              {t(complaintStatusKeys[ComplaintStatus.CLOSED])}
            </option>
          </select>
        </div>

        {showError ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
              <Flag className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {t('mentee.complaints.error.title')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-400"
            >
              {t('mentee.complaints.error.retry')}
            </button>
          </div>
        ) : showLoading ? (
          <Skeleton />
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {t('mentee.complaints.empty.title')}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('mentee.complaints.empty.description')}
            </p>
            <Link
              to="/profile/complaints/new"
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
            >
              <Plus className="w-4 h-4" />
              {t('mentee.complaints.new')}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredContent.map((complaint) => (
              <ComplaintItem key={complaint.id} complaint={complaint} />
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400">
            {t('mentee.complaints.pagination.summary', {
              from: startIndex,
              to: endIndex,
              total: matchedCount,
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0 || isFetching}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              {t('mentee.complaints.pagination.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={(data?.last ?? true) || isFetching}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              {t('mentee.complaints.pagination.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function mergeDedup(
  apiItems: ComplaintResponse[],
  cached: ComplaintResponse[],
): ComplaintResponse[] {
  const seen = new Set(apiItems.map((item) => item.id))
  const extra = cached.filter((item) => !seen.has(item.id))
  return [...apiItems, ...extra]
}

function ComplaintItem({ complaint }: { complaint: ComplaintResponse }) {
  const { t } = useI18n()
  const bucket = complaintPriorityBucket(complaint.priorityLevel)

  return (
    <li className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
          {complaint.title}
        </p>
        <p className="mt-1 line-clamp-2 max-w-2xl text-xs font-medium text-slate-500 dark:text-slate-400">
          {complaint.description}
        </p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {t('mentee.complaints.submittedAt', {
            date: formatDateTime(complaint.createdAt),
          })}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
        <span className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {complaint.complaintCategory || '—'}
        </span>
        <span className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t(complaintPriorityKeys[bucket])}
        </span>
        <span className="inline-flex rounded-xl bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t(complaintStatusKeys[complaint.status])}
        </span>
      </div>
    </li>
  )
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 px-6 py-5">
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  )
}
