import { homeApi } from '@/api/homeApi'
import { useQuery } from 'react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'


import { 
  Search, MapPin, Star, ChevronRight, LayoutGrid, ChevronDown, 
  Bookmark, Briefcase, Code, Megaphone, PenTool, Users, TrendingUp, 
  BookOpen, Database, Package, Rocket, Handshake, CheckCircle2
} from 'lucide-react'

const formatBudget = (job: any, fallback: string) => {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    return `${job.budgetMinMxc.toLocaleString('en-US')} - ${job.budgetMaxMxc.toLocaleString('en-US')} VND`
  }
  if (job.hourlyRateMxc) return `${job.hourlyRateMxc.toLocaleString('en-US')} VND/hr`
  return fallback
}

const formatStatValue = (value: number) => value.toLocaleString('en-US')

const getTagList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

type HomeStatItem = {
  key: string
  value: number | null | undefined
  label: string
  icon: JSX.Element
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'it': <Code className="h-7 w-7 text-emerald-500" />,
  'marketing': <Megaphone className="h-7 w-7 text-blue-500" />,
  'business': <Briefcase className="h-7 w-7 text-emerald-500" />,
  'design': <PenTool className="h-7 w-7 text-emerald-500" />,
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
  const heroJob = jobs[0]
  const heroMentor = mentors[0]
  const heroJobClientName = heroJob?.clientName || heroJob?.client?.displayName || heroJob?.client?.fullName || t('common.company')
  const heroJobAvatarUrl = heroJob
    ? heroJob.clientAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(heroJobClientName)}&background=random&color=fff&rounded=true&bold=true`
    : ''
  const heroJobType = heroJob?.jobType ? heroJob.jobType.replace(/_/g, ' ') : t('common.remote')
  const heroJobTags = getTagList(heroJob?.skills || heroJob?.requiredSkills || heroJob?.skillTags).slice(0, 4)
  const heroMentorName = heroMentor?.fullName || heroMentor?.user?.displayName || heroMentor?.user?.fullName || t('common.mentor')
  const heroMentorAvatarUrl = heroMentor
    ? heroMentor.avatarUrl || heroMentor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(heroMentorName)}&background=random&color=fff&rounded=true&bold=true`
    : ''
  const heroMentorTags = getTagList(heroMentor?.skills || heroMentor?.expertiseTags || heroMentor?.skillTags).slice(0, 3)
  const stats = data?.stats
  const platformStats: HomeStatItem[] = [
    {
      key: 'open-jobs',
      value: stats?.openJobs,
      label: t('home.stats.activeJobs'),
      icon: <Briefcase className="h-7 w-7 text-blue-300" />,
    },
    {
      key: 'mentors',
      value: stats?.mentors,
      label: t('home.stats.qualityMentors'),
      icon: <CheckCircle2 className="h-7 w-7 text-emerald-300" />,
    },
    {
      key: 'courses',
      value: stats?.courses,
      label: t('home.stats.courses'),
      icon: <BookOpen className="h-7 w-7 text-violet-300" />,
    },
    {
      key: 'categories',
      value: stats?.categories,
      label: t('home.stats.categories'),
      icon: <LayoutGrid className="h-7 w-7 text-cyan-300" />,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-slate-950">
      {/* HERO SECTION */}
      <section className="bg-white dark:bg-slate-950 pb-16 pt-12 dark:bg-slate-950">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 items-center">
          <div>
            <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-gray-900 dark:text-gray-100 dark:text-white min-[360px]:text-4xl sm:leading-[1.04] lg:text-[54px]">
              <span className="block">{t('home.hero.titleLine1')}</span>
              <span className="block pb-1">{t('home.hero.titleLine2')}</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-[1.6] text-gray-700 dark:text-gray-300 dark:text-slate-300">
              {t('home.hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-[#e2e6f5] dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center px-3">
                  <Search className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t('home.hero.searchPlaceholder')}
                    className="w-full bg-transparent pl-3 text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-slate-500 dark:text-slate-400 dark:text-slate-400"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden md:block dark:bg-slate-700"></div>
                <div className="hidden md:flex w-[160px] items-center px-3">
                  <MapPin className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={t('home.hero.locationPlaceholder')}
                    className="w-full bg-transparent pl-3 text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-slate-500 dark:text-slate-400 dark:text-slate-400"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden lg:block dark:bg-slate-700"></div>
                <div className="hidden lg:flex w-[140px] items-center justify-between px-3 cursor-pointer">
                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-slate-300">
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
            
            <div className="mt-6 flex flex-wrap items-center gap-2 px-1 text-xs text-gray-600 dark:text-gray-400 dark:text-slate-400">
              <span className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{t('home.hero.quickSearch')}</span>
              {['IT', 'Marketing', 'Design', 'Data', 'Product', 'Interview Prep'].map((item) => (
                <Link key={item} to={`/jobs?q=${encodeURIComponent(item)}`} className="rounded-full border border-[#e2e6f5] dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 transition hover:border-[#4f46e5] hover:text-[#4f46e5] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400 dark:hover:text-emerald-300">
                  {item}
                </Link>
              ))}
            </div>


          </div>

          <div className="relative hidden min-h-[430px] lg:block">
            <div className="absolute right-1 top-7 h-[388px] w-[388px] rotate-2 rounded-[34px] bg-slate-100 dark:bg-slate-800 shadow-[0_28px_70px_rgba(15,23,42,0.10)] dark:bg-slate-900"></div>
            <div className="absolute right-7 top-10 h-[372px] w-[372px] -rotate-2 overflow-hidden rounded-[34px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
              <img
                src="/images/auth_hero.jpg"
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="h-full w-full scale-105 object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/10 dark:bg-slate-950/30" />
            </div>

            {heroJob && (
              <Link to={`/jobs/${heroJob.jobId}`} className="hero-float-job group absolute -left-5 top-16 z-20 block w-[286px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-[0_22px_55px_rgba(15,23,42,0.12)] transition-[border-color,box-shadow] duration-200 hover:border-slate-300 dark:border-slate-700 hover:shadow-[0_26px_65px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <img src={heroJobAvatarUrl} alt={heroJobClientName} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    </div>
                    <span className="truncate text-xs font-bold text-gray-800 dark:text-gray-200 dark:text-slate-200">{heroJobClientName}</span>
                  </div>
                  <span className="shrink-0 rounded bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500">{t('home.hero.companyCard.new')}</span>
                </div>
                <div className="mt-3 line-clamp-2 text-sm font-bold text-gray-900 dark:text-gray-100 dark:text-white">{heroJob.title}</div>
                <div className="mt-1.5 flex gap-3 text-[11px] text-gray-600 dark:text-gray-400 dark:text-slate-400">
                  <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{heroJob.location || t('common.remote')}</span></span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {heroJobType}</span>
                </div>
                <div className="mt-2 text-xs font-bold text-amber-500">{formatBudget(heroJob, t('common.negotiable'))}</div>
                {heroJobTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-gray-700 dark:text-gray-300 font-medium dark:text-slate-300">
                    {heroJobTags.map((tag) => (
                      <span key={tag} className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 dark:bg-slate-800">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-[#4f46e5] group-hover:text-[#4338ca] dark:text-emerald-300 dark:group-hover:text-emerald-200">{t('common.viewDetails')}</span>
                  <Bookmark className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            )}

            {heroMentor && (
              <Link to={`/mentors/${heroMentor.userId || heroMentor.mentorId}`} className="hero-float-mentor group absolute -right-2 top-[112px] z-30 block w-[248px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-[0_22px_55px_rgba(15,23,42,0.12)] transition-[border-color,box-shadow] duration-200 hover:border-slate-300 dark:border-slate-700 hover:shadow-[0_26px_65px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                <div className="flex justify-end mb-2">
                  <span className="rounded bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">{t('home.hero.mentorCard.featured')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <img src={heroMentorAvatarUrl} alt={heroMentorName} loading="lazy" decoding="async" className="h-12 w-12 rounded-full border-2 border-white shadow-sm object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-gray-900 dark:text-gray-100 dark:text-white">{heroMentorName}</div>
                    <div className="mt-0.5 line-clamp-2 text-[9px] text-gray-600 dark:text-gray-400 dark:text-slate-400">{heroMentor.headline || t('common.mentor')}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-gray-800 dark:text-gray-200 dark:text-slate-200">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {typeof heroMentor.averageRating === 'number' ? heroMentor.averageRating.toFixed(1) : 'N/A'} <span className="font-medium text-gray-500">({heroMentor.totalReviews || 0} {t('common.reviews')})</span>
                </div>
                {heroMentorTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-gray-700 dark:text-gray-300 font-medium dark:text-slate-300">
                    {heroMentorTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">{tag}</span>
                    ))}
                  </div>
                )}
                <span className="mt-4 block w-full rounded-xl bg-[#4f46e5] py-2 text-center text-xs font-bold text-white transition group-hover:bg-[#4338ca] shadow-sm">{t('home.hero.mentorCard.book')}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white dark:bg-slate-950 animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {categories.slice(0, 8).map((cat) => {
              const categoryParam = cat.slug || String(cat.categoryId ?? cat.id)
              const categoryKey = cat.categoryId ?? cat.id ?? cat.slug

              return (
                <Link
                  to={`/jobs?category=${encodeURIComponent(categoryParam)}`}
                  key={categoryKey}
                  className="group flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-950 p-5 transition duration-300 transform hover:-translate-y-1 hover:shadow-lg dark:border dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 group-hover:bg-emerald-50 dark:bg-emerald-900/30 transition mb-3 dark:bg-slate-800 dark:group-hover:bg-emerald-500/10">
                    {CATEGORY_ICONS[cat.slug] || <LayoutGrid className="h-7 w-7 text-emerald-500" />}
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100 text-center whitespace-pre-line dark:text-white">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* FEATURED JOBS */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white md:text-3xl">
            {isAuthenticated ? t('home.recommendedJobs.title') : t('home.featuredJobs.title')}
          </h2>
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            {isAuthenticated ? t('home.recommendedJobs.viewAll') : t('home.featuredJobs.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isAuthenticated && (
          <p className="-mt-3 mb-5 text-sm text-gray-700 dark:text-gray-300 dark:text-slate-300">
            {t('home.recommendedJobs.subtitle')}
          </p>
        )}
        
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-64 rounded-2xl bg-white dark:bg-slate-950 animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
             ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e2e6f5] dark:border-slate-800 bg-white dark:bg-slate-950 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-700 dark:text-gray-300 dark:text-slate-200">{t('home.recommendedJobs.emptyTitle')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-slate-400">{t('home.recommendedJobs.emptyDescription')}</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/profile" className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t('home.recommendedJobs.updateInterests')}
                  </Link>
                  <Link to="/jobs" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    {t('home.recommendedJobs.exploreJobs')}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 dark:text-slate-400">{t('home.featuredJobs.empty')}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job: any) => {
              const clientName = job.clientName || job.client?.displayName || job.client?.fullName || t('common.company')
              const avatarUrl = job.clientAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random&color=fff&rounded=true&bold=true`
              const jobType = job.jobType ? job.jobType.replace(/_/g, ' ') : 'Hybrid'
              return (
              <Link key={job.jobId} to={`/jobs/${job.jobId}`} className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-slate-200 dark:border-slate-800 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_20px_42px_rgba(2,6,23,0.3)]">
                <div>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-sm transition-[transform,box-shadow,background-color] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/90 group-hover:shadow-[0_10px_22px_rgba(15,23,42,0.08)] motion-reduce:transform-none dark:border-slate-700 dark:bg-slate-800 dark:group-hover:bg-slate-700/90 dark:group-hover:shadow-[0_12px_24px_rgba(2,6,23,0.28)]">
                            <img src={avatarUrl} alt="logo" loading="lazy" decoding="async" className="h-full w-full rounded-lg object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 line-clamp-1 dark:text-slate-300">{clientName}</span>
                      </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-[17px] font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300 group-hover:text-slate-950 dark:text-white dark:group-hover:text-slate-100">{job.title}</p>
                  <div className="mt-2.5 flex gap-4 text-[13px] text-gray-600 dark:text-gray-400 font-medium dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t('common.remote')}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {jobType}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-amber-500">{formatBudget(job, t('common.negotiable'))}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 transition-colors duration-300 group-hover:text-slate-900 dark:text-slate-100 dark:text-slate-300 dark:group-hover:text-slate-100">{t('common.viewDetails')}</span>
                  <Bookmark className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-slate-600 dark:text-slate-400 dark:text-slate-400 dark:group-hover:text-slate-300" />
                </div>
              </Link>
            )})}
          </div>
        )}
      </section>

      {/* FEATURED MENTORS */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white md:text-3xl">
            {isAuthenticated ? t('home.recommendedMentors.title') : t('home.featuredMentors.title')}
          </h2>
          <Link to="/mentors" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            {isAuthenticated ? t('home.recommendedMentors.viewAll') : t('home.featuredMentors.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isAuthenticated && (
          <p className="-mt-3 mb-5 text-sm text-gray-700 dark:text-gray-300 dark:text-slate-300">
            {t('home.recommendedMentors.subtitle')}
          </p>
        )}
        
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-64 rounded-2xl bg-white dark:bg-slate-950 animate-pulse border border-[#e2e6f5] dark:border-slate-800 dark:bg-slate-900"></div>
             ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e2e6f5] dark:border-slate-800 bg-white dark:bg-slate-950 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="font-semibold text-gray-700 dark:text-gray-300 dark:text-slate-200">{t('home.recommendedMentors.emptyTitle')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-slate-400">{t('home.recommendedMentors.emptyDescription')}</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/profile" className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t('home.recommendedMentors.updateInterests')}
                  </Link>
                  <Link to="/mentors" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    {t('home.recommendedMentors.exploreMentors')}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 dark:text-slate-400">{t('home.featuredMentors.empty')}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {mentors.map((mentor: any) => {
              const mentorName = mentor.fullName || mentor.user?.displayName || mentor.user?.fullName || t('common.mentor')
              const avatarUrl = mentor.avatarUrl || mentor.user?.avatarUrl || `https://i.pravatar.cc/150?u=${mentor.userId || mentor.mentorId}`
              const id = mentor.userId || mentor.mentorId
              return (
                <Link key={id} to={`/mentors/${id}`} className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-slate-200 dark:border-slate-800 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_20px_42px_rgba(2,6,23,0.3)]">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-[transform,box-shadow,background-color] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/90 group-hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)] motion-reduce:transform-none dark:border-slate-700 dark:bg-slate-800 dark:group-hover:bg-slate-700/90 dark:group-hover:shadow-[0_14px_28px_rgba(2,6,23,0.28)]">
                        <img
                          src={avatarUrl}
                          alt={mentorName}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 shrink-0 rounded-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                        />
                      </div>
                      <div>
                        <p className="line-clamp-1 text-[15px] font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300 group-hover:text-slate-950 dark:text-white dark:group-hover:text-slate-100">{mentorName}</p>
                        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-[1.6] dark:text-slate-400">{mentor.headline || t('common.mentor')}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-gray-800 dark:text-gray-200 dark:text-slate-200">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {typeof mentor.averageRating === 'number' ? mentor.averageRating.toFixed(1) : 'N/A'} <span className="font-medium text-gray-500">({mentor.totalReviews || 0} {t('common.reviews')})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <span className="flex-1 rounded-xl border border-[#e2e6f5] dark:border-slate-800 py-2.5 text-center text-[12px] font-bold text-[#4f46e5] transition hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-slate-800">{t('common.book')}</span>
                    <span className="flex-1 rounded-xl bg-[#f4f6ff] dark:bg-indigo-900/30 dark:bg-slate-950 py-2.5 text-center text-[12px] font-bold text-[#4f46e5] transition hover:bg-[#ebf0ff] dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">
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
            <h2 className="whitespace-pre-line text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight dark:text-white">{t('home.why.title')}</h2>
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-[1.6] max-w-sm dark:text-slate-300">
              {t('home.why.description')}
            </p>
            <div className="mt-6">
              <Link to="/about" className="inline-flex rounded-xl bg-[#4f46e5] px-6 py-3 text-sm font-bold text-white hover:bg-[#4338ca] shadow-md transition">
                {t('home.why.learnMore')}
              </Link>
            </div>
          </article>
          
          <article className="rounded-3xl bg-white dark:bg-slate-950 p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-6 dark:bg-emerald-500/10">
               <Search className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{t('home.why.job.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">
              {t('home.why.job.description')}
            </p>
          </article>
          
          <article className="rounded-3xl bg-white dark:bg-slate-950 p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-6 dark:bg-emerald-500/10">
               <Handshake className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{t('home.why.mentor.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">
              {t('home.why.mentor.description')}
            </p>
          </article>

          <article className="rounded-3xl bg-white dark:bg-slate-950 p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-6 dark:bg-emerald-500/10">
               <Rocket className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{t('home.why.career.title')}</h3>
            <p className="mt-3 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">
              {t('home.why.career.description')}
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl mb-10 dark:text-white">{t('home.how.title')}</h2>
        
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative">
           
           {/* Step 1 */}
           <div className="group relative z-10 flex flex-1 flex-col items-start gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_18px_34px_rgba(2,6,23,0.3)] sm:flex-row sm:items-center">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-colors duration-300 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                 <Briefcase className="h-6 w-6 text-slate-700 dark:text-slate-300 dark:text-slate-300 dark:text-slate-200" />
                 <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 text-[11px] font-bold text-white shadow-sm dark:border-slate-900 dark:bg-slate-100 dark:text-slate-900">1</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base dark:text-white">{t('home.how.step1.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">{t('home.how.step1.description')}</p>
              </div>
           </div>

           {/* Arrow 1 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-gray-400" />
           </div>

           {/* Step 2 */}
           <div className="group relative z-10 flex flex-1 flex-col items-start gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_18px_34px_rgba(2,6,23,0.3)] sm:flex-row sm:items-center">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-colors duration-300 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                 <Search className="h-6 w-6 text-slate-700 dark:text-slate-300 dark:text-slate-300 dark:text-slate-200" />
                 <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 text-[11px] font-bold text-white shadow-sm dark:border-slate-900 dark:bg-slate-100 dark:text-slate-900">2</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base dark:text-white">{t('home.how.step2.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">{t('home.how.step2.description')}</p>
              </div>
           </div>

           {/* Arrow 2 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-gray-400" />
           </div>

           {/* Step 3 */}
           <div className="group relative z-10 flex flex-1 flex-col items-start gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_18px_34px_rgba(2,6,23,0.3)] sm:flex-row sm:items-center">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-colors duration-300 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                 <TrendingUp className="h-6 w-6 text-slate-700 dark:text-slate-300 dark:text-slate-300 dark:text-slate-200" />
                 <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 hover:bg-emerald-700 text-[11px] font-bold text-white shadow-sm dark:border-slate-900 dark:bg-slate-100 dark:text-slate-900">3</div>
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base dark:text-white">{t('home.how.step3.title')}</h3>
                 <p className="mt-1.5 text-[13px] text-gray-600 dark:text-gray-400 leading-[1.6] dark:text-slate-400">{t('home.how.step3.description')}</p>
              </div>
           </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_2fr]">
            <div className="border-b border-white/10 p-7 md:p-8 lg:border-b-0 lg:border-r">
              <span className="inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-[12px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                {t('home.stats.source')}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                {t('home.stats.title')}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-[1.7] text-slate-300">
                {t('home.stats.description')}
              </p>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 md:grid-cols-4 md:divide-y-0">
              {platformStats
                .filter((item) => typeof item.value === 'number' && Number.isFinite(item.value))
                .map((item) => (
                  <div key={item.key} className="flex min-h-[170px] flex-col items-center justify-center p-5 text-center md:p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-950/10">
                      {item.icon}
                    </div>
                    <p className="mt-6 text-3xl font-bold text-white">
                      {formatStatValue(item.value as number)}
                    </p>
                    <p className="mt-2 text-[13px] font-medium text-emerald-200">{item.label}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
