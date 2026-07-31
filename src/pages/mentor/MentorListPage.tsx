import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { categoryApi } from '@/api/categoryApi'
import { platformSettingApi } from '@/api/platformSettingApi'
import { DEFAULT_MENTOR_BADGE_SETTINGS } from '@/components/mentor/MentorBadgePills'
import { skillApi } from '@/api/skillApi'
import { useI18n } from '@/i18n/I18nProvider'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { MentorProfileResponse } from '@/types'

const PAGE_SIZE = 12

const AVAILABILITY_VALUES = ['FULL_TIME', 'PART_TIME', 'WEEKENDS', 'FLEXIBLE'] as const

const SORT_OPTIONS = [
  { value: 'averageRating', direction: 'desc' },
  { value: 'totalReviews', direction: 'desc' },
  { value: 'yearsOfExperience', direction: 'desc' },
  { value: 'hourlyRateMxc', direction: 'asc' },
] as const

const RATE_VALUES = [400, 500, 700] as const

export default function MentorListPage() {
  const { t, language } = useI18n()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('averageRating')
  const [sortDir, setSortDir] = useState('desc')
  const [filterOpen, setFilterOpen] = useState(false)
  const [maxRate, setMaxRate] = useState<number | undefined>()
  const [minRating, setMinRating] = useState<number | undefined>()
  const [availability, setAvailability] = useState<string | undefined>()
  const [primaryDomain, setPrimaryDomain] = useState<string | undefined>()
  const [skillKeyword, setSkillKeyword] = useState<string | undefined>()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: categories = [] } = useQuery('mentor-search-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: skills = [] } = useQuery('mentor-search-skills', skillApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })
  const mentorBadgeSettingsQuery = useQuery(
    ['mentor-badge-settings'],
    platformSettingApi.getPublicMentorBadgeSettings,
    {
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  )

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim())
      setPage(0)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchText])

  const textQuery = useQuery(
    ['mentors-text', debouncedSearch],
    () => mentorApi.searchMentorsFullText(debouncedSearch),
    { enabled: debouncedSearch.length >= 2, retry: false }
  )

  const pagedQuery = useQuery(
    ['mentors', page, sortBy, sortDir, minRating, maxRate, availability, primaryDomain, skillKeyword],
    () => {
      if (minRating || maxRate || availability || primaryDomain || skillKeyword) {
        return mentorApi.searchMentors({
          minRating,
          maxHourlyRate: maxRate,
          availability,
          primaryDomain,
          skill: skillKeyword,
          page,
          size: PAGE_SIZE,
          sortBy,
          sortDir,
        })
      }

      return mentorApi.getAllApprovedMentors({ page, size: PAGE_SIZE, sortBy, sortDir })
    },
    { enabled: debouncedSearch.length < 2, retry: false }
  )

  const isSearchMode = debouncedSearch.length >= 2
  const searchedMentors = isSearchMode
    ? filterAndSortMentors(textQuery.data || [], {
        minRating,
        maxRate,
        availability,
        primaryDomain,
        skillKeyword,
        sortBy,
        sortDir,
      })
    : []
  const mentors = isSearchMode ? searchedMentors : pagedQuery.data?.content || []
  const activeQuery = isSearchMode ? textQuery : pagedQuery
  const totalPages = isSearchMode ? 1 : pagedQuery.data?.totalPages || 0
  const totalMentors = isSearchMode ? mentors.length : pagedQuery.data?.totalElements || 0
  const activeFilterCount = [minRating, maxRate, availability, primaryDomain, skillKeyword].filter(Boolean).length

  const sortLabels: Record<string, string> = {
    averageRating: t('mentorMarketplace.sort.topRated'),
    totalReviews: t('mentorMarketplace.sort.mostReviewed'),
    yearsOfExperience: t('mentorMarketplace.sort.mostExperienced'),
    hourlyRateMxc: t('mentorMarketplace.sort.lowestRate'),
  }
  const applySort = (value: string) => {
    const option = SORT_OPTIONS.find((item) => item.value === value)
    setSortBy(value)
    setSortDir(option?.direction || 'desc')
    setPage(0)
  }

  const clearFilters = () => {
    setMinRating(undefined)
    setMaxRate(undefined)
    setAvailability(undefined)
    setPrimaryDomain(undefined)
    setSkillKeyword(undefined)
    setPage(0)
  }

  const clearSearchAndFilters = () => {
    setSearchText('')
    setDebouncedSearch('')
    clearFilters()
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    document.getElementById('mentor-results')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="mentor-discovery-page min-h-screen bg-[#f6f7fb] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      {/* Discovery header */}
      <section className="border-b border-emerald-200/80 bg-[oklch(0.935_0.055_175)] dark:border-emerald-500/20 dark:bg-[oklch(0.16_0.03_175)]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-14">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              {t('mentorMarketplace.eyebrow')}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-[40px] dark:text-slate-50">
              {t('mentorMarketplace.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-slate-300">
              {t('mentorMarketplace.description')}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200/90 bg-[oklch(0.995_0.003_160)] p-3 shadow-[0_18px_45px_rgba(5,150,105,0.13)] sm:p-4 dark:border-emerald-500/20 dark:bg-slate-900/90 dark:shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
              <label className="min-w-0">
                <span className="mb-2 block px-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t('mentorMarketplace.searchLabel')}
                </span>
                <span className="relative flex min-h-12 items-center rounded-xl border border-slate-300 bg-white shadow-sm transition-[border-color,box-shadow] focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-500/10">
                  <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={t('mentorMarketplace.searchPlaceholder')}
                    className="min-h-12 w-full min-w-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    type="search"
                  />
                  {searchText ? (
                    <button
                      type="button"
                      onClick={() => setSearchText('')}
                      className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:translate-y-px dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      aria-label={t('mentorMarketplace.clearSearch')}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              </label>

              <label className="min-w-0">
                <span className="mb-2 block px-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t('mentorMarketplace.domainLabel')}
                </span>
                <span className="relative block">
                  <select
                    value={primaryDomain || ''}
                    onChange={(event) => {
                      setPrimaryDomain(event.target.value || undefined)
                      setPage(0)
                    }}
                    className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/10"
                  >
                    <option value="">{t('mentorMarketplace.allDomains')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Results toolbar */}
      <main id="mentor-results" className="scroll-mt-20">
        <div className="sticky top-16 z-30 border-b border-slate-200/60 bg-white/98 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/98">
          <div className="mx-auto flex min-h-14 w-full max-w-[1520px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="truncate text-sm font-bold text-slate-950 dark:text-slate-100">
                {isSearchMode ? t('mentorMarketplace.searchResultsTitle') : t('mentorMarketplace.resultsTitle')}
              </h2>
              {!activeQuery.isLoading && !activeQuery.isError ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                  {t('mentorMarketplace.resultSummary', { count: totalMentors })}
                </span>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((current) => !current)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 active:translate-y-px lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-expanded={filterOpen}
                aria-controls="mentor-filters"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {activeFilterCount > 0
                  ? t('mentorMarketplace.filtersWithCount', { count: activeFilterCount })
                  : t('mentorMarketplace.filters')}
              </button>

              <label className="relative hidden min-[520px]:block">
                <span className="sr-only">{t('mentorMarketplace.sortLabel')}</span>
                <select
                  value={sortBy}
                  onChange={(event) => applySort(event.target.value)}
                  className="min-h-10 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:focus:border-emerald-400"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {sortLabels[option.value]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </label>
            </div>
          </div>
        </div>

        {/* ───── Content Grid ───── */}
        <div className="mx-auto grid w-full max-w-[1520px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:px-8">
          {/* Filter sidebar */}
          <div className={filterOpen ? 'block' : 'hidden lg:block'}>
            <aside
              id="mentor-filters"
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.03)] backdrop-blur-sm lg:sticky lg:top-36 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-950 dark:text-slate-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm dark:from-emerald-400 dark:to-teal-500 dark:text-slate-950">
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {t('mentorMarketplace.filters')}
                </div>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="min-h-9 rounded-lg px-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 active:translate-y-px dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                  >
                    {t('mentorMarketplace.clearFilters')}
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <FilterSelect
                  label={t('mentorMarketplace.ratingLabel')}
                  value={minRating || ''}
                  onChange={(value) => {
                    setMinRating(value ? Number(value) : undefined)
                    setPage(0)
                  }}
                  options={[
                    { value: '', label: t('mentorMarketplace.anyRating') },
                    { value: '4', label: t('mentorMarketplace.ratingFourUp') },
                    { value: '3', label: t('mentorMarketplace.ratingThreeUp') },
                  ]}
                />

                <FilterSelect
                  label={t('mentorMarketplace.rateLabel')}
                  value={maxRate || ''}
                  onChange={(value) => {
                    setMaxRate(value ? Number(value) : undefined)
                    setPage(0)
                  }}
                  options={[
                    { value: '', label: t('mentorMarketplace.anyRate') },
                    ...RATE_VALUES.map((value) => ({
                      value: String(value),
                      label: t('mentorMarketplace.rateUpTo', {
                        amount: formatCurrency(value, 'MXC', language),
                      }),
                    })),
                  ]}
                />

                <FilterSelect
                  label={t('mentorMarketplace.availabilityLabel')}
                  value={availability || ''}
                  onChange={(value) => {
                    setAvailability(value || undefined)
                    setPage(0)
                  }}
                  options={[
                    { value: '', label: t('mentorMarketplace.anyAvailability') },
                    ...AVAILABILITY_VALUES.map((value) => ({
                      value,
                      label: getAvailabilityLabel(value, t),
                    })),
                  ]}
                />

                <FilterSelect
                  label={t('mentorMarketplace.skillLabel')}
                  value={skillKeyword || ''}
                  onChange={(value) => {
                    setSkillKeyword(value || undefined)
                    setPage(0)
                  }}
                  options={[
                    { value: '', label: t('mentorMarketplace.anySkill') },
                    ...skills.map((skill) => ({
                      value: skill.labelEn,
                      label: language === 'vi' ? skill.labelVi : skill.labelEn,
                    })),
                  ]}
                />
              </div>

              {searchText || activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearSearchAndFilters}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('mentorMarketplace.resetSearch')}
                </button>
              ) : null}
            </aside>
          </div>

          {/* Results */}
          <section className="min-w-0" aria-live="polite" aria-busy={activeQuery.isLoading}>
            <label className="relative mb-4 block min-[520px]:hidden">
              <span className="sr-only">{t('mentorMarketplace.sortLabel')}</span>
              <select
                value={sortBy}
                onChange={(event) => applySort(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-400"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {sortLabels[option.value]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </label>

            {activeQuery.isLoading ? (
              <MentorGridSkeleton />
            ) : activeQuery.isError ? (
              <ErrorState onRetry={() => activeQuery.refetch()} />
            ) : mentors.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {mentors.map((mentor, index) => (
                  <MentorCard
                    key={mentor.userId}
                    mentor={mentor}
                    badgeSettings={mentorBadgeSettingsQuery.data || DEFAULT_MENTOR_BADGE_SETTINGS}
                    animationIndex={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                isFiltered={isSearchMode || activeFilterCount > 0}
                onClear={clearSearchAndFilters}
              />
            )}

            {!isSearchMode && totalPages > 1 ? (
              <div className="mt-10 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Filter Select
   ───────────────────────────────────────────────── */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-800 outline-none transition-colors hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-emerald-400"
        >
          {options.map((option) => (
            <option key={`${option.value}-${option.label}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </span>
    </label>
  )
}

/* ─────────────────────────────────────────────────
   MentorCard - Premium Profile Card
   ───────────────────────────────────────────────── */

function MentorCard({
  mentor,
  badgeSettings,
  animationIndex,
}: {
  mentor: MentorProfileResponse
  badgeSettings: typeof DEFAULT_MENTOR_BADGE_SETTINGS
  animationIndex: number
}) {
  const { t, language } = useI18n()
  const name = mentor.user?.displayName || mentor.user?.fullName || t('mentorMarketplace.mentorFallbackName')
  const avatarUrl = getSafeAvatarUrl(mentor.user?.avatarUrl)
  const hasReviews = Boolean(mentor.averageRating && mentor.totalReviews > 0)
  const profileSummary = mentor.headline || mentor.currentTitle || mentor.primaryDomain || ''
  const skills = (mentor.skills || []).filter(Boolean).slice(0, 3)
  const showApprovedSignal = badgeSettings.showApprovedBadge
  const showFeaturedSignal = badgeSettings.showFeaturedBadge && mentor.isFeatured
  const rateLabel = mentor.hourlyRateMxc != null
    ? formatCurrency(mentor.hourlyRateMxc, 'MXC', language)
    : '-'
  const delayClass = `mentor-card-enter-${Math.min(animationIndex, 11)}`

  return (
    <article
      className={`mentor-card-enter ${delayClass} mentor-card-glow group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900`}
    >
      {/* Gradient top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" aria-hidden="true" />

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* ─── Header: Avatar + Name ─── */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative">
            <div className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-2xl font-bold text-emerald-800 ring-[3px] ring-emerald-500/20 dark:from-emerald-500/15 dark:to-teal-500/10 dark:text-emerald-200 dark:ring-emerald-500/25">
              <span aria-hidden="true">{getInitials(name)}</span>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>

            {/* Verified badge */}
            {showApprovedSignal ? (
              <span
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white ring-[3px] ring-white shadow-md dark:ring-slate-900"
                title={t('mentorBadge.approved')}
                aria-label={t('mentorBadge.approved')}
              >
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            ) : null}
          </div>

          {/* Name */}
          <Link
            to={`/mentors/${mentor.userId}`}
            className="mt-4 rounded-md text-lg font-bold leading-6 text-slate-950 transition-colors hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300"
          >
            <span className="line-clamp-1">{name}</span>
          </Link>

          {/* Featured badge */}
          {showFeaturedSignal ? (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t('mentorBadge.featured')}
            </span>
          ) : null}

          {/* Profile summary */}
          <p className="mt-2 line-clamp-2 max-w-[260px] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            {profileSummary}
          </p>
        </div>

        {/* ─── Skills pills ─── */}
        {skills.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/15"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        {/* ─── Stats Grid 2×2 ─── */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <StatCell
            icon={<Star className={`h-3.5 w-3.5 ${hasReviews ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />}
            label={t('mentorMarketplace.ratingLabel')}
            value={
              hasReviews
                ? `${formatNumber(mentor.averageRating, language)} (${mentor.totalReviews})`
                : t('mentorMarketplace.noReviews')
            }
          />
          <StatCell
            icon={<Briefcase className="h-3.5 w-3.5 text-slate-400" />}
            label={t('mentorRecommendations.experience')}
            value={
              mentor.yearsOfExperience != null
                ? t('mentorMarketplace.yearsExperience', { count: mentor.yearsOfExperience })
                : '-'
            }
          />
          <StatCell
            label={t('mentorMarketplace.completedLabel')}
            value={
              mentor.totalJobsDone != null && mentor.totalJobsDone > 0
                ? String(mentor.totalJobsDone)
                : '-'
            }
          />
          <StatCell
            label={t('mentorMarketplace.hourlyRate')}
            value={rateLabel}
            accent
          />
        </div>

        {/* ─── Response time / Availability ─── */}
        {(mentor.responseTimeHours != null || mentor.availability) ? (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {mentor.responseTimeHours != null
              ? t('mentorMarketplace.respondsWithin', { hours: mentor.responseTimeHours })
              : getAvailabilityLabel(mentor.availability!, t)}
          </div>
        ) : null}

        {/* ─── CTA Button ─── */}
        <div className="mt-auto pt-5">
          <Link
            to={`/mentors/${mentor.userId}`}
            aria-label={`${t('mentorMarketplace.viewProfile')}: ${name}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(5,150,105,0.25)] transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 hover:shadow-[0_8px_22px_rgba(5,150,105,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:from-emerald-400 dark:to-teal-400 dark:text-slate-950 dark:shadow-none dark:hover:from-emerald-300 dark:hover:to-teal-300 dark:focus-visible:ring-offset-slate-900"
          >
            {t('mentorMarketplace.viewProfile')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────
   Stat Cell
   ───────────────────────────────────────────────── */

function StatCell({
  icon,
  label,
  value,
  accent = false,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-inset ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-700/60">
      <div className="flex items-center gap-1.5">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
      <p className={`mt-1 truncate text-sm font-bold leading-5 ${accent ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Skeleton Loader
   ───────────────────────────────────────────────── */

function MentorGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Top accent */}
          <div className="h-1 w-full mentor-shimmer-bg bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col items-center p-6">
            {/* Avatar skeleton */}
            <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            {/* Name */}
            <div className="mt-4 h-5 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            {/* Summary */}
            <div className="mt-2 h-4 w-44 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
            {/* Skills */}
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/70" />
            </div>
            {/* Stats grid */}
            <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-[52px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
              ))}
            </div>
            {/* CTA */}
            <div className="mt-5 h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Empty & Error States
   ───────────────────────────────────────────────── */

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 shadow-sm ring-1 ring-inset ring-slate-200/60 dark:from-slate-800 dark:to-slate-800/60 dark:text-slate-300 dark:ring-slate-700">
        <Search className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-slate-100">
        {isFiltered ? t('mentorMarketplace.filteredEmptyTitle') : t('mentorMarketplace.emptyTitle')}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        {isFiltered ? t('mentorMarketplace.filteredEmptyDescription') : t('mentorMarketplace.emptyDescription')}
      </p>
      {isFiltered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(5,150,105,0.2)] transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-[0_8px_22px_rgba(5,150,105,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:from-emerald-400 dark:to-teal-400 dark:text-slate-950 dark:hover:from-emerald-300 dark:hover:to-teal-300 dark:focus-visible:ring-offset-slate-900"
        >
          {t('mentorMarketplace.resetSearch')}
        </button>
      ) : null}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-14 text-center dark:border-rose-500/25 dark:bg-rose-500/10">
      <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
        {t('mentorMarketplace.errorTitle')}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        {t('mentorMarketplace.errorDescription')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(5,150,105,0.2)] transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-[0_8px_22px_rgba(5,150,105,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:from-emerald-400 dark:to-teal-400 dark:text-slate-950 dark:hover:from-emerald-300 dark:hover:to-teal-300 dark:focus-visible:ring-offset-slate-900"
      >
        {t('mentorMarketplace.retry')}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Pagination
   ───────────────────────────────────────────────── */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const { t } = useI18n()
  if (totalPages <= 1) return null

  const visiblePages = Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
    return totalPages <= 7 ? index : Math.max(0, Math.min(page - 3, totalPages - 7)) + index
  })

  return (
    <nav
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-label={t('mentorMarketplace.paginationLabel')}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:translate-y-px disabled:pointer-events-none disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={t('mentorMarketplace.previousPage')}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          aria-current={page === pageNumber ? 'page' : undefined}
          aria-label={t('mentorMarketplace.pageNumber', { page: pageNumber + 1 })}
          className={`h-11 min-w-11 rounded-xl px-3 text-sm font-bold transition-colors active:translate-y-px ${
            page === pageNumber
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm dark:from-emerald-400 dark:to-teal-400 dark:text-slate-950'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {pageNumber + 1}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:translate-y-px disabled:pointer-events-none disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={t('mentorMarketplace.nextPage')}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </nav>
  )
}

/* ─────────────────────────────────────────────────
   Utility functions (unchanged)
   ───────────────────────────────────────────────── */

function getAvailabilityLabel(
  value: string,
  t: ReturnType<typeof useI18n>['t']
) {
  const labels: Record<string, string> = {
    FULL_TIME: t('mentorMarketplace.availability.fullTime'),
    PART_TIME: t('mentorMarketplace.availability.partTime'),
    WEEKENDS: t('mentorMarketplace.availability.weekends'),
    FLEXIBLE: t('mentorMarketplace.availability.flexible'),
  }
  return labels[value] || value.replace(/_/g, ' ')
}

function filterAndSortMentors(
  mentors: MentorProfileResponse[],
  filters: {
    minRating?: number
    maxRate?: number
    availability?: string
    primaryDomain?: string
    skillKeyword?: string
    sortBy: string
    sortDir: string
  }
) {
  const domain = filters.primaryDomain?.toLocaleLowerCase()
  const skill = filters.skillKeyword?.toLocaleLowerCase()

  const filtered = mentors.filter((mentor) => {
    if (filters.minRating && (mentor.averageRating || 0) < filters.minRating) return false
    if (filters.maxRate && (mentor.hourlyRateMxc == null || mentor.hourlyRateMxc > filters.maxRate)) return false
    if (filters.availability && mentor.availability !== filters.availability) return false
    if (domain && !mentor.primaryDomain?.toLocaleLowerCase().includes(domain)) return false
    if (skill && !(mentor.skills || []).some((item) => item.toLocaleLowerCase().includes(skill))) return false
    return true
  })

  return [...filtered].sort((left, right) => {
    const leftValue = getSortableValue(left, filters.sortBy)
    const rightValue = getSortableValue(right, filters.sortBy)
    return filters.sortDir === 'asc' ? leftValue - rightValue : rightValue - leftValue
  })
}

function getSortableValue(mentor: MentorProfileResponse, sortBy: string) {
  switch (sortBy) {
    case 'totalReviews':
      return mentor.totalReviews || 0
    case 'yearsOfExperience':
      return mentor.yearsOfExperience || 0
    case 'hourlyRateMxc':
      return mentor.hourlyRateMxc ?? Number.MAX_SAFE_INTEGER
    default:
      return mentor.averageRating || 0
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function getSafeAvatarUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}
