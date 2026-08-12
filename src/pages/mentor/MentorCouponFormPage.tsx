import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ArrowLeft, Search, X } from 'lucide-react'
import { couponApi } from '@/api/couponApi'
import { courseApi } from '@/api/courseApi'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { CouponDiscountType, CourseProductType } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { PageShell, TextInput } from './shared/MentorHubUI'

const getCourseId = (course: { courseId?: string; id?: string }) => course.courseId || course.id || ''

const COUPON_CODE_MIN_LENGTH = 6
const COUPON_CODE_MAX_LENGTH = 20
const COUPON_CODE_PATTERN = /^(?=.*[0-9])[A-Z0-9]+$/

const isValidCouponCode = (value: string) =>
  value.length >= COUPON_CODE_MIN_LENGTH && value.length <= COUPON_CODE_MAX_LENGTH && COUPON_CODE_PATTERN.test(value)

export default function MentorCouponFormPage() {
  const { t } = useI18n()
  const { couponId } = useParams<{ couponId: string }>()
  const isEditMode = Boolean(couponId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: existingCoupon, isLoading: isLoadingCoupon } = useQuery(
    ['mentor-coupon', couponId],
    () => couponApi.getById(couponId!),
    { enabled: Boolean(couponId) }
  )

  const { data: coursePage } = useQuery(
    ['mentor-courses-for-coupon', user?.userId],
    () => courseApi.getByInstructor(user!.userId, { page: 0, size: 100 }),
    { enabled: Boolean(user?.userId) }
  )
  const courses = useMemo(() => coursePage?.content || [], [coursePage])

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<CouponDiscountType>(CouponDiscountType.PERCENTAGE)
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountAmountMxc, setDiscountAmountMxc] = useState('')
  const [maxDiscountAmountMxc, setMaxDiscountAmountMxc] = useState('')
  const [minPurchaseAmountMxc, setMinPurchaseAmountMxc] = useState('')
  const [appliesToAllCourses, setAppliesToAllCourses] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [usageLimitTotal, setUsageLimitTotal] = useState('')
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('1')
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [active, setActive] = useState(true)
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!existingCoupon) return
    setCode(existingCoupon.code)
    setDescription(existingCoupon.description || '')
    setDiscountType(existingCoupon.discountType)
    setDiscountPercent(existingCoupon.discountPercent != null ? String(existingCoupon.discountPercent) : '')
    setDiscountAmountMxc(existingCoupon.discountAmountMxc != null ? String(existingCoupon.discountAmountMxc) : '')
    setMaxDiscountAmountMxc(existingCoupon.maxDiscountAmountMxc != null ? String(existingCoupon.maxDiscountAmountMxc) : '')
    setMinPurchaseAmountMxc(existingCoupon.minPurchaseAmountMxc != null ? String(existingCoupon.minPurchaseAmountMxc) : '')
    setAppliesToAllCourses(existingCoupon.appliesToAllCourses)
    setSelectedCourseIds(new Set(existingCoupon.courses.map((course) => course.id)))
    setUsageLimitTotal(existingCoupon.usageLimitTotal != null ? String(existingCoupon.usageLimitTotal) : '')
    setUsageLimitPerUser(String(existingCoupon.usageLimitPerUser))
    setStartsAt(existingCoupon.startsAt ? existingCoupon.startsAt.slice(0, 16) : '')
    setExpiresAt(existingCoupon.expiresAt ? existingCoupon.expiresAt.slice(0, 16) : '')
    setActive(existingCoupon.active)
  }, [existingCoupon])

  const filteredCourses = useMemo(() => {
    const query = courseSearchQuery.trim().toLowerCase()
    if (!query) return courses
    return courses.filter((course) => course.title.toLowerCase().includes(query))
  }, [courses, courseSearchQuery])

  const filteredIds = useMemo(() => filteredCourses.map(getCourseId), [filteredCourses])
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedCourseIds.has(id))
  const someFilteredSelected = filteredIds.some((id) => selectedCourseIds.has(id))
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected
    }
  }, [someFilteredSelected, allFilteredSelected])

  const toggleSelectAll = () => {
    setSelectedCourseIds((current) => {
      const next = new Set(current)
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id))
      } else {
        filteredIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCourses = useMemo(
    () => courses.filter((course) => selectedCourseIds.has(getCourseId(course))),
    [courses, selectedCourseIds]
  )

  const maxFixedDiscount = useMemo(() => {
    const pool = appliesToAllCourses ? courses : selectedCourses
    const prices = pool.map((course) => course.priceMxc || 0).filter((price) => price > 0)
    return prices.length > 0 ? Math.min(...prices) : undefined
  }, [appliesToAllCourses, courses, selectedCourses])

  const saveMutation = useMutation(
    async () => {
      const payload = {
        code: code.trim(),
        description: description.trim() || undefined,
        discountType,
        discountPercent: discountType === CouponDiscountType.PERCENTAGE ? Number(discountPercent) : undefined,
        discountAmountMxc: discountType === CouponDiscountType.FIXED ? Number(discountAmountMxc) : undefined,
        maxDiscountAmountMxc: maxDiscountAmountMxc.trim() ? Number(maxDiscountAmountMxc) : undefined,
        minPurchaseAmountMxc: minPurchaseAmountMxc.trim() ? Number(minPurchaseAmountMxc) : undefined,
        appliesToAllCourses,
        courseIds: appliesToAllCourses ? [] : Array.from(selectedCourseIds),
        usageLimitTotal: usageLimitTotal.trim() ? Number(usageLimitTotal) : undefined,
        usageLimitPerUser: Number(usageLimitPerUser) || 1,
        startsAt: startsAt || undefined,
        expiresAt: expiresAt || undefined,
        active,
      }
      if (isEditMode) {
        return couponApi.update(couponId!, payload)
      }
      return couponApi.create(payload)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-coupons'])
        navigate('/mentor/coupons')
      },
      onError: (err: any) => {
        setFormError(err.response?.data?.message || t('coupon.formErrorGeneric'))
      },
    }
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    if (!isValidCouponCode(code)) {
      setFormError(t('coupon.codeInvalid'))
      return
    }
    if (!appliesToAllCourses && selectedCourseIds.size === 0) {
      setFormError(t('coupon.selectionRequired'))
      return
    }
    if (discountType === CouponDiscountType.PERCENTAGE) {
      const percent = Number(discountPercent)
      if (!discountPercent || percent < 1 || percent > 100) {
        setFormError(t('coupon.discountPercentOutOfRange'))
        return
      }
    }
    if (discountType === CouponDiscountType.FIXED) {
      const amount = Number(discountAmountMxc)
      if (!discountAmountMxc || amount <= 0) {
        setFormError(t('coupon.formErrorGeneric'))
        return
      }
      if (maxFixedDiscount != null && amount > maxFixedDiscount) {
        setFormError(t('coupon.fixedDiscountExceedsPrice', { max: formatCurrency(maxFixedDiscount) }))
        return
      }
    }
    saveMutation.mutate()
  }

  if (isEditMode && isLoadingCoupon) {
    return (
      <PageShell title={t('coupon.formTitleEdit')} description="">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow={t('coupon.pageTitle')}
      title={isEditMode ? t('coupon.formTitleEdit') : t('coupon.formTitleCreate')}
      description=""
      actions={
        <button
          type="button"
          onClick={() => navigate('/mentor/coupons')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('coupon.backButton')}
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <p className="text-xs font-medium text-slate-400">
          <span className="text-rose-500">*</span> {t('coupon.requiredFieldLegend')}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('coupon.fieldCode')} required>
            <TextInput
              value={code}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, COUPON_CODE_MAX_LENGTH))
              }
              placeholder={t('coupon.fieldCodePlaceholder')}
              className="w-full font-mono"
              minLength={COUPON_CODE_MIN_LENGTH}
              maxLength={COUPON_CODE_MAX_LENGTH}
              required
            />
            <p className="mt-1 text-xs font-medium text-slate-400">
              {t('coupon.codeHint', { min: COUPON_CODE_MIN_LENGTH, max: COUPON_CODE_MAX_LENGTH })}
            </p>
          </Field>
          <Field label={t('coupon.fieldDiscountType')} required>
            <div className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setDiscountType(CouponDiscountType.PERCENTAGE)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-bold transition ${discountType === CouponDiscountType.PERCENTAGE ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50'}`}
              >
                {t('coupon.discountTypePercentage')}
              </button>
              <button
                type="button"
                onClick={() => setDiscountType(CouponDiscountType.FIXED)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-bold transition ${discountType === CouponDiscountType.FIXED ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50'}`}
              >
                {t('coupon.discountTypeFixed')}
              </button>
            </div>
          </Field>
        </div>

        <Field label={t('coupon.fieldDescription')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('coupon.fieldDescriptionPlaceholder')}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          {discountType === CouponDiscountType.PERCENTAGE ? (
            <>
              <Field label={t('coupon.fieldDiscountPercent')} required>
                <TextInput
                  type="number"
                  min={1}
                  max={100}
                  step="1"
                  value={discountPercent}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscountPercent(e.target.value)}
                  className="w-full"
                  required
                />
              </Field>
              <Field label={t('coupon.fieldMaxDiscount')}>
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxDiscountAmountMxc}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxDiscountAmountMxc(e.target.value)}
                  className="w-full"
                />
              </Field>
            </>
          ) : (
            <Field label={t('coupon.fieldDiscountAmount')} required>
              <TextInput
                type="number"
                min={0.01}
                max={maxFixedDiscount}
                step="0.01"
                value={discountAmountMxc}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscountAmountMxc(e.target.value)}
                className="w-full"
                required
              />
              {maxFixedDiscount != null && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {t('coupon.fixedDiscountMaxHint', { max: formatCurrency(maxFixedDiscount) })}
                </p>
              )}
            </Field>
          )}
          <Field label={t('coupon.fieldMinPurchase')}>
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={minPurchaseAmountMxc}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMinPurchaseAmountMxc(e.target.value)}
              className="w-full"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field label={t('coupon.fieldUsageLimitTotal')}>
            <TextInput
              type="number"
              min={1}
              value={usageLimitTotal}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsageLimitTotal(e.target.value)}
              placeholder={t('coupon.fieldUsageLimitTotalPlaceholder')}
              className="w-full"
            />
          </Field>
          <Field label={t('coupon.fieldUsageLimitPerUser')}>
            <TextInput
              type="number"
              min={1}
              value={usageLimitPerUser}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsageLimitPerUser(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field label={t('coupon.fieldStartsAt')}>
            <TextInput
              type="datetime-local"
              value={startsAt}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStartsAt(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field label={t('coupon.fieldExpiresAt')}>
            <TextInput
              type="datetime-local"
              value={expiresAt}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
              className="w-full"
            />
          </Field>
        </div>

        <label className="flex w-fit items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500" />
          {t('coupon.fieldActive')}
        </label>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="mb-3 text-sm font-black text-slate-900 dark:text-slate-100">
            {t('coupon.sectionAppliesTo')}
            <span className="ml-0.5 text-rose-500">*</span>
          </p>
          <div className="mb-4 flex h-10 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 md:w-fit">
            <button
              type="button"
              onClick={() => setAppliesToAllCourses(true)}
              className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${appliesToAllCourses ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50'}`}
            >
              {t('coupon.appliesToAllToggle')}
            </button>
            <button
              type="button"
              onClick={() => setAppliesToAllCourses(false)}
              className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${!appliesToAllCourses ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50'}`}
            >
              {t('coupon.appliesToSpecificToggle')}
            </button>
          </div>

          {!appliesToAllCourses && (
            <div className="space-y-3">
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((course) => (
                    <span
                      key={getCourseId(course)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                    >
                      {course.title}
                      <button type="button" onClick={() => toggleCourse(getCourseId(course))} className="text-emerald-400 hover:text-emerald-700 dark:text-emerald-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('coupon.selectedCount', { count: selectedCourseIds.size })}</p>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <TextInput
                  value={courseSearchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCourseSearchQuery(e.target.value)}
                  placeholder={t('coupon.searchCoursesPlaceholder')}
                  className="w-full pl-9"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          title={t('coupon.selectAll')}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500"
                        />
                      </th>
                      <th className="px-3 py-2">{t('coupon.tableItemTitle')}</th>
                      <th className="px-3 py-2">{t('coupon.tableItemType')}</th>
                      <th className="px-3 py-2">{t('coupon.tableItemPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-sm font-medium text-slate-400">
                          {t('coupon.noCoursesFound')}
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => {
                        const id = getCourseId(course)
                        return (
                          <tr key={id} className="hover:bg-emerald-50 ">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedCourseIds.has(id)}
                                onChange={() => toggleCourse(id)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                                  {course.thumbnailUrl && <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />}
                                </div>
                                <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{course.title}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                              {course.productType === CourseProductType.DOCUMENT ? t('coupon.typeDocument') : t('coupon.typeCourse')}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(course.priceMxc || 0)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formError}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/mentor/coupons')}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
          >
            {t('coupon.cancel')}
          </button>
          <button
            type="submit"
            disabled={saveMutation.isLoading}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saveMutation.isLoading ? t('coupon.savingButton') : t('coupon.saveButton')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}
