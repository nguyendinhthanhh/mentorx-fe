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
  CheckCircle2,
  Code2,
  ExternalLink,
  ShieldCheck,
  Lightbulb,
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
    <div className="topcv-job-font min-h-screen bg-[#F8FAFC] text-[#111827]">
      <section className="sticky top-16 z-30 border-b border-[#E5E7EB] bg-[#FFFFFF]/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search mentor name, expertise, career goal..."
                className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] pl-12 pr-12 text-sm font-medium text-[#111827] outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F9FAFB] hover:text-[#4B5563]"
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F9FAFB]"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#111827] px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="mt-4 grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] p-4 md:grid-cols-6 shadow-sm">
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
                  className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-sm font-medium text-[#4B5563] transition hover:bg-[#F9FAFB]"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Find the right mentor</h1>
            <p className="mt-2 text-base text-[#4B5563]">
              Learn from verified experts and accelerate your growth.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-3">
                <div className="flex -space-x-3">
                   <img src={mentorFallbackImages[0]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                   <img src={mentorFallbackImages[1]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                   <img src={mentorFallbackImages[2]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                </div>
                <div className="text-sm">
                   <p className="font-semibold text-[#111827]">{totalMentors} approved mentors</p>
                   <p className="text-[#9CA3AF]">in this marketplace</p>
                </div>
             </div>
          </div>
        </div>

        {isLoading ? (
          <MentorGridSkeleton />
        ) : mentors.length > 0 ? (
          <div className="flex flex-col gap-5">
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
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'New'
  const reviews = mentor.totalReviews || 0
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]
  const rate = mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Flexible'
  const responseTime = mentor.responseTimeHours ? `Replies within ${mentor.responseTimeHours}h` : 'Replies within 12h'
  const availability = formatAvailability(mentor.availability)
  const isTopRated = mentor.averageRating && mentor.averageRating >= 4.8

  return (
    <article className="flex flex-col sm:flex-row items-start gap-5 p-5 sm:p-6 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] transition-all hover:border-gray-300">
      
      {/* Avatar Column */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full border border-[#E5E7EB] bg-[#F8FAFC]">
           <img src={image} alt={name} className="h-full w-full object-cover" />
        </div>
      </div>

      {/* Main Info Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-start">
        <div className="flex items-center gap-2">
           <h2 className="text-lg font-bold text-[#111827] truncate">{name}</h2>
           {isTopRated ? (
             <span className="flex items-center gap-0.5 text-xs font-semibold text-[#15803D]">
               <ShieldCheck className="h-3.5 w-3.5" />
             </span>
           ) : (
             <span className="flex items-center gap-0.5 text-xs font-semibold text-[#15803D]">
               <CheckCircle2 className="h-3.5 w-3.5" />
             </span>
           )}
        </div>
        <p className="mt-0.5 text-sm font-medium text-[#4B5563] truncate">{headline}</p>
        
        {/* Trust Line */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[#9CA3AF]">
           <span className="flex items-center gap-1 text-[#111827]">
             <Star className="h-3.5 w-3.5 fill-current" />
             {rating}
           </span>
           <span>·</span>
           <span>{reviews} reviews</span>
           <span>·</span>
           <span>{mentor.totalJobsDone || 0} completed jobs</span>
           <span>·</span>
           <span>{responseTime}</span>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm text-[#4B5563] line-clamp-2">
          {/* @ts-ignore */}
          {mentor.bio || `I help individuals and teams master their craft, build scalable solutions, and accelerate their careers.`}
        </p>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap gap-2">
           <span className="rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-xs font-medium text-[#4B5563]">
             {mentor.primaryDomain || 'Software Engineering'}
           </span>
           <span className="rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-xs font-medium text-[#4B5563]">
             Consulting
           </span>
        </div>
      </div>

      {/* Right Column: Pricing & Actions */}
      <div className="shrink-0 flex flex-col items-start sm:items-end w-full sm:w-[180px] pt-4 sm:pt-0">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-[#111827]">{rate}</span>
          <span className="text-xs text-[#9CA3AF]">/ session</span>
        </div>
        <span className="mt-1 text-xs font-medium text-[#4B5563]">{availability}</span>
        
        <div className="mt-5 w-full flex flex-col gap-2">
          <Link
            to={`/mentors/${mentor.userId}`}
            className="flex w-full items-center justify-center rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-[#FFFFFF] transition hover:bg-[#1F2937]"
          >
            View profile
          </Link>
          <a
            href="#"
            className="flex w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#4B5563] transition hover:bg-[#F9FAFB]"
          >
            Portfolio
          </a>
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
        className="h-12 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3 pr-9 text-sm font-medium text-[#111827] outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
    </label>
  )
}

function MentorGridSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex flex-col sm:flex-row items-start gap-5 p-5 sm:p-6 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF]">
           <div className="shrink-0 flex flex-col items-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#F9FAFB] animate-pulse border border-[#E5E7EB]" />
           </div>
           <div className="flex-1 w-full space-y-3">
              <div className="h-5 w-1/3 bg-[#F9FAFB] rounded animate-pulse" />
              <div className="h-4 w-1/4 bg-[#F9FAFB] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-[#F9FAFB] rounded animate-pulse mt-4" />
              <div className="h-3 w-full bg-[#F9FAFB] rounded animate-pulse mt-2" />
           </div>
           <div className="shrink-0 w-full sm:w-[180px] space-y-3 pt-4 sm:pt-0">
              <div className="h-6 w-20 bg-[#F9FAFB] rounded animate-pulse sm:ml-auto" />
              <div className="h-10 w-full bg-[#F9FAFB] rounded-lg animate-pulse mt-4" />
           </div>
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
