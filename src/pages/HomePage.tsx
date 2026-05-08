import { homeApi } from '@/api/homeApi'
import { useQuery } from 'react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, MapPin, Star, ChevronRight, LayoutGrid, ChevronDown, 
  Bookmark, Briefcase, Code, Megaphone, PenTool, Users, TrendingUp, 
  Database, Package, Rocket, Handshake, CheckCircle2 
} from 'lucide-react'

const formatBudget = (job: { budgetMinMxc?: number; budgetMaxMxc?: number; hourlyRateMxc?: number }) => {
  if (job.budgetMinMxc && job.budgetMaxMxc) {
    return `${job.budgetMinMxc.toLocaleString('vi-VN')} - ${job.budgetMaxMxc.toLocaleString('vi-VN')} VND`
  }
  if (job.hourlyRateMxc) return `${job.hourlyRateMxc.toLocaleString('vi-VN')} VND/giờ`
  return 'Thỏa thuận'
}

const mockJobs = [
  {
    jobId: '1',
    title: 'Product Manager',
    client: { displayName: 'Zalo' },
    jobType: 'Toàn thời gian',
    budgetMinMxc: 25000000,
    budgetMaxMxc: 40000000,
    tags: ['Product Management', 'Agile', 'Analytics'],
    isNew: true
  },
  {
    jobId: '2',
    title: 'Senior Frontend Developer',
    client: { displayName: 'Tiki' },
    jobType: 'Toàn thời gian',
    budgetMinMxc: 30000000,
    budgetMaxMxc: 45000000,
    tags: ['React', 'TypeScript', 'Next.js'],
    isRemote: true
  },
  {
    jobId: '3',
    title: 'Data Analyst',
    client: { displayName: 'VNG' },
    jobType: 'Hybrid',
    budgetMinMxc: 18000000,
    budgetMaxMxc: 28000000,
    tags: ['SQL', 'Python', 'Power BI'],
    isNew: true
  },
  {
    jobId: '4',
    title: 'UI/UX Designer',
    client: { displayName: 'MD' },
    jobType: 'Hybrid',
    budgetMinMxc: 15000000,
    budgetMaxMxc: 25000000,
    tags: ['Figma', 'UI Design', 'UX Research'],
    isRemote: true
  }
]

const mockMentors = [
  {
    userId: '1',
    user: { fullName: 'Trần Minh Đức', avatarUrl: 'https://i.pravatar.cc/150?u=1' },
    headline: 'Senior Engineering Manager\nGoogle',
    averageRating: 5.0,
    totalReviews: 152,
    tags: ['System Design', 'Tech Leadership', 'Career Coaching']
  },
  {
    userId: '2',
    user: { fullName: 'Lê Phương Thảo', avatarUrl: 'https://i.pravatar.cc/150?u=2' },
    headline: 'Head of Marketing\nShopee',
    averageRating: 4.9,
    totalReviews: 95,
    tags: ['Brand Marketing', 'Branding', 'Mentoring']
  },
  {
    userId: '3',
    user: { fullName: 'Phạm Quốc Huy', avatarUrl: 'https://i.pravatar.cc/150?u=3' },
    headline: 'Senior Product Manager\nMoMo',
    averageRating: 4.9,
    totalReviews: 128,
    tags: ['Product Strategy', 'Roadmap', 'User Research']
  },
  {
    userId: '4',
    user: { fullName: 'Nguyễn Thu Hà', avatarUrl: 'https://i.pravatar.cc/150?u=4' },
    headline: 'HR Business Partner\nVinFast',
    averageRating: 4.8,
    totalReviews: 86,
    tags: ['Talent Acquisition', 'HR Strategy', 'Coaching']
  }
]

