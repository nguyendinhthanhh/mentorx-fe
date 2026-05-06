import { useQuery } from 'react-query'
import { mentorApi } from '@/api/mentorApi'
import { formatCurrency } from '@/utils/formatters'
import { Star, Clock, Search, Users, Award, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function MentorListPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery('mentors', () =>
    mentorApi.getAllApprovedMentors({ page: 0, size: 20 })
  )

  const filteredMentors = data?.content.filter((mentor) =>
    !search ||
    mentor.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    mentor.headline?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Find your Expert</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Connect with industry experts to accelerate your growth</p>
        </div>
        <Link
          to="/mentor/profile"
          className="inline-flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 dark:shadow-none hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all"
        >
          <Award className="w-4 h-4" />
          Become a Mentor
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentors by name, expertise or industry..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500/30 transition-all text-base font-medium text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Mentor Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 animate-pulse">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-2/3 mb-3" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-full" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMentors && filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.userId}
              className="group bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
              
              <div className="flex items-start gap-5 mb-8 relative">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform duration-500">
                  {mentor.user?.avatarUrl ? (
                    <img src={mentor.user.avatarUrl} alt={mentor.user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-black">
                      {(mentor.user?.fullName || 'M').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white truncate tracking-tight">{mentor.user?.fullName}</h3>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 italic">{mentor.headline || 'Mentor'}</p>
                  {mentor.isFeatured && (
                    <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <Award className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Rate
                  </span>
                  <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                    {mentor.hourlyRateMxc ? `${formatCurrency(mentor.hourlyRateMxc)}` : 'Flexible'}
                    <span className="text-xs font-medium text-gray-400 ml-1">/hr</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Experience</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{mentor.yearsOfExperience || 0} Years+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Rating
                  </span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {mentor.averageRating?.toFixed(1) || 'N/A'}
                    <span className="text-xs font-medium text-gray-400 ml-1">({mentor.totalReviews})</span>
                  </span>
                </div>
              </div>

              <Link 
                to={`/mentors/${mentor.userId}`}
                className="block w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-200 dark:group-hover:shadow-none transition-all text-center"
              >
                View Expert Profile
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-20 text-center shadow-sm">
          <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-gray-700">
            <Users className="w-10 h-10 text-gray-200 dark:text-gray-700" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">No mentors found</h3>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-8 max-w-xs mx-auto italic">
            {search ? 'Try adjusting your search criteria' : 'Be the first to share your expertise on MentorX!'}
          </p>
          <Link to="/mentor/profile" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all">
            Apply as a Mentor →
          </Link>
        </div>
      )}
    </div>
  )
}
