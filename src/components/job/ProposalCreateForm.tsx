import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { AlertCircle, Bookmark, CheckCircle, Edit2, FileText, Loader2, Save, Trash2 } from 'lucide-react'

import { proposalApi } from '@/api/proposalApi'
import { useI18n } from '@/i18n/I18nProvider'
import { proposalStatusKeys } from '@/i18n/status'
import { BudgetType, JobType, ProposalResponse, ProposalStatus } from '@/types'

type ProposalFormData = {
  coverLetter: string
  proposedAmount: number
  deadlineAt?: string
  relevantExperience?: string
}

const optionalDateTime = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  return value
}, z.string().optional())

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}

const normalizeDateTimeLocalValue = (value?: string | null) => {
  if (!value) return undefined
  return value.length === 16 ? `${value}:00` : value
}

const MAX_PROPOSAL_SUBMISSIONS_PER_JOB = 5

const isProposalDirectlyEditable = (status?: ProposalStatus) => status === ProposalStatus.DRAFT || status === ProposalStatus.WITHDRAWN

const getSubmissionCount = (proposal?: ProposalResponse | null) => proposal?.submissionCount ?? 0

const getRemainingSubmissions = (proposal?: ProposalResponse | null) =>
  Math.max(MAX_PROPOSAL_SUBMISSIONS_PER_JOB - getSubmissionCount(proposal), 0)

const canWithdrawProposal = (status?: ProposalStatus) =>
  Boolean(status) &&
  ![
    ProposalStatus.ACCEPTED,
    ProposalStatus.WITHDRAWN,
    ProposalStatus.REJECTED,
    ProposalStatus.AUTO_CLOSED,
    ProposalStatus.CONTRACT_CANCELLED,
  ].includes(status!)

interface Props {
  jobId: string
  mentorId: string
  jobType: JobType
  budgetType?: BudgetType
  clientBudget?: number
  clientDeadline?: string
  onSuccess?: () => void
  onCancel?: () => void
  forceEditMode?: boolean
}