export default function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')

  const { data, isLoading } = useQuery(['home-data'], () => homeApi.getHomeData(), {
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

  return (
    <div className="bg-[#f7f8fc] min-h-screen">
      {/* HERO SECTION */}
      <section className="bg-white pb-16 pt-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-[#1b2252] lg:text-[54px]">
              Tìm việc phù hợp,
              <br />
              gặp mentor đúng người
            </h1>
            <p className="mt-5 max-w-lg text-base text-slate-600 leading-relaxed">
              Nền tảng kết nối việc làm và mentor chất lượng cao, giúp bạn phát triển sự nghiệp nhanh hơn mỗi ngày.
            </p>

            <div className="mt-8 flex items-center rounded-2xl border border-[#e2e6f5] bg-white p-2 shadow-sm">
                <div className="flex flex-1 items-center px-3">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm kiếm công việc, kỹ năng..."
                    className="w-full bg-transparent pl-3 text-sm outline-none text-[#1b2252] placeholder:text-slate-400"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
                <div className="hidden md:flex w-[160px] items-center px-3">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Địa điểm"
                    className="w-full bg-transparent pl-3 text-sm outline-none text-[#1b2252] placeholder:text-slate-400"
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden lg:block"></div>
                <div className="hidden lg:flex w-[140px] items-center justify-between px-3 cursor-pointer">
                   <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <LayoutGrid className="h-4 w-4" />
                      <span>Danh mục</span>
                   </div>
                   <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                <Link
                  to={searchHref}
                  className="inline-flex h-12 w-[120px] shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-sm font-semibold text-white transition hover:bg-[#4338ca] ml-2"
                >
                  Tìm kiếm
                </Link>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-2 px-1 text-xs text-slate-500">
              <span className="font-semibold text-[#1b2252]">Tìm kiếm nhanh:</span>
              {['IT', 'Marketing', 'Thiết kế', 'Data', 'Product', 'Mentor phỏng vấn'].map((item) => (
                <Link key={item} to={`/jobs?q=${encodeURIComponent(item)}`} className="rounded-full border border-[#e2e6f5] bg-white px-3 py-1.5 hover:border-[#4f46e5] hover:text-[#4f46e5] transition">
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
            <div className="absolute -left-6 top-16 w-[280px] rounded-2xl border border-white/40 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-[bounce_6s_ease-in-out_infinite]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-orange-400 to-amber-500 text-[10px] font-black text-white shadow-sm">FPT</div>
                   <span className="text-xs font-bold text-slate-700">FPT Software</span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Mới</span>
              </div>
              <div className="mt-3 text-sm font-bold text-[#1b2252]">Backend Developer (Java)</div>
              <div className="mt-1.5 flex gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Hà Nội</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Remote</span>
              </div>
              <div className="mt-2 text-xs font-bold text-amber-500">20 - 35 triệu VND</div>
              <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-slate-600 font-medium">
                <span className="rounded bg-slate-100 px-2 py-1">Java</span>
                <span className="rounded bg-slate-100 px-2 py-1">Spring Boot</span>
                <span className="rounded bg-slate-100 px-2 py-1">MySQL</span>
                <span className="rounded bg-slate-100 px-2 py-1">API</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold text-[#4f46e5] cursor-pointer">Xem chi tiết</span>
                <Bookmark className="h-4 w-4 text-slate-300 cursor-pointer hover:text-[#4f46e5]" />
              </div>
            </div>

            {/* Mentor Card */}
            <div className="absolute -right-2 bottom-12 w-[240px] rounded-2xl border border-white/40 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-[bounce_5s_ease-in-out_infinite_reverse]">
              <div className="flex justify-end mb-2">
                 <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-600 uppercase tracking-wide">Mentor nổi bật</span>
              </div>
              <div className="flex items-center gap-3">
                 <img src="https://i.pravatar.cc/150?u=12" alt="Avatar" className="h-12 w-12 rounded-full border-2 border-white shadow-sm object-cover" />
                 <div>
                    <div className="text-sm font-bold text-[#1b2252]">Nguyễn Hoàng Anh</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Engineering Manager<br/>MoMo</div>
                 </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                4.9 <span className="font-medium text-slate-400">(128 đánh giá)</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 text-[9px] text-slate-600 font-medium">
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1">Leadership</span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1">System Design</span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1">Career Coaching</span>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#4f46e5] py-2 text-xs font-bold text-white hover:bg-[#4338ca] transition shadow-sm">Đặt lịch tư vấn</button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
          {[
            { icon: <Code className="h-7 w-7 text-indigo-500" />, label: 'Công nghệ\nthông tin' },
            { icon: <Megaphone className="h-7 w-7 text-blue-500" />, label: 'Marketing' },
            { icon: <Briefcase className="h-7 w-7 text-emerald-500" />, label: 'Kinh doanh' },
            { icon: <PenTool className="h-7 w-7 text-purple-500" />, label: 'Thiết kế' },
            { icon: <Users className="h-7 w-7 text-pink-500" />, label: 'Nhân sự' },
            { icon: <TrendingUp className="h-7 w-7 text-amber-500" />, label: 'Tài chính' },
            { icon: <Database className="h-7 w-7 text-cyan-500" />, label: 'Data' },
            { icon: <Package className="h-7 w-7 text-rose-500" />, label: 'Product' },
          ].map((cat, i) => (
            <Link to="/jobs" key={i} className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition mb-3">
                  {cat.icon}
               </div>
               <span className="text-[13px] font-bold text-[#1b2252] text-center whitespace-pre-line">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#1b2252] md:text-3xl">Việc làm nổi bật</h2>
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            Xem tất cả việc làm <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {(data?.featuredJobs?.length ? data.featuredJobs : mockJobs).map((job: any) => (
            <Link key={job.jobId} to={`/jobs/${job.jobId}`} className="group flex flex-col justify-between rounded-2xl border border-transparent bg-white p-5 hover:border-[#4f46e5] shadow-sm hover:shadow-xl transition duration-300">
              <div>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 flex items-center justify-center bg-white overflow-hidden p-1 shadow-sm">
                          <img src={`https://ui-avatars.com/api/?name=${job.client?.displayName || 'C'}&background=random&color=fff&rounded=true&bold=true`} alt="logo" className="h-full w-full object-contain rounded-lg" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 line-clamp-1">{job.client?.displayName || 'Doanh nghiệp'}</span>
                    </div>
                    {job.isNew && <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600 uppercase">Mới</span>}
                    {job.isRemote && <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600 uppercase">Remote</span>}
                </div>
                <p className="mt-4 text-[17px] font-bold text-[#1b2252] group-hover:text-[#4f46e5] transition line-clamp-2">{job.title}</p>
                <div className="mt-2.5 flex gap-4 text-[13px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Hà Nội</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.jobType || 'Hybrid'}</span>
                </div>
                <p className="mt-3 text-sm font-black text-amber-500">{formatBudget(job)}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-slate-600 font-medium">
                  {(job.tags || ['Agile', 'Teamwork']).slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-[#4f46e5]">Xem chi tiết</span>
                <Bookmark className="h-5 w-5 text-slate-300 group-hover:text-[#4f46e5] transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED MENTORS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#1b2252] md:text-3xl">Mentor nổi bật</h2>
          <Link to="/mentors" className="inline-flex items-center gap-1 text-sm font-bold text-[#4f46e5] hover:underline">
            Xem tất cả mentor <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {(data?.featuredMentors?.length ? data.featuredMentors : mockMentors).map((mentor: any) => {
            const mentorName = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
            return (
              <Link key={mentor.userId} to={`/mentors/${mentor.userId}`} className="group flex flex-col justify-between rounded-2xl border border-transparent bg-white p-5 hover:border-[#4f46e5] shadow-sm hover:shadow-xl transition duration-300">
                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src={mentor.user?.avatarUrl || `https://i.pravatar.cc/150?u=${mentor.userId}`}
                      alt={mentorName}
                      className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm border border-slate-100"
                    />
                    <div>
                      <p className="text-[15px] font-bold text-[#1b2252] group-hover:text-[#4f46e5] transition line-clamp-1">{mentorName}</p>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{mentor.headline || 'Professional Mentor'}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {mentor.averageRating?.toFixed(1) || '4.9'} <span className="font-medium text-slate-400">({mentor.totalReviews || 0} đánh giá)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-600 font-medium">
                    {(mentor.tags || ['Career Coaching', 'Leadership']).map((tag: string, i: number) => (
                      <span key={i} className="rounded-full border border-[#e2e6f5] bg-white px-2.5 py-1">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <span className="flex-1 rounded-xl border border-[#e2e6f5] py-2.5 text-center text-[12px] font-bold text-[#4f46e5] hover:bg-slate-50 transition">Đặt lịch</span>
                  <span className="flex-1 rounded-xl bg-[#f4f6ff] py-2.5 text-center text-[12px] font-bold text-[#4f46e5] hover:bg-[#ebf0ff] transition">
                    Xem hồ sơ
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
          <article className="rounded-3xl bg-transparent p-4 flex flex-col justify-center lg:col-span-1 md:col-span-2">
            <h2 className="text-3xl font-black text-[#1b2252] leading-tight">Vì sao chọn<br/>Mentor X?</h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-sm">
              Chúng tôi kết nối việc làm với cơ hội phù hợp và những người dẫn đường đáng tin cậy để bạn tiến xa hơn trong sự nghiệp.
            </p>
            <div className="mt-6">
              <Link to="/about" className="inline-flex rounded-xl bg-[#4f46e5] px-6 py-3 text-sm font-bold text-white hover:bg-[#4338ca] shadow-md transition">
                Tìm hiểu thêm
              </Link>
            </div>
          </article>
          
          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
               <Search className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-black text-[#1b2252]">Tìm việc phù hợp</h3>
            <p className="mt-3 text-[13px] text-slate-500 leading-relaxed">
              Hàng ngàn cơ hội việc làm chất lượng được tuyển chọn mỗi ngày, phù hợp với kỹ năng và mục tiêu của bạn.
            </p>
          </article>
          
          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
               <Handshake className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-black text-[#1b2252]">Kết nối mentor chất lượng</h3>
            <p className="mt-3 text-[13px] text-slate-500 leading-relaxed">
              Học hỏi từ các chuyên gia hàng đầu, nhận tư vấn 1:1 và mở rộng mạng lưới chuyên nghiệp.
            </p>
          </article>

          <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 hover:-translate-y-1 transition duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
               <Rocket className="h-8 w-8 text-[#4f46e5]" />
            </div>
            <h3 className="text-lg font-black text-[#1b2252]">Phát triển sự nghiệp nhanh hơn</h3>
            <p className="mt-3 text-[13px] text-slate-500 leading-relaxed">
              Trang bị kỹ năng, tư duy và lộ trình rõ ràng để bứt phá và đạt được mục tiêu sự nghiệp.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-[#1b2252] md:text-3xl mb-10">Cách hoạt động</h2>
        
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative">
           
           {/* Step 1 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative">
                 <Briefcase className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm">1</div>
              </div>
              <div>
                 <h3 className="font-bold text-[#1b2252] text-base">Tạo hồ sơ</h3>
                 <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">Đăng ký và tạo hồ sơ chuyên nghiệp để nổi bật với nhà tuyển dụng và Mentor.</p>
              </div>
           </div>

           {/* Arrow 1 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-slate-300" />
           </div>

           {/* Step 2 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative">
                 <Search className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm">2</div>
              </div>
              <div>
                 <h3 className="font-bold text-[#1b2252] text-base">Tìm việc hoặc mentor</h3>
                 <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">Khám phá việc làm phù hợp hoặc tìm Mentor theo lĩnh vực, kỹ năng và mục tiêu của bạn.</p>
              </div>
           </div>

           {/* Arrow 2 */}
           <div className="hidden lg:flex items-center justify-center w-12 shrink-0">
               <ChevronRight className="h-6 w-6 text-slate-300" />
           </div>

           {/* Step 3 */}
           <div className="flex-1 rounded-2xl bg-white border border-[#e2e6f5] p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10 shadow-sm hover:border-[#4f46e5] hover:shadow-md transition">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f6ff] flex items-center justify-center relative">
                 <TrendingUp className="h-6 w-6 text-[#4f46e5]" />
                 <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm">3</div>
              </div>
              <div>
                 <h3 className="font-bold text-[#1b2252] text-base">Phát triển sự nghiệp</h3>
                 <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">Nhận tư vấn, kết nối và đồng hành để phát triển sự nghiệp bền vững và lâu dài.</p>
              </div>
           </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#1b2252] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
          
          <div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Users className="h-7 w-7 text-indigo-300" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">150.000+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">Người dùng</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Briefcase className="h-7 w-7 text-blue-300" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">25.000+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">Việc làm đang tuyển dụng</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">3.000+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">Mentor chất lượng</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shrink-0">
                 <Handshake className="h-7 w-7 text-purple-300" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">45.000+</p>
                <p className="mt-1 text-[13px] font-medium text-indigo-200">Kết nối thành công</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
