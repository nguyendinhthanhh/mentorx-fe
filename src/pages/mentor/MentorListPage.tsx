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
    <div className="topcv-job-font min-h-screen bg-[#F8FAFC] text-gray-900">
            <section className="bg-gradient-to-b from-indigo-50 to-[#F8FAFC] border-b border-gray-200 pb-8 pt-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Find the right mentor</h1>
             <p className="mt-4 text-lg text-gray-600">Learn from verified experts and accelerate your growth.</p>
          </div>
          
          {/* Main Composite Search Bar */}
          <div className="flex flex-col xl:flex-row items-center rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition-all focus-within:border-[#4f46e5] focus-within:ring-4 focus-within:ring-indigo-50">
            {/* Keyword */}
            <div className="relative flex w-full xl:w-2/5 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search mentor by name, expertise..."
                className="w-full bg-transparent pl-3 text-[15px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-4 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Domain */}
            <div className="relative flex w-full xl:w-1/4 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Briefcase className="h-5 w-5 shrink-0 text-gray-400" />
              <select
                value={primaryDomain || ''}
                onChange={(e) => { setPrimaryDomain(e.target.value || undefined); setPage(0); }}
                className="w-full appearance-none bg-transparent pl-3 pr-8 text-[15px] font-medium text-gray-900 outline-none cursor-pointer"
              >
                <option value="">Any domain</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-gray-400" />
            </div>

            {/* Skill */}
            <div className="relative flex w-full xl:w-1/4 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Code2 className="h-5 w-5 shrink-0 text-gray-400" />
              <select
                value={skillKeyword || ''}
                onChange={(e) => { setSkillKeyword(e.target.value || undefined); setPage(0); }}
                className="w-full appearance-none bg-transparent pl-3 pr-8 text-[15px] font-medium text-gray-900 outline-none cursor-pointer"
              >
                <option value="">Any skill</option>
                {skills.slice(0, 60).map((s) => (
                  <option key={s.id} value={s.labelEn}>{s.labelEn}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-gray-400" />
            </div>

            {/* Search CTA */}
            <div className="w-full xl:w-auto px-2 mt-2 xl:mt-0 shrink-0">
              <button 
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-8 text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Find Mentors
              </button>
            </div>
          </div>

          {/* Secondary Filters Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
             <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mr-2">Filters:</span>
                
                <select
                  value={minRating?.toString() || ''}
                  onChange={(e) => { setMinRating(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Rating</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                </select>

                <select
                  value={maxRate?.toString() || ''}
                  onChange={(e) => { setMaxRate(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Budget</option>
                  {RATE_OPTIONS.filter(o => o.value).map(o => (
                    <option key={o.label} value={o.value?.toString()}>{o.label}</option>
                  ))}
                </select>

                <select
                  value={availability || ''}
                  onChange={(e) => { setAvailability(e.target.value || undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Availability</option>
                  {AVAILABILITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {activeFilterCount > 0 && (
                  <button onClick={clearSearchAndFilters} className="text-[13px] font-bold text-rose-600 hover:text-rose-700 transition px-2">
                    Clear all
                  </button>
                )}
             </div>

             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => applySort(e.target.value)}
                    className="appearance-none border-none bg-transparent py-2 pl-2 pr-8 text-[14px] font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
             </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Find the right mentor</h1>
            <p className="mt-2 text-base text-gray-700">
              Learn from verified experts and accelerate your growth.
            </p>
          </div>
          <div className="flex w-full items-center gap-4 sm:w-auto">
             <div className="hidden md:flex items-center gap-3">
                <div className="flex -space-x-3">
                   <img src={mentorFallbackImages[0]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                   <img src={mentorFallbackImages[1]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                   <img src={mentorFallbackImages[2]} className="w-10 h-10 rounded-full border-2 border-[#FFFFFF] object-cover" />
                </div>
                <div className="text-sm">
                   <p className="font-semibold text-gray-900">{totalMentors} approved mentors</p>
                   <p className="text-gray-500">in this marketplace</p>
                </div>
             </div>
          </div>
        </div>

        {isLoading ? (
          <MentorGridSkeleton />
        ) : mentors.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4f46e5] hover:shadow-xl relative">
      {/* Subtle Cover Background */}
      <div className="h-20 w-full bg-gradient-to-r from-indigo-50 to-slate-100"></div>
      
      {/* Avatar Container */}
      <div className="px-6 relative flex justify-between items-end -mt-10 mb-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-50 shadow-sm relative z-10 pointer-events-none">
           <img src={image} alt={name} className="h-full w-full object-cover" />
        </div>
        <div className="mb-2 relative z-10 pointer-events-none">
           <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isTopRated ? 'Top Rated' : 'Verified'}
           </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6">
        {/* Name and Headline */}
        <h2 className="text-[17px] font-bold text-gray-900 group-hover:text-[#4f46e5] transition-colors truncate">
           <Link to={`/mentors/${mentor.userId}`} className="focus:outline-none">
             <span className="absolute inset-0 z-0" aria-hidden="true" />
             {name}
           </Link>
        </h2>
        <p className="mt-1 text-[13px] font-medium text-gray-600 line-clamp-1">{headline}</p>
        
        {/* Rating and Metrics */}
        <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-gray-700">
           <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
           {rating} <span className="font-medium text-gray-500">({reviews} reviews)</span>
        </div>

        {/* Bio */}
        <p className="mt-4 text-[13px] leading-relaxed text-gray-600 line-clamp-3">
          {/* @ts-ignore */}
          {mentor.bio || `I help individuals and teams master their craft, build scalable solutions, and accelerate their careers.`}
        </p>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
           <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-gray-700">
             {mentor.primaryDomain || 'Software Engineering'}
           </span>
           <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-gray-700">
             Consulting
           </span>
        </div>

        <div className="mt-auto pt-6">
           {/* Rate and Availability */}
           <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
              <div>
                 <span className="text-[16px] font-black text-[#4f46e5]">{rate}</span>
                 <span className="text-[11px] text-gray-500 font-medium"> / hr</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                 <Clock3 className="h-3.5 w-3.5" />
                 {availability}
              </div>
           </div>

           {/* Full Width CTA */}
           <Link to={`/mentors/${mentor.userId}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-indigo-700 relative z-20">
              View Profile
              <ArrowRight className="h-4 w-4" />
           </Link>
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
    <label className="relative block min-w-0 sm:min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3 pr-9 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </label>
  )
}

function MentorGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
           <div className="h-20 w-full bg-slate-100 animate-pulse"></div>
           <div className="px-6 -mt-10 mb-4">
              <div className="h-20 w-20 rounded-2xl bg-slate-200 border-4 border-white animate-pulse" />
           </div>
           <div className="px-6 flex-1 space-y-4">
              <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="space-y-2 mt-4">
                 <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                 <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                 <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
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
