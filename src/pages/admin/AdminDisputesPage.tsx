import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { AlertTriangle, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { chatApi } from '@/api/chatApi'
import { DisputeOutcome, disputeApi } from '@/api/disputeApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { DisputeResponse } from '@/types'
import { isAdmin } from '@/utils/roleRedirect'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const OUTCOMES: DisputeOutcome[] = [
  'FULL_REFUND',
  'PARTIAL_REFUND',
  'NO_REFUND',
  'FAVOR_INITIATOR',
  'FAVOR_RESPONDENT',
  'COMPROMISE',
  'MUTUAL_AGREEMENT',
  'ADDITIONAL_WORK_REQUIRED',
  'CONTRACT_CANCELLED',
  'INVALID_DISPUTE',
]

const needsRefundAmount = (outcome: DisputeOutcome) =>
  ['PARTIAL_REFUND', 'COMPROMISE', 'MUTUAL_AGREEMENT'].includes(outcome)

export default function AdminDisputesPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<DisputeResponse | null>(null)
  const [outcome, setOutcome] = useState<DisputeOutcome>('PARTIAL_REFUND')
  const [resolutionDetails, setResolutionDetails] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const queue = useQuery(['admin-dispute-queue', page], () => disputeApi.getQueue({ page, size: 15 }), {
    keepPreviousData: true,
  })

  useEffect(() => {
    if (!selected) return
    const refreshed = queue.data?.content.find((item) => item.id === selected.id)
    if (refreshed) setSelected(refreshed)
  }, [queue.data, selected?.id])

  const resolveMutation = useMutation(
    () =>
      disputeApi.resolve(selected!.id, {
        outcome,
        resolutionDetails: resolutionDetails.trim(),
        ...(needsRefundAmount(outcome) ? { refundAmountMxc: Number(refundAmount) } : {}),
      }),
    {
      onSuccess: (resolved) => {
        toast.success(t('admin.disputes.resolveSuccess'))
        setSelected(resolved)
        setResolutionDetails('')
        setRefundAmount('')
        void queryClient.invalidateQueries('admin-dispute-queue')
        void queryClient.invalidateQueries('admin-financial-summary')
        void queryClient.invalidateQueries('admin-wallet-transactions')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || t('admin.disputes.resolveFailed'))
      },
    }
  )

  const supportMutation = useMutation(
    (recipientId: string) => chatApi.resolveConversation({ recipientId, contextType: 'DISPUTE', contextId: selected!.id }),
    {
      onSuccess: () => navigate('/admin/support'),
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || t('admin.disputes.supportFailed'))
      },
    }
  )

  const canSubmit =
    resolutionDetails.trim().length >= 10 &&
    (!needsRefundAmount(outcome) || (Number(refundAmount) > 0 && Number.isFinite(Number(refundAmount))))

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-950 dark:text-white">
            <Scale className="h-6 w-6 text-indigo-600" />
            {t('admin.disputes.title')}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{t('admin.disputes.subtitle')}</p>
        </div>
        <button type="button" onClick={() => queue.refetch()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">
          <RefreshCw className={`h-4 w-4 ${queue.isFetching ? 'animate-spin' : ''}`} />
          {t('common.retry')}
        </button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {queue.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('common.loading')}</div>
          ) : queue.isError ? (
            <div className="p-8 text-center text-sm text-rose-600">{t('admin.disputes.loadFailed')}</div>
          ) : (queue.data?.content.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('admin.disputes.empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3">{t('admin.disputes.case')}</th>
                    <th className="px-4 py-3">{t('admin.disputes.parties')}</th>
                    <th className="px-4 py-3">{t('admin.disputes.escrow')}</th>
                    <th className="px-4 py-3">{t('admin.wallet.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {queue.data!.content.map((item) => (
                    <tr key={item.id} onClick={() => setSelected(item)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected?.id === item.id ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}`}>
                      <td className="px-4 py-3"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p></td>
                      <td className="px-4 py-3">{item.initiatorName} ↔ {item.respondentName}</td>
                      <td className="px-4 py-3 font-semibold">{item.disputedAmountMxc ? formatCurrency(item.disputedAmountMxc) : '—'}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm text-slate-500">{page + 1} / {Math.max(queue.data?.totalPages ?? 1, 1)}</span>
            <button type="button" disabled={page >= (queue.data?.totalPages ?? 1) - 1} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 dark:border-slate-800 dark:bg-slate-900">
          {!selected ? <p className="py-16 text-center text-sm text-slate-500">{t('admin.disputes.select')}</p> : (
            <div className="space-y-5">
              <div><p className="text-xs font-semibold uppercase text-slate-500">{selected.disputeCategory}</p><h2 className="mt-1 text-lg font-bold">{selected.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selected.description}</p></div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <CaseDetail label={t('admin.disputes.initiator')} value={selected.initiatorName} />
                <CaseDetail label={t('admin.disputes.respondent')} value={selected.respondentName} />
                <CaseDetail label={t('admin.disputes.requestedRefund')} value={selected.refundRequestedMxc ? formatCurrency(selected.refundRequestedMxc) : '—'} />
                <CaseDetail label={t('admin.disputes.fundsInEscrow')} value={selected.fundsInEscrow ? t('common.yes') : t('common.no')} />
              </dl>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={supportMutation.isLoading} onClick={() => supportMutation.mutate(selected.initiatorId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"><MessageSquare className="h-4 w-4" />{t('admin.disputes.messageInitiator')}</button>
                <button type="button" disabled={supportMutation.isLoading} onClick={() => supportMutation.mutate(selected.respondentId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"><MessageSquare className="h-4 w-4" />{t('admin.disputes.messageRespondent')}</button>
              </div>
              {selected.respondentResponse && <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="mb-1 font-semibold">{t('admin.disputes.response')}</p>{selected.respondentResponse}</div>}
              {(selected.evidenceUrls?.length ?? 0) > 0 && <div><p className="mb-2 text-sm font-semibold">{t('admin.disputes.evidence')}</p><ul className="space-y-1">{selected.evidenceUrls!.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-indigo-600 underline">{url}</a></li>)}</ul></div>}
              {selected.status === 'RESOLVED' ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200"><p className="font-semibold">{t('admin.disputes.resolved')}</p><p className="mt-1">{selected.resolutionDetails}</p>{selected.refundAmountMxc != null && <p className="mt-2 font-semibold">{t('admin.disputes.refund')}: {formatCurrency(selected.refundAmountMxc)}</p>}</div>
              ) : !isAdmin(user) ? (
                <div className="flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200"><AlertTriangle className="h-5 w-5 shrink-0" />{t('admin.disputes.moderatorReadOnly')}</div>
              ) : (
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <label className="block text-sm font-semibold">{t('admin.disputes.outcome')}<select value={outcome} onChange={(event) => setOutcome(event.target.value as DisputeOutcome)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">{OUTCOMES.map((value) => <option key={value} value={value}>{t(`admin.disputes.outcome.${value}`)}</option>)}</select></label>
                  {needsRefundAmount(outcome) && <label className="block text-sm font-semibold">{t('admin.disputes.refund')}<input type="number" min="0.01" step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>}
                  <label className="block text-sm font-semibold">{t('admin.disputes.resolutionDetails')}<textarea value={resolutionDetails} onChange={(event) => setResolutionDetails(event.target.value)} maxLength={2000} className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" /></label>
                  <button type="button" disabled={!canSubmit || resolveMutation.isLoading} onClick={() => resolveMutation.mutate()} className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{t('admin.disputes.resolve')}</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function CaseDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>
}
