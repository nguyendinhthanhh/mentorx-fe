import { homeApi } from '@/api/homeApi'
import { useQuery } from 'react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { 
  Search, MapPin, Star, ChevronRight, LayoutGrid, ChevronDown, 
  Bookmark, Briefcase, Code, Megaphone, PenTool, Users, TrendingUp, 
  Database, Package, Rocket, Handshake, CheckCircle2 
} from 'lucide-react'

const formatBudget = (job: any, fallback: string) => {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    return `${job.budgetMinMxc.toLocaleString('en-US')} - ${job.budgetMaxMxc.toLocaleString('en-US')} VND`
  }
  if (job.hourlyRateMxc) return `${job.hourlyRateMxc.toLocaleString('en-US')} VND/hr`
  return fallback
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'it': <Code className="h-7 w-7 text-indigo-500" />,
  'marketing': <Megaphone className="h-7 w-7 text-blue-500" />,
  'business': <Briefcase className="h-7 w-7 text-emerald-500" />,
  'design': <PenTool className="h-7 w-7 text-purple-500" />,
  'hr': <Users className="h-7 w-7 text-pink-500" />,
  'finance': <TrendingUp className="h-7 w-7 text-amber-500" />,
  'data': <Database className="h-7 w-7 text-cyan-500" />,
  'product': <Package className="h-7 w-7 text-rose-500" />,
}

