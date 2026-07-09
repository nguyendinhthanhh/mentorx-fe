import { useQuery } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Inbox } from 'lucide-react'

import { complaintsApi } from '@/api/complaintsApi'
import { useI18n } from '@/i18n/I18nProvider'
import { complaintPriorityKeys, complaintStatusKeys } from '@/i18n/status'
import { complaintPriorityBucket } from '@/types'
import { formatDateTime } from '@/utils/formatters'

export default function AdminComplaintDetailPage() {
  const { id: complaintId } = useParams<{ id: string }>()
  const { t } = useI18n()

  const { data, isLoading, isError, refetch } = useQuery(
    ['admin-complaint-detail', complaintId],
    () => complaintsApi.getComplaintById(complaintId!),
    { enabled: Boolean(complaintId) },
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-24 text-center bg-white/70 dark:bg-slate-900/70 rounded-[2.5rem] border border-white/50 dark:border-slate-800 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-500 dark:bg-rose-950/40 shadow-sm border border-rose-100 dark:border-rose-900/30">
          <Flag className="w-7 h-7" />
        </div>
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
          {t('admin.complaints.error.title')}
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            to="/admin/complaints"
            className="rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5"
          >
            {t('admin.complaints.detail.back')}
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-500 shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            {t('admin.complaints.error.retry')}
          </button>
        </div>
      </div>
    )
  }

  const bucket = complaintPriorityBucket(data.priorityLevel)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-slate-800 shadow-sm px-4 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 dark:hover:text-indigo-400 hover:shadow-md transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.complaints.detail.back')}
        </Link>
      </div>

      <div className="rounded-[2.5rem] border border-white/50 bg-white/70 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none transition-all">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {t('admin.complaints.detail.idLabel', { id: data.id })}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {data.title}
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {t('admin.complaints.detail.createdAt', {
                date: formatDateTime(data.createdAt),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
            <span className="inline-flex rounded-xl bg-slate-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              {data.complaintCategory || '—'}
            </span>
            <span className="inline-flex rounded-xl bg-slate-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              {t(complaintPriorityKeys[bucket])}
            </span>
            <span className="inline-flex rounded-xl bg-slate-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              {t(complaintStatusKeys[data.status])}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {t('admin.complaints.detail.description')}
          </p>
          <div className="mt-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 p-6 border border-slate-100/50 dark:border-slate-800/50">
            <p className="whitespace-pre-line text-sm font-medium leading-loose text-slate-700 dark:text-slate-300">
              {data.description}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-100/50 pt-8 dark:border-slate-800/50 md:grid-cols-3">
          <DetailField label={t('admin.complaints.detail.complainant')} value={data.complainantId} />
          <DetailField label={t('admin.complaints.detail.respondent')} value={data.respondentId} />
          <DetailField label={t('admin.complaints.detail.createdAtField')} value={formatDateTime(data.createdAt)} />
          <DetailField label={t('admin.complaints.detail.updatedAtField')} value={formatDateTime(data.updatedAt)} />
          {data.mediatorId && (
            <DetailField label={t('admin.complaints.detail.mediator')} value={data.mediatorId} />
          )}
          {data.sessionId && (
            <DetailField label={t('admin.complaints.detail.session')} value={data.sessionId} />
          )}
          {data.bookingId && (
            <DetailField label={t('admin.complaints.detail.booking')} value={data.bookingId} />
          )}
        </div>

        {data.evidence && data.evidence.length > 0 && (
          <div className="mt-8 border-t border-slate-100/50 pt-8 dark:border-slate-800/50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              {t('admin.complaints.detail.evidence')}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.evidence.map((evidence) => (
                <li
                  key={evidence.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/50 p-4 text-xs font-bold text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                    <Inbox className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{evidence.title}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 block">
                      {evidence.evidenceType}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1.5 break-all text-sm font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}
