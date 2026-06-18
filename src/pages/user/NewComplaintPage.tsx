import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Flag, Search, Send, X } from 'lucide-react'

import { complaintsApi, ComplaintCreateRequest } from '@/api/complaintsApi'
import { mentorApi } from '@/api/mentorApi'
import { useI18n } from '@/i18n/I18nProvider'
import type { TranslationKey } from '@/i18n/translations'
import { useAuthStore } from '@/store/authStore'
import { useComplaintStore } from '@/store/complaintStore'
import type { MentorProfileResponse } from '@/types'

const CATEGORIES = ['Technical', 'Billing', 'Product', 'Other'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_KEYS: Record<Category, TranslationKey> = {
  Technical: 'mentee.complaints.categories.technical',
  Billing: 'mentee.complaints.categories.billing',
  Product: 'mentee.complaints.categories.product',
  Other: 'mentee.complaints.categories.other',
}

const PRIORITY_LEVELS: ReadonlyArray<{ value: number; key: TranslationKey }> = [
  { value: 1, key: 'mentee.complaints.priority.low' },
  { value: 3, key: 'mentee.complaints.priority.medium' },
  { value: 4, key: 'mentee.complaints.priority.high' },
  { value: 5, key: 'mentee.complaints.priority.urgent' },
] as const

export default function NewComplaintPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('Technical')
  const [priorityLevel, setPriorityLevel] = useState<number>(3)
  const [selectedMentor, setSelectedMentor] = useState<MentorProfileResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: mentorList = [], isLoading: mentorsLoading } = useQuery(
    ['approved-mentors-search', searchQuery],
    async (): Promise<MentorProfileResponse[]> => {
      if (searchQuery.length >= 2) {
        return mentorApi.searchMentorsFullText(searchQuery)
      }
      const paginated = await mentorApi.getAllApprovedMentors({ page: 0, size: 100 })
      return paginated.content
    },
    { staleTime: 60000 }
  )

  const addMyComplaint = useComplaintStore((s) => s.addMyComplaint)

  const mutation = useMutation({
    mutationFn: (payload: ComplaintCreateRequest) => complaintsApi.create(payload),
    onSuccess: (data) => {
      addMyComplaint(data)
      queryClient.invalidateQueries(['my-complaints'])
      navigate('/profile/complaints')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t('mentee.complaints.error.title')
      setError(message)
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!user) {
      setError(t('mentee.complaints.errors.notLoggedIn'))
      return
    }

    if (!title.trim() || !description.trim() || !selectedMentor) {
      setError(t('mentee.complaints.errors.required'))
      return
    }

    mutation.mutate({
      complainantId: user.userId,
      respondentId: selectedMentor.userId,
      title: title.trim(),
      description: description.trim(),
      complaintCategory: category,
      priorityLevel,
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/profile/complaints"
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('mentee.complaints.detail.back')}
      </Link>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-950/30 dark:text-indigo-400">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('mentee.complaints.newTitle')}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('mentee.complaints.newSubtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label={t('mentee.complaints.fields.title')} required>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder={t('mentee.complaints.fields.titlePlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </Field>

          <Field label={t('mentee.complaints.fields.respondent')} required hint={t('mentee.complaints.fields.respondentHint')}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                {selectedMentor
                  ? selectedMentor.user?.displayName || selectedMentor.user?.fullName || 'Unknown'
                  : <span className="text-slate-400">{t('mentee.complaints.fields.respondentPlaceholder')}</span>}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('mentee.complaints.fields.respondentPlaceholder')}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                    />
                    {selectedMentor && (
                      <button
                        type="button"
                        onClick={() => { setSelectedMentor(null); setSearchQuery(''); }}
                        className="rounded-full p-0.5 text-rose-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <ul className="max-h-56 overflow-y-auto py-1">
                    {mentorsLoading && (
                      <li className="px-4 py-2 text-sm text-slate-400">{t('common.loading')}</li>
                    )}
                    {!mentorsLoading && mentorList.length === 0 && (
                      <li className="px-4 py-2 text-sm text-slate-400">{t('mentee.complaints.fields.respondentEmpty')}</li>
                    )}
                    {mentorList.map((mentor) => (
                      <li key={mentor.userId}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMentor(mentor)
                            setIsDropdownOpen(false)
                            setSearchQuery('')
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${
                            selectedMentor?.userId === mentor.userId
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div>{mentor.user?.displayName || mentor.user?.fullName || mentor.userId}</div>
                          {mentor.headline && (
                            <div className="text-xs font-normal text-slate-400 truncate">{mentor.headline}</div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
              )}
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('mentee.complaints.fields.category')} required>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {t(CATEGORY_KEYS[value])}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('mentee.complaints.fields.priority')} required>
              <select
                value={priorityLevel}
                onChange={(event) => setPriorityLevel(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
              >
                {PRIORITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {t(level.key)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('mentee.complaints.fields.description')} required hint={t('mentee.complaints.fields.descriptionHint')}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              maxLength={2000}
              placeholder={t('mentee.complaints.fields.descriptionPlaceholder')}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </Field>

          {error && (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              to="/profile/complaints"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {t('mentee.complaints.cancel')}
            </Link>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-indigo-900/20"
            >
              <Send className="w-4 h-4" />
              {mutation.isLoading
                ? t('mentee.complaints.submitting')
                : t('mentee.complaints.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
        <span>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[10px] font-medium normal-case tracking-normal text-slate-400">{hint}</span>}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  )
}
