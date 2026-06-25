import os

content = """import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Search,
  Timer,
  X,
  ChevronDown,
  CheckCircle2,
  MapPin,
  Filter,
  Heart,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react'
import { jobApi } from '@/api/jobApi'
import { skillApi } from '@/api/skillApi'
import { categoryApi } from '@/api/categoryApi'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { JobResponse, JobType, JobSort, BudgetType, JobStatus } from '@/types'
import { useI18n } from '@/i18n/I18nProvider'
import { TranslationKey } from '@/i18n/translations'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 10
const DEBOUNCE_MS = 300

const JOB_TYPE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.all' },
  { value: JobType.FREELANCE_PROJECT, labelKey: 'jobs.freelance' },
  { value: JobType.LONG_TERM_MENTORING, labelKey: 'jobs.mentoring' },
  { value: JobType.QUICK_FIX, labelKey: 'jobs.quickFix' },
]

const SORT_OPTIONS: { value: JobSort; labelKey: TranslationKey }[] = [
  { value: JobSort.NEWEST, labelKey: 'jobs.sort.newest' },
  { value: JobSort.BUDGET_DESC, labelKey: 'jobs.sort.budgetDesc' },
  { value: JobSort.BUDGET_ASC, labelKey: 'jobs.sort.budgetAsc' },
  { value: JobSort.POPULAR, labelKey: 'jobs.sort.popular' },
  { value: JobSort.RELEVANCE, labelKey: 'jobs.sort.relevance' },
]

const BUDGET_TYPE_OPTIONS = [
  { value: 'ALL', labelKey: 'jobs.filter.budgetTypeAll' },
  { value: BudgetType.FIXED, labelKey: 'jobs.filter.budgetTypeFixed' },
  { value: BudgetType.HOURLY, labelKey: 'jobs.filter.budgetTypeHourly' },
]

const STATUS_OPTIONS = [
  { value: JobStatus.OPEN, labelKey: 'jobs.filter.statusOpen' },
  { value: JobStatus.CLOSED, labelKey: 'jobs.filter.statusClosed' },
]

export default function JobListPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [jobType, setJobType] = useState<string>('ALL')
  const [skillFilter, setSkillFilter] = useState('')
  const [sort, setSort] = useState<JobSort>(JobSort.NEWEST)
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [budgetType, setBudgetType] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<JobStatus>(JobStatus.OPEN)
  const [categoryId, setCategoryId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(0)

  const debouncedKeyword = useDebounce(keyword, DEBOUNCE_MS)
  const apiJobType = jobType === 'ALL' ? undefined : (jobType as JobType)
  const apiBudgetType = budgetType === 'ALL' ? undefined : (budgetType as BudgetType)
  const apiCategoryId = categoryId ? Number(categoryId) : undefined

  const { data: skills = [] } = useQuery('job-filter-skills', skillApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const { data: categories = [] } = useQuery('job-filter-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading } = useQuery(
    ['jobs', page, apiJobType, skillFilter, debouncedKeyword, sort, budgetMin, budgetMax, apiBudgetType, statusFilter, apiCategoryId],
    () =>
      jobApi.getOpenJobs({
        page,
        size: PAGE_SIZE,
        jobType: apiJobType,
        skill: skillFilter.trim() || undefined,
        keyword: debouncedKeyword.trim() || undefined,
        sort,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        budgetType: apiBudgetType,
        status: statusFilter,
        categoryId: apiCategoryId,
      }),
    { keepPreviousData: true }
  )

  const jobs = data?.content || []
  const totalPages = data?.totalPages || 1
  const totalJobs = data?.totalElements || 0
  const hasActiveFilters =
    keyword.trim().length > 0 ||
    jobType !== 'ALL' ||
    !!skillFilter ||
    sort !== JobSort.NEWEST ||
    !!budgetMin ||
    !!budgetMax ||
    budgetType !== 'ALL' ||
    statusFilter !== JobStatus.OPEN ||
    !!categoryId

  const setFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(0)
  }

  const setSortFilter = (value: JobSort) => {
    setSort(JobSort[value] || value)
    setPage(0)
  }

  const clearAllFilters = () => {
    setKeyword('')
    setJobType('ALL')
    setSkillFilter('')
    setSort(JobSort.NEWEST)
    setBudgetMin('')
    setBudgetMax('')
    setBudgetType('ALL')
    setStatusFilter(JobStatus.OPEN)
    setCategoryId('')
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] pb-12 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Search Section - Vibrant Animated Mesh Background */}
      <div className="relative overflow-hidden bg-[#f8faff] pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#e2e6f5]">
        {/* Animated Mesh Blobs */}
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-indigo-300/40 mix-blend-multiply rounded-[40%_60%_70%_30%/40%_50%_60%_50%] filter blur-3xl opacity-70 animate-[spin_10s_linear_infinite] pointer-events-none"></div>
        <div className="absolute top-[-10%] right-[10%] w-[450px] h-[450px] bg-purple-300/40 mix-blend-multiply rounded-[60%_40%_30%_70%/60%_30%_70%_40%] filter blur-3xl opacity-70 animate-[spin_12s_linear_infinite_reverse] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-300/30 mix-blend-multiply rounded-full filter blur-3xl opacity-60 animate-[pulse_4s_ease-in-out_infinite] pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-[1600px] z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="px-3 py-1 rounded-full bg-white/70 border border-white flex items-center gap-1.5 w-fit shadow-sm backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-[#4f46e5]" />
                    <span className="text-[12px] font-bold text-[#4f46e5] tracking-wider uppercase">MentorX Discovery</span>
                 </div>
              </div>
              <h1 className="text-4xl font-extrabold text-[#1b2252] sm:text-5xl tracking-tight leading-tight">
                Khám phá cơ hội, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]">Kết nối chuyên gia</span>
              </h1>
            </div>
          </div>
          
          {/* Synchronized Search Bar */}
          <div className="flex flex-col sm:flex-row bg-white/70 backdrop-blur-xl rounded-2xl p-2.5 border border-white/50 shadow-lg">
             <div className="sm:w-[280px] relative flex items-center border-b sm:border-b-0 sm:border-r border-[#e2e6f5]/50 shrink-0">
                <Briefcase className="absolute left-5 h-6 w-6 text-slate-400" />
                <select 
                   value={categoryId} 
                   onChange={e => setFilter(setCategoryId)(e.target.value)}
                   className="w-full h-14 pl-14 pr-10 appearance-none bg-transparent outline-none text-[16px] font-medium text-[#1b2252] cursor-pointer"
                >
                   <option value="" className="text-[#1b2252]">Tất cả lĩnh vực</option>
                   {categories.map((c) => (
                     <option key={c.categoryId ?? c.id} value={c.categoryId ?? c.id} className="text-[#1b2252]">
                       {c.name}
                     </option>
                   ))}
                </select>
                <ChevronDown className="absolute right-5 h-5 w-5 text-slate-400 pointer-events-none" />
             </div>
             
             <div className="flex-1 relative flex items-center">
                <Search className="absolute left-5 h-6 w-6 text-slate-400" />
                <input 
                   value={keyword}
                   onChange={e => {setKeyword(e.target.value); setPage(0)}}
                   placeholder="Nhập tên công việc, kỹ năng..."
                   className="w-full h-14 pl-14 pr-10 bg-transparent outline-none text-[16px] font-medium text-[#1b2252] placeholder:text-slate-400"
                />
                {keyword && (
                  <button onClick={() => {setKeyword(''); setPage(0)}} className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                )}
             </div>
             
             <button className="h-14 px-10 bg-[#4f46e5] text-white text-[16px] font-semibold hover:bg-[#4338ca] transition-all duration-300 rounded-xl mt-2 sm:mt-0 shrink-0 flex items-center justify-center gap-2 shadow-md">
                Tìm kiếm
             </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row-reverse gap-10">
           
           {/* Left Column (Desktop view, visually right) - Main List */}
           <div className="flex-1 min-w-0">
             <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
               <h2 className="text-[16px] font-medium text-slate-600">
                 Đã tìm thấy <span className="text-[#1b2252] font-extrabold">{totalJobs}</span> kết quả
               </h2>
               <div className="flex items-center gap-2">
                 {/* View Mode Toggle */}
                 <div className="hidden sm:flex items-center bg-white border border-[#e2e6f5] rounded-xl p-1 mr-2 shadow-sm">
                   <button 
                     onClick={() => setViewMode('grid')}
                     className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#f7f8fc] text-[#4f46e5]' : 'text-slate-400 hover:text-slate-600'}`}
                     title="Dạng lưới"
                   >
                     <LayoutGrid className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => setViewMode('list')}
                     className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#f7f8fc] text-[#4f46e5]' : 'text-slate-400 hover:text-slate-600'}`}
                     title="Dạng danh sách"
                   >
                     <List className="w-5 h-5" />
                   </button>
                 </div>

                 <span className="text-[15px] text-slate-500 font-medium">Sắp xếp:</span>
                 <div className="relative border border-[#e2e6f5] rounded-xl px-3 bg-white">
                   <select 
                     value={sort} 
                     onChange={e => setSortFilter(e.target.value as JobSort)} 
                     className="h-11 text-[15px] font-semibold text-[#1b2252] outline-none bg-transparent cursor-pointer pr-7 appearance-none hover:text-[#4f46e5] transition-colors"
                   >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             {/* Job List */}
             {isLoading ? (
                <JobListSkeleton viewMode={viewMode} />
             ) : jobs.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 2xl:grid-cols-2 gap-6" : "flex flex-col gap-6"}>
                  {jobs.map((job) => (
                    <JobCard key={job.jobId} job={job} showRelevance={!!debouncedKeyword.trim()} viewMode={viewMode} />
                  ))}
                </div>
             ) : (
                <EmptyState hasSearch={hasActiveFilters} onClear={clearAllFilters} />
             )}
             
             <div className="mt-12">
               <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
             </div>
           </div>

           {/* Right Column (Desktop view, visually left) - Sidebar */}
           <div className="w-full lg:w-[320px] shrink-0 space-y-8">
              
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-[#e2e6f5] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[120px] pointer-events-none"></div>
                <h3 className="font-extrabold text-[18px] text-[#1b2252] mb-3 relative z-10 flex items-center gap-2">
                   Cần chuyên gia?
                </h3>
                <p className="text-[14px] text-slate-500 mb-6 relative z-10 leading-relaxed font-medium">Đăng yêu cầu ngay để kết nối với mentor và nhận báo giá trong vòng 24h.</p>
                <Link to="/jobs/create" className="flex items-center justify-center gap-2 w-full h-12 bg-[#f7f8fc] text-[#4f46e5] border border-[#e2e6f5] font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-[15px] shadow-sm relative z-10">
                  <Plus className="h-5 w-5" /> Đăng yêu cầu mới
                </Link>
              </div>

              {/* Advanced Filters */}
              <div className="bg-white rounded-3xl border border-[#e2e6f5] shadow-sm overflow-hidden">
                 <div className="flex items-center justify-between px-7 py-5 border-b border-[#e2e6f5] bg-slate-50/50">
                    <h3 className="font-bold text-[#1b2252] text-[16px] flex items-center gap-2">
                       <Filter className="w-5 h-5 text-slate-400"/> Bộ lọc tìm kiếm
                    </h3>
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="text-[13px] text-slate-500 hover:text-red-500 font-semibold transition-colors bg-white px-3 py-1.5 rounded-md border border-[#e2e6f5]">Xóa lọc</button>
                    )}
                 </div>
                 
                 <div className="p-7 space-y-8">
                   {/* Job Type Filter */}
                   <div>
                      <h4 className="text-[13px] font-bold text-[#1b2252] mb-4">Hình thức</h4>
                      <div className="flex flex-col gap-4">
                        {JOB_TYPE_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="jobType" 
                                value={opt.value} 
                                checked={jobType === opt.value}
                                onChange={(e) => setFilter(setJobType)(e.target.value)}
                                className="appearance-none w-5 h-5 rounded border border-slate-300 bg-slate-50 checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all cursor-pointer relative"
                              />
                              {jobType === opt.value && <CheckCircle2 className="absolute w-4 h-4 text-white pointer-events-none" />}
                            </div>
                            <span className="text-[15px] font-medium text-slate-600 group-hover:text-[#4f46e5] transition-colors">{t(opt.labelKey as TranslationKey)}</span>
                          </label>
                        ))}
                      </div>
                   </div>

                   {/* Skills Filter */}
                   <div>
                      <h4 className="text-[13px] font-bold text-[#1b2252] mb-4">Kỹ năng</h4>
                      <div className="relative">
                        <select
                          value={skillFilter}
                          onChange={(e) => setFilter(setSkillFilter)(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-[#e2e6f5] bg-white py-3.5 pl-4 pr-10 text-[15px] font-medium text-[#1b2252] outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all cursor-pointer"
                        >
                          <option value="">Tất cả kỹ năng</option>
                          {skills.slice(0, 80).map((skill) => (
                            <option key={skill.id} value={skill.labelEn}>{skill.labelEn}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      </div>
                   </div>

                   {/* Budget Type Filter */}
                   <div>
                      <h4 className="text-[13px] font-bold text-[#1b2252] mb-4">Ngân sách</h4>
                      <div className="flex flex-col gap-4">
                        {BUDGET_TYPE_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="budgetType" 
                                value={opt.value} 
                                checked={budgetType === opt.value}
                                onChange={(e) => setFilter(setBudgetType)(e.target.value)}
                                className="appearance-none w-5 h-5 rounded border border-slate-300 bg-slate-50 checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all cursor-pointer relative"
                              />
                              {budgetType === opt.value && <CheckCircle2 className="absolute w-4 h-4 text-white pointer-events-none" />}
                            </div>
                            <span className="text-[15px] font-medium text-slate-600 group-hover:text-[#4f46e5] transition-colors">{t(opt.labelKey as TranslationKey)}</span>
                          </label>
                        ))}
                      </div>
                   </div>

                   {/* Budget Range */}
                   {(budgetType === BudgetType.FIXED || budgetType === BudgetType.HOURLY) && (
                   <div className="pt-2">
                      <div className="flex items-center gap-3">
                         <input 
                           type="number" min="0" value={budgetMin} onChange={(e) => setFilter(setBudgetMin)(e.target.value)} placeholder="Từ"
                           className="w-full bg-white border border-[#e2e6f5] rounded-xl py-2.5 px-4 text-[14px] font-medium text-[#1b2252] outline-none placeholder:text-slate-400 focus:border-[#4f46e5]"
                         />
                         <span className="text-slate-300 font-light">-</span>
                         <input 
                           type="number" min="0" value={budgetMax} onChange={(e) => setFilter(setBudgetMax)(e.target.value)} placeholder="Đến"
                           className="w-full bg-white border border-[#e2e6f5] rounded-xl py-2.5 px-4 text-[14px] font-medium text-[#1b2252] outline-none placeholder:text-slate-400 focus:border-[#4f46e5]"
                         />
                      </div>
                   </div>
                   )}

                   {/* Status */}
                   <div>
                      <h4 className="text-[13px] font-bold text-[#1b2252] mb-4">Trạng thái</h4>
                      <div className="flex flex-col gap-4">
                        {STATUS_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="statusFilter" 
                                value={opt.value} 
                                checked={statusFilter === opt.value}
                                onChange={(e) => { setStatusFilter(e.target.value as JobStatus); setPage(0); }}
                                className="appearance-none w-5 h-5 rounded border border-slate-300 bg-slate-50 checked:bg-[#4f46e5] checked:border-[#4f46e5] transition-all cursor-pointer relative"
                              />
                              {statusFilter === opt.value && <CheckCircle2 className="absolute w-4 h-4 text-white pointer-events-none" />}
                            </div>
                            <span className="text-[15px] font-medium text-slate-600 group-hover:text-[#4f46e5] transition-colors">{t(opt.labelKey as TranslationKey)}</span>
                          </label>
                        ))}
                      </div>
                   </div>

                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}

function JobCard({ job, showRelevance, viewMode }: { job: JobResponse; showRelevance: boolean; viewMode?: 'grid' | 'list' }) {
  const { t } = useI18n()
  const clientName = getClientName(job)
  const budget = formatBudget(job, t)
  const deadline = job.deadlineAt ? formatDeadline(job.deadlineAt) : t('common.noDeadline')
  const relevancePercent = job.relevanceScore != null ? Math.min(Math.round(job.relevanceScore * 100), 100) : null
  const initial = clientName.charAt(0).toUpperCase()

  // In grid mode, we might want a slightly different internal layout if it gets too narrow, but flex-col handles it nicely.
  return (
    <article className={`group flex gap-6 bg-white border border-[#e2e6f5] rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#4f46e5] hover:shadow-xl items-start relative overflow-hidden ${viewMode === 'grid' ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
      {/* Logo */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-[#e2e6f5] text-2xl font-black text-slate-400">
        {initial}
      </div>

      <div className="flex-1 min-w-0 flex flex-col w-full relative z-10 h-full">
         <div className="flex flex-col sm:flex-row sm:justify-between gap-4 w-full">
            <div className="min-w-0 flex-1">
               <Link to={`/jobs/${job.jobId}`} className="line-clamp-2 text-[19px] font-extrabold text-[#1b2252] group-hover:text-[#4f46e5] transition-colors pr-6">
                  {job.title}
               </Link>
               <div className="mt-2.5 flex items-center gap-3 text-[14px] text-slate-500 font-medium">
                  <span className="truncate flex items-center gap-1.5">
                     <Briefcase className="w-4 h-4 text-slate-400"/> {clientName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="truncate flex items-center gap-1.5 text-emerald-600 font-bold">
                     <CheckCircle2 className="w-4 h-4"/> Verified
                  </span>
               </div>
            </div>
            
            <div className="shrink-0 flex items-start justify-end mt-4 sm:mt-0">
               <span className="text-[17px] font-extrabold text-[#4f46e5]">{budget}</span>
            </div>
         </div>

         {/* Ensure the footer is pushed to the bottom in grid mode if heights differ */}
         <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
               {job.requiredSkills && job.requiredSkills.length > 0 ? (
                 <>
                   {job.requiredSkills.slice(0, 3).map((skill) => (
                     <span key={skill} className="rounded-lg bg-slate-50 border border-[#e2e6f5] px-3 py-1.5 text-[13px] font-semibold text-[#1b2252]">{skill}</span>
                   ))}
                   {job.requiredSkills.length > 3 && (
                     <span className="rounded-lg bg-slate-50 border border-[#e2e6f5] px-3 py-1.5 text-[13px] font-semibold text-slate-500">+{job.requiredSkills.length - 3}</span>
                   )}
                 </>
               ) : (
                 <span className="text-[13px] text-slate-400 italic">Không yêu cầu kỹ năng</span>
               )}
            </div>
            
            <div className="flex items-center gap-5 text-[14px] text-slate-500 font-medium">
               <div className="flex items-center gap-1.5">
                 <Timer className="h-4 w-4 text-slate-400" />
                 <span>Hạn: <span className="text-slate-700 font-semibold">{deadline}</span></span>
               </div>
            </div>
         </div>
      </div>
      
      {job.isFeatured && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase shadow-sm z-20">
          HOT
        </div>
      )}
    </article>
  )
}

function JobListSkeleton({ viewMode = 'list' }: { viewMode?: 'grid' | 'list' }) {
  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 2xl:grid-cols-2 gap-6" : "flex flex-col gap-6"}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={`flex gap-6 bg-white border border-[#e2e6f5] rounded-3xl p-7 ${viewMode === 'grid' ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-6 w-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
               <div className="space-y-4 flex-1">
                  <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-5 w-1/3 animate-pulse rounded-lg bg-slate-100" />
               </div>
               <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 border-t border-slate-50">
               <div className="flex gap-3">
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
               </div>
               <div className="h-5 w-28 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white px-8 py-20 text-center">
      <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-[#e2e6f5]">
         <Search className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="text-[18px] font-bold text-[#1b2252]">{t('jobs.noJobsFound')}</h3>
      <p className="mx-auto mt-3 max-w-sm text-[15px] text-slate-500">
        {hasSearch ? t('jobs.emptyWithFilters') : t('jobs.emptyNoJobs')}
      </p>
      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#f7f8fc] px-8 text-[15px] font-semibold text-[#4f46e5] border border-[#e2e6f5] hover:bg-white hover:border-[#4f46e5] transition-colors shadow-sm"
        >
          {t('jobs.clearFilters')}
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
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e2e6f5] bg-white text-slate-500 hover:bg-[#f7f8fc] hover:text-[#1b2252] disabled:opacity-40 transition-colors shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="flex h-12 min-w-[3rem] items-center justify-center rounded-xl bg-[#4f46e5] px-4 text-[16px] font-bold text-white shadow-md">
        {page + 1}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e2e6f5] bg-white text-slate-500 hover:bg-[#f7f8fc] hover:text-[#1b2252] disabled:opacity-40 transition-colors shadow-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
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

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getClientName(job: JobResponse) {
  return job.clientName || job.client?.displayName || job.client?.fullName || 'Company'
}

function getProposalCount(job: JobResponse) {
  return job.proposalCount || 0
}
"""

with open(r"d:\Mentor X\mentorx-fe\src\pages\job\JobListPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated JobListPage.tsx successfully.")