export default function ProposalCreateForm({
  jobId,
  mentorId,
  jobType,
  budgetType,
  clientBudget,
  clientDeadline,
  onSuccess,
  onCancel,
  forceEditMode = false,
}: Props) {
  const { t, language } = useI18n()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const proposalSchema = useMemo(
    () =>
      z.object({
        coverLetter: z.string().min(10, t('jobs.proposalForm.validation.coverLetterMin')),
        proposedAmount: z.coerce.number().min(1, t('jobs.proposalForm.validation.amountMin')),
        deadlineAt: optionalDateTime,
        relevantExperience: z.string().optional(),
      }).superRefine((value, ctx) => {
        const normalizedDeadline = normalizeDateTimeLocalValue(value.deadlineAt)
        if (!normalizedDeadline) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deadlineAt'],
            message: t('jobs.proposalForm.validation.deadlineRequired'),
          })
          return
        }

        const deadline = new Date(normalizedDeadline)
        if (Number.isNaN(deadline.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deadlineAt'],
            message: t('jobs.proposalForm.validation.deadlineRequired'),
          })
          return
        }

        if (deadline.getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deadlineAt'],
            message: t('jobs.proposalForm.validation.deadlineFuture'),
          })
          return
        }

        if (clientDeadline && deadline.getTime() > new Date(clientDeadline).getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deadlineAt'],
            message: t('jobs.proposalForm.validation.deadlineBeforeClient'),
          })
        }
      }),
    [clientDeadline, t]
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingProposal, setExistingProposal] = useState<ProposalResponse | null>(null)
  const [isEditing, setIsEditing] = useState(forceEditMode)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  })

  const handleUseSuggestedTemplate = () => {
    setValue('coverLetter', t('jobs.proposalForm.template.suggested'), { shouldValidate: true })
    toast.success(t('jobs.proposalForm.toast.suggestedApplied'))
  }

  const handleSaveMyTemplate = () => {
    const currentText = watch('coverLetter')
    if (!currentText || currentText.length < 10) {
      toast.error(t('jobs.proposalForm.toast.writeLonger'))
      return
    }

    localStorage.setItem('mentorx_my_proposal_template', currentText)
    toast.success(t('jobs.proposalForm.toast.templateSaved'))
  }

  const handleUseMyTemplate = () => {
    const saved = localStorage.getItem('mentorx_my_proposal_template')
    if (saved) {
      setValue('coverLetter', saved, { shouldValidate: true })
      toast.success(t('jobs.proposalForm.toast.savedApplied'))
      return
    }

    toast.error(t('jobs.proposalForm.toast.noSavedTemplate'))
  }

  const currentAmount = watch('proposedAmount') || 0
  const selectedDeadlineAt = watch('deadlineAt')

  const calculateFee = (amount: number) => {
    if (!amount || amount <= 0) return { fee: 0, label: t('jobs.proposalForm.fee.none') }
    if (amount < 100) return { fee: 5, label: t('jobs.proposalForm.fee.fixed', { amount: 5 }) }
    if (amount < 300) return { fee: amount * 0.09, label: t('jobs.proposalForm.fee.percent', { rate: 9 }) }
    if (amount < 800) return { fee: amount * 0.08, label: t('jobs.proposalForm.fee.percent', { rate: 8 }) }
    if (amount < 1500) return { fee: amount * 0.07, label: t('jobs.proposalForm.fee.percent', { rate: 7 }) }
    if (amount < 3000) return { fee: amount * 0.06, label: t('jobs.proposalForm.fee.percent', { rate: 6 }) }

    let fee = amount * 0.05
    let label = t('jobs.proposalForm.fee.percent', { rate: 5 })

    if (fee > 300) {
      fee = 300
      label = t('jobs.proposalForm.fee.capped', { max: 300 })
    }

    return { fee, label }
  }

  const feeInfo = calculateFee(currentAmount)
  const platformFee = feeInfo.fee
  const netAmount = currentAmount - platformFee
  const deadlineInputMin = toDateTimeLocalValue(new Date().toISOString())
  const deadlineInputMax = toDateTimeLocalValue(clientDeadline)

  useEffect(() => {
    const checkExistingProposal = async () => {
      try {
        setCheckingExisting(true)
        const proposal = await proposalApi.getByJobAndMentor(jobId, mentorId)
        if (proposal) {
          setExistingProposal(proposal)
          reset({
            coverLetter: proposal.coverLetter,
            proposedAmount: proposal.proposedAmount,
            deadlineAt: toDateTimeLocalValue(proposal.deadlineAt || clientDeadline),
            relevantExperience: proposal.relevantExperience || undefined,
          })
        } else {
          reset({
            proposedAmount: clientBudget || undefined,
            deadlineAt: toDateTimeLocalValue(clientDeadline),
          })
        }
      } catch (err) {
        console.error('Error checking existing proposal:', err)
      } finally {
        setCheckingExisting(false)
      }
    }

    checkExistingProposal()
  }, [clientBudget, clientDeadline, jobId, mentorId, reset])

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setLoading(true)
      setError('')

      if (existingProposal && getRemainingSubmissions(existingProposal) <= 0) {
        setIsEditing(false)
        setError(t('jobs.proposalForm.existing.resubmissionLimitReached', { max: MAX_PROPOSAL_SUBMISSIONS_PER_JOB }))
        return
      }

      if (existingProposal && !isProposalDirectlyEditable(existingProposal.status)) {
        setIsEditing(false)
        setError(t('jobs.proposalForm.existing.lockedSubmitted'))
        return
      }

      const payload = {
        jobId,
        mentorId,
        coverLetter: data.coverLetter,
        proposedAmount: data.proposedAmount,
        proposedHourlyRate: budgetType === BudgetType.HOURLY ? data.proposedAmount : undefined,
        deadlineAt: normalizeDateTimeLocalValue(data.deadlineAt),
        relevantExperience: data.relevantExperience,
      }

      const isDraftLikeStatus = existingProposal?.status === 'DRAFT' || existingProposal?.status === 'WITHDRAWN'

      if (existingProposal && isEditing) {
        await proposalApi.update(existingProposal.id, payload)

        if (isDraftLikeStatus) {
          await proposalApi.submit(existingProposal.id)
        }

        setIsEditing(false)
        const updated = await proposalApi.getByJobAndMentor(jobId, mentorId)
        setExistingProposal(updated)
        toast.success(isDraftLikeStatus ? t('jobs.proposalForm.toast.submitted') : t('jobs.proposalForm.toast.updated'))
      } else {
        const newProposal = await proposalApi.create(payload)
        await proposalApi.submit(newProposal.id)

        const submitted = await proposalApi.getByJobAndMentor(jobId, mentorId)
        setExistingProposal(submitted)
        toast.success(t('jobs.proposalForm.toast.submitted'))
      }

      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || t('jobs.proposalForm.error.submit'))
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!existingProposal) return

    try {
      setWithdrawing(true)
      setError('')
      const normalizedReason = withdrawReason.trim()
      if (normalizedReason.length < 10) {
        setError(t('jobs.proposalForm.withdraw.reasonMin'))
        return
      }

      await proposalApi.withdraw(existingProposal.id, normalizedReason)
      const withdrawnProposal = await proposalApi.getByJobAndMentor(jobId, mentorId)
      setExistingProposal(withdrawnProposal)
      setShowWithdrawConfirm(false)
      setWithdrawReason('')
      reset({
        coverLetter: withdrawnProposal?.coverLetter,
        proposedAmount: withdrawnProposal?.proposedAmount,
        deadlineAt: toDateTimeLocalValue(withdrawnProposal?.deadlineAt || clientDeadline),
        relevantExperience: withdrawnProposal?.relevantExperience || undefined,
      })
      toast.success(t('jobs.proposalForm.toast.withdrawn'))
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || t('jobs.proposalForm.error.withdraw'))
    } finally {
      setWithdrawing(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#4f46e5]" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('jobs.proposalForm.checkingExisting')}</p>
      </div>
    )
  }

  if (existingProposal && (!isEditing || !isProposalDirectlyEditable(existingProposal.status))) {
    const submissionCount = getSubmissionCount(existingProposal)
    const remainingSubmissions = getRemainingSubmissions(existingProposal)
    const hasSubmissionAttemptsLeft = remainingSubmissions > 0
    const canEditProposal = isProposalDirectlyEditable(existingProposal.status) && hasSubmissionAttemptsLeft
    const canWithdraw = canWithdrawProposal(existingProposal.status)
    const statusKey = proposalStatusKeys[existingProposal.status as ProposalStatus]
    const statusLabel = statusKey ? t(statusKey) : existingProposal.status
    const lockedCopy =
      existingProposal.status === ProposalStatus.WITHDRAWN && !hasSubmissionAttemptsLeft
        ? t('jobs.proposalForm.existing.resubmissionLimitReached', { max: MAX_PROPOSAL_SUBMISSIONS_PER_JOB })
        : t('jobs.proposalForm.existing.lockedSubmitted')

    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-xl shadow-slate-200/40 ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          {/* Header Area */}
          <div className="relative border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white p-6 sm:px-8 sm:py-7 dark:border-slate-800/60 dark:from-slate-900/80 dark:to-slate-900/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-500 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {t('jobs.proposalForm.existing.title')}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-400 dark:text-slate-300">
                      {t('jobs.proposalForm.existing.status')}: 
                    </span>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">
                  {t('jobs.proposalForm.existing.submittedAt')}:
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {new Date(existingProposal.submittedAt || existingProposal.createdAt).toLocaleString(locale)}
                </p>
                <p className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-300">
                  {t('jobs.proposalForm.existing.submissionUsage', {
                    count: submissionCount,
                    max: MAX_PROPOSAL_SUBMISSIONS_PER_JOB,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {submissionCount >= 3 && hasSubmissionAttemptsLeft && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:text-amber-100 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                <p>{t('jobs.proposalForm.existing.resubmissionWarning', { remaining: remainingSubmissions })}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Cover Letter */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400">
                  <FileText className="h-4 w-4" />
                  {t('jobs.proposalForm.existing.coverLetter')}
                </h4>
                <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 shadow-inner dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                  {existingProposal.coverLetter}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm ring-1 ring-slate-900/5 transition hover:border-emerald-200 dark:border-emerald-800/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/5 dark:hover:border-emerald-900/50">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400">
                    {t('jobs.proposalForm.existing.proposedAmount')}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-500 dark:text-emerald-400">
                    {existingProposal.proposedAmount != null
                      ? `${existingProposal.proposedAmount.toLocaleString(locale)} MXC`
                      : t('jobs.budgetTbd')}
                  </p>
                </div>

                {(existingProposal.estimatedDurationDays || existingProposal.deadlineAt) && (
                  <div className="flex flex-col justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm ring-1 ring-slate-900/5 transition hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/5 dark:hover:border-indigo-900/50">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400">
                      {existingProposal.deadlineAt
                        ? t('jobs.proposalForm.existing.deadline')
                        : t('jobs.proposalForm.existing.durationFallback')}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-500 dark:text-indigo-400">
                      {existingProposal.deadlineAt
                        ? new Date(existingProposal.deadlineAt).toLocaleString(locale)
                        : `${existingProposal.estimatedDurationDays} ${t('jobs.proposalForm.fields.days')}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!canEditProposal && (
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:text-amber-100 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                <p>{lockedCopy}</p>
              </div>
            )}

            {/* Actions */}
            {(canEditProposal || canWithdraw) && (
              <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 sm:flex-row dark:border-slate-800">
                {canEditProposal && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow"
                  >
                    <Edit2 className="h-4 w-4" />
                    {existingProposal.status === 'WITHDRAWN' ? t('jobs.proposalForm.action.reapply') : t('jobs.proposalForm.action.edit')}
                  </button>
                )}
                {canWithdraw && (
                  <button
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white dark:bg-slate-950 px-6 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-900/50 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('jobs.proposalForm.action.withdraw')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showWithdrawConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 p-6 shadow-2xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-slate-100">{t('jobs.proposalForm.withdraw.title')}</h3>
              <p className="mb-4 text-center text-sm text-slate-600 dark:text-slate-400">{t('jobs.proposalForm.withdraw.body')}</p>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('jobs.proposalForm.withdraw.reasonLabel')}
              </label>
              <textarea
                value={withdrawReason}
                onChange={(event) => setWithdrawReason(event.target.value)}
                rows={3}
                className="mb-4 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder={t('jobs.proposalForm.withdraw.reasonPlaceholder')}
              />
              {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWithdrawConfirm(false)
                    setWithdrawReason('')
                  }}
                  disabled={withdrawing}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || withdrawReason.trim().length < 10}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-700 disabled:bg-rose-400"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('jobs.proposalForm.withdraw.processing')}
                    </>
                  ) : (
                    t('jobs.proposalForm.withdraw.confirm')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-[#e2e6f5] dark:border-slate-800 px-4 py-3 text-sm font-medium transition-all focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#c7d2fe]/40'
  const labelClass = 'mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            {budgetType === BudgetType.HOURLY ? t('jobs.proposalForm.fields.hourlyRate') : t('jobs.proposalForm.fields.totalCost')}{' '}
            <span className="text-rose-500">*</span>
          </label>
          {clientBudget && (
            <p className="mb-2 mt-[-4px] text-[13px] text-slate-500 dark:text-slate-400">
              {t('jobs.proposalForm.fields.clientBudget')}:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-500">{clientBudget.toLocaleString(locale)} MXC</span>
            </p>
          )}
          <div className="relative">
            <input type="number" step="0.01" {...register('proposedAmount')} className={`${inputClass} pr-14`} placeholder="0.00" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm font-medium text-slate-400">MXC</div>
          </div>
          {errors.proposedAmount && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.proposedAmount.message}
            </p>
          )}
          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30 p-3 text-[13px]">
            <div className="mb-2 flex justify-between text-slate-500 dark:text-slate-400">
              <span>{feeInfo.label}</span>
              <span className="font-medium">- {platformFee.toLocaleString(locale)} MXC</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800/60 pt-2 font-bold text-slate-900 dark:text-slate-100">
              <span>{t('jobs.proposalForm.summary.netAmount')}</span>
              <span className="text-emerald-600 dark:text-emerald-500">{netAmount.toLocaleString(locale)} MXC</span>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            {t('jobs.proposalForm.fields.deadline')} <span className="text-rose-500">*</span>
          </label>
          {clientDeadline && (
            <p className="mb-2 mt-[-4px] text-[13px] text-slate-500 dark:text-slate-400">
              {t('jobs.proposalForm.fields.clientDeadline')}:{' '}
              <span className="font-bold text-blue-600">{new Date(clientDeadline).toLocaleString(locale)}</span>
            </p>
          )}
          <div>
            <input
              type="datetime-local"
              step={1}
              min={deadlineInputMin}
              max={deadlineInputMax}
              {...register('deadlineAt')}
              className={inputClass}
            />
            <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
              {selectedDeadlineAt
                ? `${t('jobs.proposalForm.fields.deadlinePreview')}: ${new Date(normalizeDateTimeLocalValue(selectedDeadlineAt) || selectedDeadlineAt).toLocaleString(locale)}`
                : t('jobs.proposalForm.fields.deadlineHelp')}
            </p>
          </div>
          {errors.deadlineAt && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.deadlineAt.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t('jobs.proposalForm.fields.coverLetter')} <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUseSuggestedTemplate}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-500 transition hover:text-emerald-700 dark:text-emerald-400"
            >
              <FileText className="h-3.5 w-3.5" /> {t('jobs.proposalForm.action.useSuggested')}
            </button>
            <button
              type="button"
              onClick={handleUseMyTemplate}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-700"
            >
              <Bookmark className="h-3.5 w-3.5" /> {t('jobs.proposalForm.action.useSaved')}
            </button>
          </div>
        </div>
        <textarea
          {...register('coverLetter')}
          rows={8}
          className={inputClass}
          placeholder={t('jobs.proposalForm.fields.coverLetterPlaceholder')}
        />
        {errors.coverLetter && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.coverLetter.message}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('jobs.proposalForm.fields.minimumChars')}</p>
          <button
            type="button"
            onClick={handleSaveMyTemplate}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:text-slate-800 dark:text-slate-200"
          >
            <Save className="h-3 w-3" /> {t('jobs.proposalForm.action.saveTemplate')}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">{t('jobs.proposalForm.error.title')}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isEditing ? t('jobs.proposalForm.action.updating') : t('jobs.proposalForm.action.submitting')}
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            {isEditing ? t('jobs.proposalForm.action.updateProposal') : t('jobs.proposalForm.action.submitProposal')}
          </>
        )}
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={() => {
            if (forceEditMode && onCancel) {
              onCancel()
            } else {
              setIsEditing(false)
              reset({
                coverLetter: existingProposal?.coverLetter,
                proposedAmount: existingProposal?.proposedAmount,
                deadlineAt: toDateTimeLocalValue(existingProposal?.deadlineAt || clientDeadline),
                relevantExperience: existingProposal?.relevantExperience || undefined,
              })
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-300"
        >
          {t('jobs.proposalForm.action.cancelEdit')}
        </button>
      )}
    </form>
  )
}
