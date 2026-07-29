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

  const cardGradients = [
    'from-blue-600 to-cyan-500',
    'from-purple-600 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-fuchsia-600 to-purple-600',
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans">
      {/* Compact Premium Hero Section */}
      <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white opacity-80"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
            Master your craft. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">Learn from the best.</span>
          </h1>
          <p className="text-[15px] text-gray-500 font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
            Skip the trial and error. Get personalized guidance, portfolio reviews, and interview prep from leaders at top tech companies.
          </p>

          {/* Modern Command-Bar Search */}
          <div className="max-w-3xl mx-auto bg-white p-1.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-gray-200 flex flex-col md:flex-row items-center gap-1.5 transition-all focus-within:shadow-[0_8px_30px_rgb(79,70,229,0.1)] focus-within:border-indigo-300">
            <div className="w-full relative flex items-center px-4 py-2 bg-gray-50/80 rounded-xl hover:bg-gray-100 transition-colors">
               <Search className="w-4 h-4 text-gray-400 shrink-0" />
               <input 
                 value={searchText}
                 onChange={e => setSearchText(e.target.value)}
                 placeholder="Search by name, role, or company..." 
                 className="w-full bg-transparent border-none text-[14px] font-bold text-gray-900 placeholder:text-gray-400 focus:ring-0 pl-3 py-1.5 outline-none"
               />
               {searchText && (
                 <button onClick={() => setSearchText('')} className="absolute right-3 p-1 rounded-full text-gray-400 hover:bg-gray-200">
                   <X className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>
            
            <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
            
            <div className="w-full md:w-auto shrink-0 relative flex items-center px-4 py-2 bg-gray-50/80 rounded-xl hover:bg-gray-100 transition-colors">
               <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
               <select 
                 value={primaryDomain || ''}
                 onChange={e => { setPrimaryDomain(e.target.value || undefined); setPage(0); }}
                 className="appearance-none bg-transparent border-none text-[14px] font-bold text-gray-900 focus:ring-0 pl-3 pr-8 py-1.5 outline-none cursor-pointer w-full md:w-40"
               >
                 <option value="">All Domains</option>
                 {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
               </select>
               <ChevronDown className="absolute right-4 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <button className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[14px] font-black hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap active:scale-95">
              Find Mentors
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-y border-gray-200 py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
            <button 
              onClick={clearSearchAndFilters}
              className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-extrabold transition-all ${activeFilterCount === 0 && !isSearchMode ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
            >
              All Mentors
            </button>
            <div className="h-6 w-px bg-gray-300 mx-1 shrink-0"></div>
            
            <select 
              value={minRating || ''} 
              onChange={e => { setMinRating(e.target.value ? Number(e.target.value) : undefined); setPage(0); }} 
              className={`shrink-0 appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-extrabold px-5 py-2.5 pr-10 rounded-full border-none outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat ${minRating ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100' : ''}`}
            >
              <option value="">Rating</option>
              <option value="4">4.0 & Up</option>
              <option value="3">3.0 & Up</option>
            </select>

            <select 
              value={maxRate || ''} 
              onChange={e => { setMaxRate(e.target.value ? Number(e.target.value) : undefined); setPage(0); }} 
              className={`shrink-0 appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-extrabold px-5 py-2.5 pr-10 rounded-full border-none outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat ${maxRate ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100' : ''}`}
            >
              <option value="">Budget</option>
              {RATE_OPTIONS.filter(o => o.value).map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
            </select>

            <select 
              value={availability || ''} 
              onChange={e => { setAvailability(e.target.value || undefined); setPage(0); }} 
              className={`shrink-0 appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-extrabold px-5 py-2.5 pr-10 rounded-full border-none outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat ${availability ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100' : ''}`}
            >
              <option value="">Availability</option>
              {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[14px] font-medium text-gray-500 hidden lg:inline-block">
              <strong className="text-gray-900 font-black">{totalMentors}</strong> experts
            </span>
            <select 
              value={sortBy} 
              onChange={e => applySort(e.target.value)} 
              className="appearance-none bg-white text-gray-900 text-[13px] font-extrabold px-5 py-2.5 pr-10 rounded-full border border-gray-200 hover:border-gray-300 outline-none cursor-pointer shadow-sm transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat"
            >
               {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <MentorGridSkeleton />
        ) : mentors.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mentors.map((mentor, index) => (
              <MentorCard key={mentor.userId} mentor={mentor} index={index} bgGradient={cardGradients[index % cardGradients.length]} />
            ))}
          </div>
        ) : (
          <EmptyState isFiltered={isSearchMode || activeFilterCount > 0} onClear={clearSearchAndFilters} />
        )}

        {!isSearchMode && totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </main>
    </div>
  )
}

function MentorCard({ mentor, index, bgGradient }: { mentor: MentorProfileResponse; index: number; bgGradient: string }) {
  const name = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
  const headline = mentor.headline || 'Expert Professional'
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'New'
  const reviews = mentor.totalReviews || 0
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]
  const rate = mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Contact'
  const isTopRated = mentor.averageRating && mentor.averageRating >= 4.8

  return (
    <article className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Abstract Banner */}
      <div className={`h-28 w-full bg-gradient-to-br ${bgGradient} relative`}>
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      </div>
      
      {/* Avatar */}
      <div className="relative px-6 flex justify-center -mt-14">
        <div className="relative">
          <div className="h-28 w-28 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
            <img src={image} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          {isTopRated && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1 border-2 border-white whitespace-nowrap">
               <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> TOP 1%
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-5 pb-6 text-center">
        <Link to={`/mentors/${mentor.userId}`} className="focus:outline-none">
          <h3 className="text-[20px] font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{name}</h3>
        </Link>
        <p className="text-[14px] font-bold text-gray-500 mt-1 line-clamp-1">{headline}</p>
        
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 text-gray-700">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-extrabold text-[13px]">{rating}</span>
            <span className="text-gray-400 text-[12px] font-medium">({reviews})</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 text-gray-700">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-bold text-[13px] truncate max-w-[100px]">{mentor.primaryDomain || 'General'}</span>
          </div>
        </div>

        <p className="mt-5 text-[14px] text-gray-600 leading-relaxed line-clamp-2 font-medium">
          {/* @ts-ignore */}
          {mentor.bio || `Experienced professional helping you master your craft, build scalable solutions, and advance your career.`}
        </p>
      </div>

      <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
         <div className="text-left flex flex-col">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Session</span>
           <span className="text-[16px] font-black text-gray-900">{rate}</span>
         </div>
         <Link to={`/mentors/${mentor.userId}`} className="bg-white border border-gray-200 text-gray-900 px-6 py-2.5 rounded-xl text-[13px] font-extrabold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm">
           View Profile
         </Link>
      </div>
    </article>
  )
}

function MentorGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
           <div className="h-28 w-full bg-gray-100 animate-pulse" />
           <div className="px-6 flex justify-center -mt-14">
              <div className="h-28 w-28 rounded-full border-4 border-white bg-gray-200 animate-pulse" />
           </div>
           <div className="flex-1 flex flex-col items-center px-6 pt-5 pb-6 space-y-3">
              <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="flex gap-2 mt-2">
                 <div className="h-8 w-16 bg-gray-50 rounded-lg animate-pulse" />
                 <div className="h-8 w-24 bg-gray-50 rounded-lg animate-pulse" />
              </div>
              <div className="w-full space-y-2 mt-4">
                 <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                 <div className="h-3 w-4/5 bg-gray-50 rounded animate-pulse mx-auto" />
              </div>
           </div>
           <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/50 flex justify-between">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />
           </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-24 text-center">
      <div className="mb-5 rounded-full bg-gray-50 p-5 ring-1 ring-gray-100">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-black text-gray-900">No mentors found</h3>
      <p className="mt-2 max-w-sm text-[15px] font-medium text-gray-500 leading-relaxed">
        {isFiltered
          ? "We couldn't find any experts matching your criteria. Try adjusting your filters or search terms."
          : "There are no approved mentors available right now."}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-8 rounded-xl bg-gray-900 px-8 py-3 text-[14px] font-black text-white shadow-sm transition-colors hover:bg-indigo-600"
        >
          Clear all filters
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
  if (totalPages <= 1) return null

  const visiblePages = Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
    return totalPages <= 7 ? index : Math.max(0, Math.min(page - 3, totalPages - 7)) + index
  })

  return (
    <div className="inline-flex items-center gap-1.5 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={`h-10 min-w-[40px] rounded-xl px-3 text-[14px] font-black transition-all ${
            page === pageNumber
              ? 'bg-gray-900 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {pageNumber + 1}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

function formatAvailability(value?: string) {
  if (!value) return 'Flexible'
  return AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label || value.replace(/_/g, ' ')
}
