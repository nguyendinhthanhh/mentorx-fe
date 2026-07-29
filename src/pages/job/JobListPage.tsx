import { FormEvent, useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import { categoryApi } from '@/api/categoryApi'
import { jobApi } from '@/api/jobApi'
import { skillApi } from '@/api/skillApi'
import { useI18n } from '@/i18n/I18nProvider'
import { TranslationKey } from '@/i18n/translations'
import { BudgetType, JobResponse, JobSort, JobStatus, JobType } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'

const PAGE_SIZE = 10

const JOB_TYPE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.all' },
  { value: JobType.FREELANCE_PROJECT, labelKey: 'jobs.freelance' },
  { value: JobType.LONG_TERM_MENTORING, labelKey: 'jobs.mentoring' },
  { value: JobType.QUICK_FIX, labelKey: 'jobs.quickFix' },
] as const

const SORT_OPTIONS: { value: JobSort; labelKey: TranslationKey }[] = [
  { value: JobSort.NEWEST, labelKey: 'jobs.sort.newest' },
  { value: JobSort.BUDGET_DESC, labelKey: 'jobs.sort.budgetDesc' },
  { value: JobSort.BUDGET_ASC, labelKey: 'jobs.sort.budgetAsc' },
  { value: JobSort.POPULAR, labelKey: 'jobs.sort.popular' },
  { value: JobSort.RELEVANCE, labelKey: 'jobs.sort.relevance' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.filter.experienceAll' },
  { value: 'Fresher', labelKey: 'jobs.filter.experienceFresher' },
  { value: 'Junior', labelKey: 'jobs.filter.experienceJunior' },
  { value: 'Mid-Level', labelKey: 'jobs.filter.experienceMid' },
  { value: 'Senior', labelKey: 'jobs.filter.experienceSenior' },
  { value: 'Expert', labelKey: 'jobs.filter.experienceExpert' },
] as const

const BUDGET_TYPE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.filter.budgetTypeAll' },
  { value: BudgetType.FIXED, labelKey: 'jobs.filter.budgetTypeFixed' },
  { value: BudgetType.HOURLY, labelKey: 'jobs.filter.budgetTypeHourly' },
] as const

const STATUS_OPTIONS = [
  { value: JobStatus.OPEN, labelKey: 'jobs.filter.statusOpen' },
  { value: JobStatus.CLOSED, labelKey: 'jobs.filter.statusClosed' },
] as const

type ViewMode = 'grid' | 'list'

