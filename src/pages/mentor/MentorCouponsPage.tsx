import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import { AlertTriangle, Copy, Loader2, Pencil, Plus, Search, Ticket, Trash2, X } from 'lucide-react'
import { couponApi } from '@/api/couponApi'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { CouponEffectiveStatus, CouponResponse, CouponDiscountType } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingRows, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

type StatusFilter = 'ALL' | CouponEffectiveStatus

type ConfirmDelete = {
  couponId: string
  code: string
} | null

export default function MentorCouponsPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [coupons, setCoupons] = useState<CouponResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    void loadCoupons()
  }, [user?.userId])

  const loadCoupons = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const page = await couponApi.getMine({ page: 0, size: 100 })
      setCoupons(page.content || [])
    } catch (err: any) {
      setError(err.response?.data?.message || t('coupon.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  const deleteMutation = useMutation((couponId: string) => couponApi.remove(couponId), {
    onSuccess: () => loadCoupons(),
  })

  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return coupons.filter((coupon) => {
      const haystack = [coupon.code, coupon.description || ''].join(' ').toLowerCase()
      return (statusFilter === 'ALL' || coupon.effectiveStatus === statusFilter)
        && (!query || haystack.includes(query))
    })
  }, [coupons, searchQuery, statusFilter])

  const requestDelete = (coupon: CouponResponse, event: MouseEvent) => {
    event.stopPropagation()
    setConfirmDelete({ couponId: coupon.id, code: coupon.code })
  }

  const confirmDeleteCoupon = () => {
    if (!confirmDelete) return
    deleteMutation.mutate(confirmDelete.couponId, { onSuccess: () => setConfirmDelete(null) })
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 1500)
    } catch {
      // Clipboard access can be denied silently; nothing actionable to do here.
    }
  }

  const statusOptions: StatusFilter[] = [
    'ALL',
    CouponEffectiveStatus.ACTIVE,
    CouponEffectiveStatus.SCHEDULED,
    CouponEffectiveStatus.EXPIRED,
    CouponEffectiveStatus.DISABLED,
    CouponEffectiveStatus.LIMIT_REACHED,
  ]

  const statusLabel = (status: CouponEffectiveStatus) => {
    const map: Record<CouponEffectiveStatus, string> = {
      [CouponEffectiveStatus.ACTIVE]: t('coupon.statusActive'),
      [CouponEffectiveStatus.SCHEDULED]: t('coupon.statusScheduled'),
      [CouponEffectiveStatus.EXPIRED]: t('coupon.statusExpired'),
      [CouponEffectiveStatus.DISABLED]: t('coupon.statusDisabled'),
      [CouponEffectiveStatus.LIMIT_REACHED]: t('coupon.statusLimitReached'),
    }
    return map[status]
  }

  const statusTone = (status: CouponEffectiveStatus): 'emerald' | 'amber' | 'rose' | 'slate' => {
    if (status === CouponEffectiveStatus.ACTIVE) return 'emerald'
    if (status === CouponEffectiveStatus.SCHEDULED) return 'amber'
    if (status === CouponEffectiveStatus.EXPIRED || status === CouponEffectiveStatus.LIMIT_REACHED) return 'rose'
    return 'slate'
  }

  const discountLabel = (coupon: CouponResponse) => {
    if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
      return `${coupon.discountPercent ?? 0}%`
    }
    return formatCurrency(coupon.discountAmountMxc ?? 0)
  }

  return (
    <PageShell
      eyebrow={t('coupon.pageTitle')}
      title={t('coupon.pageTitle')}
      description={t('coupon.pageSubtitle')}
      actions={
        <Link
          to="/mentor/coupons/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          {t('coupon.createButton')}
        </Link>
      }
    >
      <Toolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('coupon.searchPlaceholder')}
            className="w-full pl-11"
          />
        </div>
        <SelectInput
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="w-full lg:w-52"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? t('coupon.statusAll') : statusLabel(status)}
            </option>
          ))}
        </SelectInput>
      </Toolbar>

      {loading ? (
        <LoadingRows rows={4} />
      ) : error ? (
        <StateCard
          tone="error"
          title={t('coupon.errorTitle')}
          message={error}
          action={
            <button onClick={loadCoupons} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
              {t('coupon.retry')}
            </button>
          }
        />
      ) : filteredCoupons.length === 0 ? (
        <StateCard
          title={coupons.length === 0 ? t('coupon.emptyTitle') : t('coupon.emptyTitleFiltered')}
          message={coupons.length === 0 ? t('coupon.emptyMessage') : t('coupon.emptyMessageFiltered')}
          action={
            coupons.length === 0 ? (
              <Link to="/mentor/coupons/new" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
                {t('coupon.createButton')}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">{t('coupon.tableCode')}</th>
                  <th className="px-4 py-3">{t('coupon.tableDiscount')}</th>
                  <th className="px-4 py-3">{t('coupon.tableAppliesTo')}</th>
                  <th className="px-4 py-3">{t('coupon.tableUsage')}</th>
                  <th className="px-4 py-3">{t('coupon.tableValidity')}</th>
                  <th className="px-4 py-3">{t('coupon.tableStatus')}</th>
                  <th className="px-4 py-3 text-right">{t('coupon.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="transition hover:bg-emerald-50 ">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                          title={t('coupon.copyCode')}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {copiedCode === coupon.code && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
                            {t('coupon.codeCopied')}
                          </span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="mt-1 max-w-xs truncate text-xs font-medium text-slate-400">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {discountLabel(coupon)}
                      {coupon.discountType === CouponDiscountType.PERCENTAGE && coupon.maxDiscountAmountMxc != null && (
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                          {t('coupon.fieldMaxDiscount')}: {formatCurrency(coupon.maxDiscountAmountMxc)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {coupon.appliesToAllCourses ? t('coupon.appliesToAll') : t('coupon.appliesToCount', { count: coupon.courses.length })}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {coupon.timesUsed} / {coupon.usageLimitTotal ?? t('coupon.usageUnlimited')}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {coupon.startsAt || coupon.expiresAt ? (
                        <span>
                          {coupon.startsAt ? formatDate(coupon.startsAt) : '—'} → {coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}
                        </span>
                      ) : (
                        t('coupon.noExpiry')
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill label={statusLabel(coupon.effectiveStatus)} tone={statusTone(coupon.effectiveStatus)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/mentor/coupons/${coupon.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-950"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t('coupon.edit')}
                        </Link>
                        <button
                          type="button"
                          onClick={(event) => requestDelete(coupon, event)}
                          disabled={deleteMutation.isLoading}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('coupon.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{t('coupon.deleteConfirmTitle')}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    {t('coupon.deleteConfirmMessage', { code: confirmDelete.code })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleteMutation.isLoading && setConfirmDelete(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isLoading}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
              >
                {t('coupon.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteCoupon}
                disabled={deleteMutation.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('coupon.deleteConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
