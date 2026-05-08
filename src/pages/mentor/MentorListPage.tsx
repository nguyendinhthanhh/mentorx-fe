import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Award,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MessageCircle,
  Search,
  Star,
  TrendingUp,
  Users,
  X,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { formatCurrency } from '@/utils/formatters'
import { MentorProfileResponse } from '@/types'

const AVAILABILITY_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'WEEKENDS', label: 'Weekends' },
  { value: 'FLEXIBLE', label: 'Flexible' },
]

const SORT_OPTIONS = [
  { value: 'averageRating', label: 'Top Rated' },
  { value: 'totalReviews', label: 'Most Reviewed' },
  { value: 'hourlyRateMxc', label: 'Price: Low to High' },
  { value: 'yearsOfExperience', label: 'Most Experienced' },
]

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'tech', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
]

const mentorFallbackImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
]

const pageSize = 12

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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchText.trim()), 350)
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
    ['mentors', page, sortBy, sortDir, minRating, maxRate, availability],
    () => {
      if (minRating || maxRate || availability) {
        return mentorApi.searchMentors({
          minRating,
          maxHourlyRate: maxRate,
          availability,
          page,
          size: pageSize,
          sortBy,
          sortDir,
        })
      }
      return mentorApi.getAllApprovedMentors({ page, size: pageSize, sortBy, sortDir })
    },
    { enabled: debouncedSearch.length < 2, retry: false }
  )

  const isSearchMode = debouncedSearch.length >= 2
  const mentors = isSearchMode ? textResults : pagedData?.content
  const isLoading = isSearchMode ? textLoading : pageLoading
  const totalPages = isSearchMode ? 1 : (pagedData?.totalPages || 1)
  const totalMentors = isSearchMode ? mentors?.length || 0 : pagedData?.totalElements || 0
  const activeFilterCount = [minRating, maxRate, availability].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0

  const clearFilters = () => {
    setMinRating(undefined)
    setMaxRate(undefined)
    setAvailability(undefined)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find the Perfect Mentor for You
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with {totalMentors}+ verified industry experts to accelerate your career growth
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, skills, or expertise..."
                className="w-full h-14 pl-14 pr-32 rounded-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              />
              {searchText ? (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              ) : (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                  Search
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-gray-600">Popular:</span>
              {CATEGORY_FILTERS.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(0)
                  }}
                  className="h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={minRating || ''}
                  onChange={(e) => {
                    setMinRating(e.target.value ? Number(e.target.value) : undefined)
                    setPage(0)
                  }}
                  className="h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">All Ratings</option>
                  {[4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}+ Stars
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={availability || ''}
                  onChange={(e) => {
                    setAvailability(e.target.value || undefined)
                    setPage(0)
                  }}
                  className="h-10 pl-4 pr-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">All Availability</option>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white flex items-center gap-2 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                More Filters
                {hasActiveFilters && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8">
        {/* Results Info */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {isSearchMode
              ? `${totalMentors} results for "${debouncedSearch}"`
              : `Showing ${totalMentors} mentors`}
          </p>
        </div>

        {/* Mentor Grid */}
        {isLoading ? (
          <MentorGridSkeleton />
        ) : mentors && mentors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor, index) => (
              <MentorCard key={mentor.userId} mentor={mentor} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-600 mb-6">
              {isSearchMode || hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'No mentors available at the moment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isSearchMode && totalPages > 1 && (
          <div className="mt-12">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>
    </div>
  )
}

function MentorCard({ mentor, index }: { mentor: MentorProfileResponse; index: number }) {
  const name = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
  const headline = mentor.headline || 'Expert mentor'
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'N/A'
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]

  return (
    <article className="group bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img
              src={image}
              alt={name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            {mentor.isFeatured && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{headline}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-gray-900">{rating}</span>
            <span className="text-gray-500">({mentor.totalReviews || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>{mentor.yearsOfExperience || 0}+ years</span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900">
            {mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Flexible'}
            {mentor.hourlyRateMxc && <span className="text-sm font-normal text-gray-500"> /hour</span>}
          </div>
          {mentor.hourlyRateMxc && (
            <p className="text-xs text-gray-500 mt-1">≈ {formatCurrency(mentor.hourlyRateMxc * 23000)} VND</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
        <Link
          to={`/mentors/${mentor.userId}`}
          className="flex-1 h-10 px-4 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center hover:bg-blue-700 transition-colors text-sm"
        >
          View Profile
        </Link>
        <button className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-white transition-colors">
          <MessageCircle className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </article>
  )
}

function MentorGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mb-4" />
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  const visiblePages = Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
    return totalPages <= 7 ? index : Math.max(0, Math.min(page - 3, totalPages - 7)) + index
  })

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={`min-w-10 h-10 px-3 rounded-lg font-medium transition-colors ${
            page === pageNumber
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {pageNumber + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function formatAvailability(value?: string) {
  if (!value) return 'Flexible'
  return AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label || value.replace(/_/g, ' ')
}
