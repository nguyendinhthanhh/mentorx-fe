import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { formatCurrency } from '@/utils/formatters'
import { MentorProfileResponse } from '@/types'

const PAGE_SIZE = 12

const AVAILABILITY_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'WEEKENDS', label: 'Weekends' },
  { value: 'FLEXIBLE', label: 'Flexible' },
]

const SORT_OPTIONS = [
  { value: 'averageRating', label: 'Top rated', direction: 'desc' },
  { value: 'totalReviews', label: 'Most reviewed', direction: 'desc' },
  { value: 'yearsOfExperience', label: 'Most experienced', direction: 'desc' },
  { value: 'hourlyRateMxc', label: 'Lowest rate', direction: 'asc' },
]

const RATE_OPTIONS = [
  { label: 'Any rate', value: undefined },
  { label: 'Up to 400 MXC', value: 400 },
  { label: 'Up to 500 MXC', value: 500 },
  { label: 'Up to 700 MXC', value: 700 },
]

const mentorFallbackImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
]

export default function MentorListPage() {
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

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim())
      setPage(0)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchText])

  const { data: textResults, isLoading: textLoading } = useQuery(
    ['mentors-text', debouncedSearch],
    () => mentorApi.searchMentorsFullText(debouncedSearch),
    { enabled: debouncedSearch.length >= 2, retry: false }
  )

  const { data: pagedData, isLoading: pageLoading } = useQuery(
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
  const mentors = isSearchMode ? textResults || [] : pagedData?.content || []
  const isLoading = isSearchMode ? textLoading : pageLoading
  const totalPages = isSearchMode ? 1 : pagedData?.totalPages || 1
  const totalMentors = isSearchMode ? mentors.length : pagedData?.totalElements || 0
  const activeFilterCount = [minRating, maxRate, availability, primaryDomain, skillKeyword].filter(Boolean).length

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
    clearFilters()
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search mentor name, expertise, career goal..."
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SelectControl label="Sort" value={sortBy} onChange={applySort} options={SORT_OPTIONS} />
              <button
                type="button"
                onClick={() => setFilterOpen((open) => !open)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-6">
              <SelectControl
                label="Domain"
                value={primaryDomain || ''}
                onChange={(value) => {
                  setPrimaryDomain(value || undefined)
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'Any domain' },
                  ...categories.map((category) => ({ value: category.name, label: category.name })),
                ]}
              />
              <SelectControl
                label="Skill"
                value={skillKeyword || ''}
                onChange={(value) => {
                  setSkillKeyword(value || undefined)
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'Any skill' },
                  ...skills.slice(0, 60).map((skill) => ({ value: skill.labelEn, label: skill.labelEn })),
                ]}
              />
              <SelectControl
                label="Rating"
                value={minRating?.toString() || ''}
                onChange={(value) => {
                  setMinRating(value ? Number(value) : undefined)
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'Any rating' },
                  { value: '4', label: '4+ stars' },
                  { value: '3', label: '3+ stars' },
                ]}
              />
              <SelectControl
                label="Budget"
                value={maxRate?.toString() || ''}
                onChange={(value) => {
                  setMaxRate(value ? Number(value) : undefined)
                  setPage(0)
                }}
                options={RATE_OPTIONS.map((item) => ({ value: item.value?.toString() || '', label: item.label }))}
              />
              <SelectControl
                label="Availability"
                value={availability || ''}
                onChange={(value) => {
                  setAvailability(value || undefined)
                  setPage(0)
                }}
                options={[{ value: '', label: 'Any availability' }, ...AVAILABILITY_OPTIONS]}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearSearchAndFilters}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Reset search
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Mentors</h1>
            <p className="mt-1 text-sm text-slate-600">
              {isSearchMode ? `${totalMentors} result(s) for "${debouncedSearch}"` : `${totalMentors} approved mentor(s)`}
            </p>
          </div>
          {(isSearchMode || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={clearSearchAndFilters}
              className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Clear search
            </button>
          )}
        </div>

        {isLoading ? (
          <MentorGridSkeleton />
        ) : mentors.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {mentors.map((mentor, index) => (
              <MentorCard key={mentor.userId} mentor={mentor} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState isFiltered={isSearchMode || activeFilterCount > 0} onClear={clearSearchAndFilters} />
        )}

        {!isSearchMode && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </main>
    </div>
  )
}

function MentorCard({ mentor, index }: { mentor: MentorProfileResponse; index: number }) {
  const name = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
  const headline = mentor.headline || 'Expert mentor'
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'N/A'
  const reviews = mentor.totalReviews || 0
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]
  const rate = mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Flexible'
  const responseTime = mentor.responseTimeHours ? `Usually responds within ${mentor.responseTimeHours} hours` : 'Response time will be calculated after more activity.'
  const availability = formatAvailability(mentor.availability)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
      <div className="p-5">
        <div className="flex gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
            <img src={image} alt={name} className="h-full w-full object-cover" />
            {mentor.isFeatured && (
              <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-950">{name}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{headline}</p>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-700">
                {rating}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge icon={Star} label={`${reviews} reviews`} tone="amber" />
              <Badge icon={Briefcase} label={`${mentor.yearsOfExperience || 0}+ yrs`} tone="blue" />
              <Badge icon={Clock3} label={responseTime} tone="emerald" />
              <Badge icon={CalendarClock} label={availability} tone="rose" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3">
          <MiniStat label="Rate" value={rate} />
          <MiniStat label="Success" value={mentor.successRate ? `${Math.round(mentor.successRate)}%` : '98%'} />
          <MiniStat label="Done" value={(mentor.totalJobsDone || 0).toString()} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            to={`/mentors/${mentor.userId}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700"
          >
            View profile
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            aria-label={`Message ${name}`}
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="relative block min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  )
}

function Badge({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  tone: 'blue' | 'amber' | 'emerald' | 'rose'
}) {
  const toneClass = {
    blue: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  }[tone]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function MentorGridSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-11 animate-pulse rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Users className="mx-auto h-14 w-14 text-slate-300" />
      <h3 className="mt-4 text-xl font-black text-slate-950">No mentors found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {isFiltered
          ? 'Try a broader keyword, remove one filter, or search by a common skill.'
          : 'There are no approved mentors available right now.'}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          Clear search
        </button>
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const visiblePages = Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
    return totalPages <= 7 ? index : Math.max(0, Math.min(page - 3, totalPages - 7)) + index
  })

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-black transition ${
            page === pageNumber
              ? 'bg-indigo-600 text-white'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {pageNumber + 1}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function formatAvailability(value?: string) {
  if (!value) return 'Flexible'
  return AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label || value.replace(/_/g, ' ')
}