export default function HomePage() {
  const { t } = useI18n()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const { user } = useAuthStore()
  const isAuthenticated = !!user

  const { data, isLoading } = useQuery(['home-data', isAuthenticated], () => homeApi.getHomeData(isAuthenticated), {
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const searchHref = useMemo(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (location.trim()) params.set('location', location.trim())
    const query = params.toString()
    return query ? `/jobs?${query}` : '/jobs'
  }, [keyword, location])

  const jobs = data?.featuredJobs || []
  const mentors = data?.featuredMentors || []
  const categories = data?.categories || []
  const stats = data?.stats || { users: 0, openJobs: 0, mentors: 0, successfulMatches: 0 }

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-slate-950">
      {/* HERO SECTION */}
      <section className="bg-white pb-16 pt-12 dark:bg-slate-950">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white lg:text-[54px]">
              {t('home.hero.titleLine1')}
              <br />
              {t('home.hero.titleLine2')}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-[1.6] text-gray-700 dark:text-slate-300">
              {t('home.hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-[#e2e6f5] bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center px-3">
                  <Search className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t('home.hero.searchPlaceholder')}
                    className="w-full bg-transparent pl-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden md:block dark:bg-slate-700"></div>
                <div className="hidden md:flex w-[160px] items-center px-3">
                  <MapPin className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={t('home.hero.locationPlaceholder')}
                    className="w-full bg-transparent pl-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden lg:block dark:bg-slate-700"></div>
                <div className="hidden lg:flex w-[140px] items-center justify-between px-3 cursor-pointer">
                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <LayoutGrid className="h-4 w-4" />
                      <span>{t('common.category')}</span>
                   </div>
                   <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
                <Link
                  to={searchHref}
                  className="ml-0 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-sm font-semibold text-white transition hover:bg-[#4338ca] sm:ml-2 sm:w-[120px]"
                >
                  {t('common.search')}
                </Link>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-2 px-1 text-xs text-gray-600 dark:text-slate-400">
              <span className="font-semibold text-gray-900 dark:text-white">{t('home.hero.quickSearch')}</span>
              {['IT', 'Marketing', 'Design', 'Data', 'Product', 'Interview Prep'].map((item) => (
                <Link key={item} to={`/jobs?q=${encodeURIComponent(item)}`} className="rounded-full border border-[#e2e6f5] bg-white px-3 py-1.5 transition hover:border-[#4f46e5] hover:text-[#4f46e5] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative min-h-[440px] hidden lg:flex items-center justify-center">
            {/* Background Blob */}
            <div className="absolute right-4 top-4 w-[380px] h-[400px] rounded-[40px] bg-gradient-to-br from-[#eceeff] to-[#d7dbfc] rotate-6 opacity-60"></div>
            <div className="absolute right-8 top-8 w-[380px] h-[400px] rounded-[40px] bg-[#4f46e5] -rotate-3 shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            {/* FPT Card */}
            <div className="absolute -left-6 top-16 w-[280px] rounded-2xl border border-white/40 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-[bounce_6s_ease-in-out_infinite] dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-orange-400 to-amber-500 text-[10px] font-bold text-white shadow-sm">FPT</div>
                   <span className="text-xs font-bold text-gray-800 dark:text-slate-200">FPT Software</span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{t('home.hero.companyCard.new')}</span>
              </div>
              <div className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{t('home.hero.companyCard.title')}</div>
              <div className="mt-1.5 flex gap-3 text-[11px] text-gray-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Hanoi</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {t('common.remote')}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-amber-500">{t('home.hero.companyCard.salary')}</div>
              <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-gray-700 font-medium dark:text-slate-300">
                <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">Java</span>
                <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">Spring Boot</span>
                <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">MySQL</span>
                <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">API</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[11px] font-bold text-[#4f46e5] cursor-pointer">{t('common.viewDetails')}</span>
                <Bookmark className="h-4 w-4 text-gray-400 cursor-pointer hover:text-[#4f46e5]" />
              </div>
            </div>

            {/* Mentor Card */}
            <div className="absolute -right-2 bottom-12 w-[240px] rounded-2xl border border-white/40 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-[bounce_5s_ease-in-out_infinite_reverse] dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex justify-end mb-2">
                 <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-600 uppercase tracking-wide">{t('home.hero.mentorCard.featured')}</span>
              </div>
              <div className="flex items-center gap-3">
                 <img src="https://i.pravatar.cc/150?u=12" alt="Avatar" className="h-12 w-12 rounded-full border-2 border-white shadow-sm object-cover" />
                 <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Nguyễn Hoàng Anh</div>
                    <div className="text-[9px] text-gray-600 mt-0.5 dark:text-slate-400">{t('home.hero.mentorCard.role')}<br/>MoMo</div>
                 </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-gray-800 dark:text-slate-200">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                4.9 <span className="font-medium text-gray-500">(128 {t('common.reviews')})</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-gray-700 font-medium dark:text-slate-300">
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">Leadership</span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">System Design</span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">Career Coaching</span>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#4f46e5] py-2 text-xs font-bold text-white hover:bg-[#4338ca] transition shadow-sm">{t('home.hero.mentorCard.book')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {categories.slice(0, 8).map((cat) => (
              <Link to={`/jobs?category=${cat.slug}`} key={cat.categoryId} className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 transition duration-300 transform hover:-translate-y-1 hover:shadow-lg dark:border dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40">
                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition mb-3 dark:bg-slate-800 dark:group-hover:bg-indigo-500/10">
                    {CATEGORY_ICONS[cat.slug] || <LayoutGrid className="h-7 w-7 text-indigo-500" />}
                 </div>
                 <span className="text-[13px] font-bold text-gray-900 text-center whitespace-pre-line dark:text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED JOBS */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            {isAuthenticated ? t('home.recommendedJobs.title') : t('home.featuredJobs.title')}
          </h2>
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            {isAuthenticated ? t('home.recommendedJobs.viewAll') : t('home.featuredJobs.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isAuthenticated && (
          <p className="-mt-3 mb-5 text-sm text-gray-700 dark:text-slate-300">
            {t('home.recommendedJobs.subtitle')}
          </p>
        )}
        
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-64 rounded-2xl bg-white animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
             ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e2e6f5] bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-700 dark:text-slate-200">{t('home.recommendedJobs.emptyTitle')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{t('home.recommendedJobs.emptyDescription')}</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/profile" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t('home.recommendedJobs.updateInterests')}
                  </Link>
                  <Link to="/jobs" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    {t('home.recommendedJobs.exploreJobs')}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-slate-400">{t('home.featuredJobs.empty')}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job: any) => {
              const clientName = job.clientName || job.client?.displayName || job.client?.fullName || t('common.company')
              const avatarUrl = job.clientAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random&color=fff&rounded=true&bold=true`
              const jobType = job.jobType ? job.jobType.replace(/_/g, ' ') : 'Hybrid'
              return (
              <Link key={job.jobId} to={`/jobs/${job.jobId}`} className="group flex flex-col justify-between rounded-2xl border border-transparent bg-white p-5 shadow-sm transition duration-300 hover:border-[#4f46e5] hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60">
                <div>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 flex items-center justify-center bg-white overflow-hidden p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <img src={avatarUrl} alt="logo" className="h-full w-full object-contain rounded-lg" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 line-clamp-1 dark:text-slate-300">{clientName}</span>
                      </div>
                  </div>
                  <p className="mt-4 text-[17px] font-bold text-gray-900 group-hover:text-[#4f46e5] transition line-clamp-2 dark:text-white dark:group-hover:text-indigo-300">{job.title}</p>
                  <div className="mt-2.5 flex gap-4 text-[13px] text-gray-600 font-medium dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t('common.remote')}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {jobType}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-amber-500">{formatBudget(job, t('common.negotiable'))}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-xs font-bold text-[#4f46e5]">{t('common.viewDetails')}</span>
                  <Bookmark className="h-5 w-5 text-gray-400 group-hover:text-[#4f46e5] transition" />
                </div>
              </Link>
            )})}
          </div>
        )}
      </section>

      {/* FEATURED MENTORS */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            {isAuthenticated ? t('home.recommendedMentors.title') : t('home.featuredMentors.title')}
          </h2>
          <Link to="/mentors" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            {isAuthenticated ? t('home.recommendedMentors.viewAll') : t('home.featuredMentors.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isAuthenticated && (
          <p className="-mt-3 mb-5 text-sm text-gray-700 dark:text-slate-300">
            {t('home.recommendedMentors.subtitle')}
          </p>
        )}
        
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-64 rounded-2xl bg-white animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
             ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e2e6f5] bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-700 dark:text-slate-200">{t('home.recommendedMentors.emptyTitle')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{t('home.recommendedMentors.emptyDescription')}</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/profile" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t('home.recommendedMentors.updateInterests')}
                  </Link>
                  <Link to="/mentors" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    {t('home.recommendedMentors.exploreMentors')}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-slate-400">{t('home.featuredMentors.empty')}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {mentors.map((mentor: any) => {
              const mentorName = mentor.fullName || mentor.user?.displayName || mentor.user?.fullName || t('common.mentor')
              const avatarUrl = mentor.avatarUrl || mentor.user?.avatarUrl || `https://i.pravatar.cc/150?u=${mentor.userId || mentor.mentorId}`
              const id = mentor.userId || mentor.mentorId
              return (
                <Link key={id} to={`/mentors/${id}`} className="group flex flex-col justify-between rounded-2xl border border-transparent bg-white p-5 shadow-sm transition duration-300 hover:border-[#4f46e5] hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60">
                  <div>
                    <div className="flex items-center gap-4">
                      <img
                        src={avatarUrl}
                        alt={mentorName}
                        className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-700"
                      />
                      <div>
                        <p className="text-[15px] font-bold text-gray-900 group-hover:text-[#4f46e5] transition line-clamp-1 dark:text-white dark:group-hover:text-indigo-300">{mentorName}</p>
                        <p className="mt-1 text-[11px] text-gray-600 line-clamp-2 leading-[1.6] dark:text-slate-400">{mentor.headline || t('common.mentor')}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-gray-800 dark:text-slate-200">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {mentor.averageRating?.toFixed(1) || '4.9'} <span className="font-medium text-gray-500">({mentor.totalReviews || 0} {t('common.reviews')})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <span className="flex-1 rounded-xl border border-[#e2e6f5] py-2.5 text-center text-[12px] font-bold text-[#4f46e5] transition hover:bg-slate-50 dark:border-slate-700 dark:text-indigo-300 dark:hover:bg-slate-800">{t('common.book')}</span>
                    <span className="flex-1 rounded-xl bg-[#f4f6ff] py-2.5 text-center text-[12px] font-bold text-[#4f46e5] transition hover:bg-[#ebf0ff] dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                      {t('common.viewProfile')}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
          <article className="rounded-3xl bg-transparent p-4 flex flex-col justify-center lg:col-span-1 md:col-span-2">
            <h2 className="whitespace-pre-line text-3xl font-bold text-gray-900 leading-tight dark:text-white">{t('home.why.title')}</h2>
            <p className="mt-4 text-sm text-gray-700 leading-[1.6] max-w-sm dark:text-slate-300">
              {t('home.why.description')}
            </p>
            <div className="mt-6">
              <Link to="/about" className="inline-flex rounded-xl bg-[#4f46e5] px-6 py-3 text-sm font-bold text-white hover:bg-[#4338ca] shadow-md transition">
                {t('home.why.learnMore')}
              </Link>
            </div>
          </article>
          
          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6 dark:bg-indigo-500/10">
               <Search className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.why.job.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">
              {t('home.why.job.description')}
            </p>
          </article>
          
          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6 dark:bg-indigo-500/10">
               <Handshake className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.why.mentor.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">
              {t('home.why.mentor.description')}
            </p>
          </article>

          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6 dark:bg-indigo-500/10">
               <Rocket className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('home.why.career.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">
              {t('home.why.career.description')}
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl mb-10 dark:text-white">{t('home.how.title')}</h2>
        
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative">
           
           {/* Step 1 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative dark:bg-indigo-500/10">
                 <Briefcase className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm dark:border-slate-900">1</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 text-base dark:text-white">{t('home.how.step1.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">{t('home.how.step1.description')}</p>
              </div>
           </div>

           {/* Arrow 1 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-gray-400" />
           </div>

           {/* Step 2 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative dark:bg-indigo-500/10">
                 <Search className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm dark:border-slate-900">2</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 text-base dark:text-white">{t('home.how.step2.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">{t('home.how.step2.description')}</p>
              </div>
           </div>

           {/* Arrow 2 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-gray-400" />
           </div>

           {/* Step 3 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative dark:bg-indigo-500/10">
                 <TrendingUp className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm dark:border-slate-900">3</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 text-base dark:text-white">{t('home.how.step3.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 leading-[1.6] dark:text-slate-400">{t('home.how.step3.description')}</p>
              </div>
           </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gray-900 p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
          
          <div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Users className="h-7 w-7 text-indigo-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.users.toLocaleString('en-US')}+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">{t('home.stats.users')}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Briefcase className="h-7 w-7 text-blue-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.openJobs.toLocaleString('en-US')}+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">{t('home.stats.activeJobs')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.mentors.toLocaleString('en-US')}+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">{t('home.stats.qualityMentors')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Handshake className="h-7 w-7 text-purple-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.successfulMatches.toLocaleString('en-US')}+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">{t('home.stats.successfulMatches')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
