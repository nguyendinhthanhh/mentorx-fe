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
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
          <Flag className="w-6 h-6" />
        </div>
        <p className="text-sm font-black text-gray-900 dark:text-white">
          {t('admin.complaints.error.title')}
        </p>
        <div className="flex gap-2">
          <Link
            to="/admin/complaints"
            className="rounded-2xl border border-gray-100 bg-white px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {t('admin.complaints.detail.back')}
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-2xl bg-gray-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-600 dark:bg-white dark:text-gray-900 dark:hover:bg-primary-400"
          >
            {t('admin.complaints.error.retry')}
          </button>
        </div>
      </div>
    )
  }

  const bucket = complaintPriorityBucket(data.priorityLevel)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.complaints.detail.back')}
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {t('admin.complaints.detail.idLabel', { id: data.id })}
            </p>
            <h1 className="mt-2 text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {data.title}
            </h1>
            <p className="mt-1 text-xs font-bold text-gray-500">
              {t('admin.complaints.detail.createdAt', {
                date: formatDateTime(data.createdAt),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-xl bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {data.complaintCategory || '—'}
            </span>
            <span className="inline-flex rounded-xl bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {t(complaintPriorityKeys[bucket])}
            </span>
            <span className="inline-flex rounded-xl bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {t(complaintStatusKeys[data.status])}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {t('admin.complaints.detail.description')}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-gray-700 dark:text-gray-300">
            {data.description}
          </p>
        </div>

        <div className="mt-6 grid gap-4 border-t border-gray-50 pt-6 dark:border-gray-800 md:grid-cols-2">
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
          <div className="mt-6 border-t border-gray-50 pt-6 dark:border-gray-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {t('admin.complaints.detail.evidence')}
            </p>
            <ul className="mt-2 space-y-2">
              {data.evidence.map((evidence) => (
                <li
                  key={evidence.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300"
                >
                  <Inbox className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 truncate">{evidence.title}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {evidence.evidenceType}
                  </span>
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
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className="mt-1 break-all text-sm font-bold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  )
}