export default function JobListPage() {
  const { language, t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('q') || ''
  const [keywordInput, setKeywordInput] = useState(initialKeyword)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [jobType, setJobType] = useState<string>('ALL')
  const [skillFilter, setSkillFilter] = useState('')
  const [sort, setSort] = useState<JobSort>(JobSort.NEWEST)
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [budgetType, setBudgetType] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<JobStatus>(JobStatus.OPEN)
  const [categoryId, setCategoryId] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)

  const apiJobType = jobType === 'ALL' ? undefined : (jobType as JobType)
  const apiBudgetType = budgetType === 'ALL' ? undefined : (budgetType as BudgetType)
  const parsedCategoryId = Number(categoryId)
  const apiCategoryId =
    categoryId && Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
      ? parsedCategoryId
      : undefined
  const apiExperienceLevel = experienceFilter === 'ALL' ? undefined : experienceFilter

  const { data: skills = [] } = useQuery('job-filter-skills', skillApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const { data: categories = [] } = useQuery('job-filter-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const {
    data,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery(
    [
      'jobs',
      page,
      apiJobType,
      skillFilter,
      apiExperienceLevel,
      keyword,
      sort,
      budgetMin,
      budgetMax,
      apiBudgetType,
      statusFilter,
      apiCategoryId,
    ],
    () =>
      jobApi.getOpenJobs({
        page,
        size: PAGE_SIZE,
        jobType: apiJobType,
        skill: skillFilter.trim() || undefined,
        experienceLevel: apiExperienceLevel,
        keyword: keyword.trim() || undefined,
        sort,
        budgetMin: parseNonNegativeNumber(budgetMin),
        budgetMax: parseNonNegativeNumber(budgetMax),
        budgetType: apiBudgetType,
        status: statusFilter,
        categoryId: apiCategoryId,
      }),
    { keepPreviousData: true }
  )

  const jobs = data?.content || []
  const totalPages = data?.totalPages || 1
  const totalJobs = data?.totalElements || 0
  const activeFilterCount = [
    keyword.trim().length > 0,
    jobType !== 'ALL',
    !!skillFilter,
    experienceFilter !== 'ALL',
    sort !== JobSort.NEWEST,
    !!budgetMin,
    !!budgetMax,
    budgetType !== 'ALL',
    statusFilter !== JobStatus.OPEN,
    !!categoryId,
  ].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0

  const setFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(0)
  }

  const updateKeywordInUrl = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value) {
      nextParams.set('q', value)
    } else {
      nextParams.delete('q')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextKeyword = keywordInput.trim()
    setKeyword(nextKeyword)
    updateKeywordInUrl(nextKeyword)
    setPage(0)
  }

  const clearKeyword = () => {
    setKeywordInput('')
    setKeyword('')
    updateKeywordInUrl('')
    setPage(0)
  }

  const clearAllFilters = () => {
    setKeywordInput('')
    setKeyword('')
    setJobType('ALL')
    setSkillFilter('')
    setExperienceFilter('ALL')
    setSort(JobSort.NEWEST)
    setBudgetMin('')
    setBudgetMax('')
    setBudgetType('ALL')
    setStatusFilter(JobStatus.OPEN)
    setCategoryId('')
    updateKeywordInUrl('')
    setPage(0)
  }

  return (
    <div className="job-discovery-page min-h-screen bg-[#f7f8fc] pb-12 text-slate-900 selection:bg-emerald-100 selection:text-emerald-950 dark:bg-slate-950 dark:text-slate-100">
      <section className="border-b border-[#e2e6f5] bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              {t('jobs.discovery.title')}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-600 sm:text-base dark:text-slate-300">
              {t('jobs.discovery.subtitle')}
            </p>
          </div>

          <form
            className="mx-auto mt-8 grid max-w-4xl w-full shrink-0 gap-2 rounded-2xl border border-[#e2e6f5] bg-white p-2 shadow-sm sm:grid-cols-[minmax(210px,auto)_minmax(0,1fr)_auto] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
            onSubmit={handleSearch}
          >
            <label className="relative min-w-0 border-b border-slate-200 sm:border-b-0 sm:border-r dark:border-slate-700">
              <span className="sr-only">{t('jobs.filter.category')}</span>
              <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <select
                value={categoryId}
                onChange={(event) => setFilter(setCategoryId)(event.target.value)}
                className="h-12 w-full appearance-none bg-transparent pl-10 pr-8 text-sm font-semibold text-slate-800 outline-none dark:text-slate-100"
              >
                <option value="">{t('jobs.filter.categoryAll')}</option>
                {categories.map((category) => (
                  <option key={category.categoryId ?? category.id} value={category.categoryId ?? category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="relative min-w-0">
              <span className="sr-only">{t('jobs.searchPlaceholder')}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder={t('jobs.searchPlaceholder')}
                className="h-12 w-full bg-transparent pl-11 pr-11 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {keywordInput ? (
                <button
                  type="button"
                  onClick={clearKeyword}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={t('jobs.search.clear')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
            >
              <Search className="h-4 w-4" />
              {t('jobs.search.action')}
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] px-3 py-6 min-[360px]:px-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] xl:gap-8">
          <aside className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((open) => !open)}
                className="flex min-h-12 min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition-colors duration-150 hover:border-slate-300 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                aria-expanded={mobileFiltersOpen}
                aria-controls="job-filter-panel"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                  <span className="truncate">
                    {mobileFiltersOpen ? t('jobs.filter.lessFilters') : t('jobs.filter.moreFilters')}
                  </span>
                </span>
                {activeFilterCount > 0 ? (
                  <span className="ml-2 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 px-1.5 text-xs text-white dark:bg-emerald-400 dark:text-slate-950">
                    {activeFilterCount}
                  </span>
                ) : (
                  <ChevronDown
                    className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      mobileFiltersOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              <Link
                to="/jobs/create"
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
              >
                <Plus className="h-4 w-4" />
                {t('jobs.post')}
              </Link>
            </div>

            <div
              id="job-filter-panel"
              className={`${mobileFiltersOpen ? 'mt-3 block' : 'hidden'} lg:sticky lg:top-24 lg:block`}
            >
              <div className="overflow-hidden rounded-2xl border border-[#e2e6f5] bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-slate-50">
                    <Filter className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                    {t('jobs.filters.title')}
                  </h2>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t('jobs.filter.clearAll')}
                    </button>
                  ) : null}
                </div>

                <div className="divide-y divide-slate-200 px-6 dark:divide-slate-800">
                  <FilterGroup title={t('jobs.filter.jobType')}>
                    {JOB_TYPE_OPTIONS.map((option) => (
                      <RadioOption
                        key={option.value}
                        name="jobType"
                        value={option.value}
                        checked={jobType === option.value}
                        onChange={setFilter(setJobType)}
                        label={t(option.labelKey)}
                      />
                    ))}
                  </FilterGroup>

                  <FilterGroup title={t('jobs.filter.experience')}>
                    {EXPERIENCE_OPTIONS.map((option) => (
                      <RadioOption
                        key={option.value}
                        name="experienceFilter"
                        value={option.value}
                        checked={experienceFilter === option.value}
                        onChange={setFilter(setExperienceFilter)}
                        label={t(option.labelKey)}
                      />
                    ))}
                  </FilterGroup>

                  <FilterGroup title={t('jobs.filter.skills')}>
                    {skills.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {skills.slice(0, 6).map((skill) => {
                          const isSelected = skillFilter === skill.labelEn
                          const displayName = language === 'vi' && skill.labelVi ? skill.labelVi : skill.labelEn
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => setFilter(setSkillFilter)(isSelected ? '' : skill.labelEn)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400'
                              }`}
                            >
                              {displayName}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <label className="relative block">
                      <span className="sr-only">{t('jobs.filter.skills')}</span>
                      <select
                        value={skillFilter}
                        onChange={(event) => setFilter(setSkillFilter)(event.target.value)}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <option value="">{t('jobs.filter.skillsAll')}</option>
                        {skills.slice(0, 80).map((skill) => (
                          <option key={skill.id} value={skill.labelEn}>
                            {language === 'vi' && skill.labelVi ? skill.labelVi : skill.labelEn}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </label>
                  </FilterGroup>

                  <FilterGroup title={t('jobs.filter.budget')}>
                    {BUDGET_TYPE_OPTIONS.map((option) => (
                      <RadioOption
                        key={option.value}
                        name="budgetType"
                        value={option.value}
                        checked={budgetType === option.value}
                        onChange={setFilter(setBudgetType)}
                        label={t(option.labelKey)}
                      />
                    ))}
                    {budgetType === BudgetType.FIXED || budgetType === BudgetType.HOURLY ? (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <label>
                          <span className="mb-1.5 block text-xs font-medium text-slate-500">
                            {t('jobs.filter.budgetMin')}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={budgetMin}
                            onChange={(event) => setFilter(setBudgetMin)(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </label>
                        <label>
                          <span className="mb-1.5 block text-xs font-medium text-slate-500">
                            {t('jobs.filter.budgetMax')}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={budgetMax}
                            onChange={(event) => setFilter(setBudgetMax)(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </label>
                      </div>
                    ) : null}
                  </FilterGroup>

                  <FilterGroup title={t('jobs.filter.status')}>
                    {STATUS_OPTIONS.map((option) => (
                      <RadioOption
                        key={option.value}
                        name="statusFilter"
                        value={option.value}
                        checked={statusFilter === option.value}
                        onChange={(value) => {
                          setStatusFilter(value as JobStatus)
                          setPage(0)
                        }}
                        label={t(option.labelKey)}
                      />
                    ))}
                  </FilterGroup>
                </div>
              </div>

            </div>
          </aside>

          <section className="min-w-0" aria-busy={isFetching}>
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">
                  {t('jobs.results.count', { count: totalJobs })}
                </h2>
                <p className="mt-1 min-h-5 text-xs text-slate-500 dark:text-slate-400">
                  {isFetching && !isLoading ? t('jobs.results.updating') : t('jobs.results.hint')}
                </p>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="hidden items-center rounded-xl border border-slate-200 bg-white p-1 sm:flex dark:border-slate-800 dark:bg-slate-900"
                  aria-label={t('jobs.view.label')}
                >
                  <ViewModeButton
                    active={viewMode === 'list'}
                    label={t('jobs.view.list')}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </ViewModeButton>
                  <ViewModeButton
                    active={viewMode === 'grid'}
                    label={t('jobs.view.grid')}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </ViewModeButton>
                </div>

                <label className="relative min-w-0 flex-1 sm:flex-none">
                  <span className="sr-only">{t('jobs.sort.label')}</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as JobSort)
                      setPage(0)
                    }}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-emerald-600 sm:w-[190px] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </label>

                <Link
                  to="/jobs/create"
                  className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] lg:inline-flex dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" />
                  {t('jobs.post')}
                </Link>
              </div>
            </div>

            {isLoading ? (
              <JobListSkeleton viewMode={viewMode} />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : jobs.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-4 xl:grid-cols-2'
                    : 'flex flex-col gap-3'
                }
              >
                {jobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    showRelevance={Boolean(keyword.trim())}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <EmptyState hasSearch={hasActiveFilters} onClear={clearAllFilters} />
            )}

            {totalPages > 1 ? (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

function FilterGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="py-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function RadioOption({
  checked,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean
  label: string
  name: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="group flex min-h-9 cursor-pointer items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.value)}
        className="peer sr-only"
      />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-emerald-300 dark:peer-focus-visible:ring-offset-slate-900 ${
          checked
            ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950'
            : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-950'
        }`}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-white dark:bg-slate-950" /> : null}
      </span>
      <span className={checked ? 'font-semibold text-slate-950 dark:text-slate-50' : ''}>{label}</span>
    </label>
  )
}

function ViewModeButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ${
        active
          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-white'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function JobCard({
  job,
  showRelevance,
  viewMode,
}: {
  job: JobResponse
  showRelevance: boolean
  viewMode: ViewMode
}) {
  const { language, t } = useI18n()
  const clientName = getClientName(job, t)
  const budget = formatBudget(job, t)
  const deadline = getDeadlineState(job.deadlineAt, language)
  const relevancePercent =
    job.relevanceScore != null ? Math.min(Math.round(job.relevanceScore * 100), 100) : null
  const publishedDate = job.publishedAt || job.createdAt
  const initial = clientName.trim().charAt(0).toUpperCase() || 'M'

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-[#e2e6f5] bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(51,65,85,0.09)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-none">
      <Link
        to={`/jobs/${job.jobId}`}
        className={`flex h-full min-w-0 flex-col p-5 sm:p-6 ${
          viewMode === 'list' ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {clientName}
                </span>
                <span className="text-xs text-slate-400">
                  {formatRelativeTime(publishedDate, language)}
                </span>
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-[17px] font-bold leading-6 tracking-[-0.015em] text-slate-950 transition-colors duration-150 group-hover:text-emerald-800 sm:text-lg dark:text-slate-50 dark:group-hover:text-emerald-300">
                {job.title}
              </h3>
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {job.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {getJobTypeLabel(job.jobType, t)}
            </span>
            {job.requiredSkills?.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills && job.requiredSkills.length > 3 ? (
              <span className="text-xs font-semibold text-slate-400">+{job.requiredSkills.length - 3}</span>
            ) : null}
            {!job.requiredSkills?.length ? (
              <span className="text-xs text-slate-400">{t('jobs.card.noSkills')}</span>
            ) : null}
          </div>
        </div>

        <div
          className={`mt-5 flex min-w-0 items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 ${
            viewMode === 'list'
              ? 'lg:mt-0 lg:flex-col lg:items-end lg:justify-between lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0'
              : ''
          }`}
        >
          <div className={viewMode === 'list' ? 'lg:text-right' : ''}>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {job.isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" />
                  {t('jobs.featured')}
                </span>
              ) : null}
              {showRelevance && relevancePercent != null ? (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {t('jobs.relevance', { score: relevancePercent })}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-base font-extrabold text-amber-700 dark:text-amber-300">{budget}</p>
          </div>

          <div className="text-right">
            <p
              className={`flex items-center justify-end gap-1.5 text-xs font-semibold ${
                deadline.isOverdue
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {deadline.label}
            </p>
            <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-400">
              <Users className="h-3.5 w-3.5" />
              {t('jobs.proposalCount', { count: job.proposalCount || 0 })}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors duration-150 group-hover:text-emerald-800 dark:text-slate-200 dark:group-hover:text-emerald-300">
              {t('jobs.card.viewDetails')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function JobListSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 ${
            viewMode === 'list' ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8' : ''
          }`}
        >
          <div>
            <div className="flex gap-3">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2.5">
                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-5 flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
              <div className="h-6 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div
            className={`mt-5 border-t border-slate-100 pt-4 dark:border-slate-800 ${
              viewMode === 'list' ? 'lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0' : ''
            }`}
          >
            <div className="ml-auto h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="ml-auto mt-4 h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900 dark:bg-rose-950/30">
      <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">{t('jobs.error.title')}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-800 dark:text-rose-200">
        {t('jobs.error.body')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-800 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-rose-900 active:scale-[0.98] dark:bg-rose-300 dark:text-rose-950 dark:hover:bg-rose-200"
      >
        <RotateCcw className="h-4 w-4" />
        {t('jobs.error.retry')}
      </button>
    </div>
  )
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-slate-50">
        {t('jobs.noJobsFound')}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {hasSearch ? t('jobs.emptyWithFilters') : t('jobs.emptyNoJobs')}
      </p>
      {hasSearch ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition-colors duration-150 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          {t('jobs.clearFilters')}
        </button>
      ) : null}
    </div>
  )
}

function Pagination({
  onPageChange,
  page,
  totalPages,
}: {
  onPageChange: (page: number) => void
  page: number
  totalPages: number
}) {
  const { t } = useI18n()
  return (
    <nav className="flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('jobs.pagination.label', { current: page + 1, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={t('jobs.pagination.previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={t('jobs.pagination.next')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}

function formatBudget(job: JobResponse, t: ReturnType<typeof useI18n>['t']) {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    if (job.budgetMinMxc === job.budgetMaxMxc) return formatCurrency(job.budgetMinMxc)
    return `${formatCurrency(job.budgetMinMxc)} - ${formatCurrency(job.budgetMaxMxc)}`
  }
  if (job.budgetMinMxc) return formatCurrency(job.budgetMinMxc)
  if (job.budgetMaxMxc) return formatCurrency(job.budgetMaxMxc)
  if (job.hourlyRateMxc) return `${formatCurrency(job.hourlyRateMxc)}/hr`
  return t('jobs.budgetTbd')
}

function getClientName(job: JobResponse, t: ReturnType<typeof useI18n>['t']) {
  return job.clientName || job.client?.displayName || job.client?.fullName || t('jobs.card.clientFallback')
}

function getJobTypeLabel(jobType: JobType, t: ReturnType<typeof useI18n>['t']) {
  if (jobType === JobType.FREELANCE_PROJECT) return t('jobs.freelance')
  if (jobType === JobType.LONG_TERM_MENTORING) return t('jobs.mentoring')
  return t('jobs.quickFix')
}

function getDeadlineState(deadlineAt: string | undefined, language: 'en' | 'vi') {
  if (!deadlineAt) {
    return {
      isOverdue: false,
      label: language === 'vi' ? 'Không có hạn chót' : 'No deadline',
    }
  }

  const deadline = new Date(deadlineAt)
  if (Number.isNaN(deadline.getTime())) {
    return {
      isOverdue: false,
      label: language === 'vi' ? 'Hạn chót chưa xác định' : 'Deadline unavailable',
    }
  }

  const isOverdue = deadline.getTime() < Date.now()
  const formattedDate = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(deadline)

  return {
    isOverdue,
    label: isOverdue
      ? language === 'vi'
        ? `Đã hết hạn ${formattedDate}`
        : `Expired ${formattedDate}`
      : language === 'vi'
        ? `Hạn ${formattedDate}`
        : `Due ${formattedDate}`,
  }
}

function parseNonNegativeNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}
