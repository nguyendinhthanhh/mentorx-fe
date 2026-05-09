import { useI18n } from '@/i18n/I18nProvider'
import { Search, Clock, ChevronRight, Filter } from 'lucide-react'
import { useState } from 'react'

export default function GuidePage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    'All', 'Career Advice', 'Mentoring Tips', 'Success Stories', 'Industry News', 'Tools & Resources'
  ]

  const articles = [
    {
      id: 1,
      title: 'How to make the most of your mentoring sessions',
      excerpt: 'Preparing for your first meeting with a mentor can be daunting. Here are 5 tips to ensure a successful session...',
      category: 'Mentoring Tips',
      date: 'May 12, 2026',
      readTime: '5 min read',
      image: '/assets/images/guide-hero.png'
    },
    {
      id: 2,
      title: 'Top 10 skills employers are looking for in 2026',
      excerpt: 'The job market is evolving rapidly. Discover the key technical and soft skills that will dominate the industry this year.',
      category: 'Career Advice',
      date: 'May 10, 2026',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1454165833767-13a6b060102b?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'From Student to Senior Developer: A Roadmap',
      excerpt: 'Follow this comprehensive guide to navigating your early career and reaching senior positions faster.',
      category: 'Success Stories',
      date: 'May 08, 2026',
      readTime: '12 min read',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Building a personal brand that attracts recruiters',
      excerpt: 'Your LinkedIn profile is just the beginning. Learn how to craft a narrative that resonates with industry leaders.',
      category: 'Career Advice',
      date: 'May 05, 2026',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f7f8fc] pb-24">
      {/* Header Section */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">
              {t('guide.title')}
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              {t('guide.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="mt-10 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-medium transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder={t('guide.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm transition hover:shadow-xl">
          <div className="grid lg:grid-cols-2">
            <div className="relative h-64 overflow-hidden lg:h-auto">
              <img 
                src={articles[0].image} 
                alt="Featured" 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute left-6 top-6 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white">
                {t('guide.featured')}
              </div>
            </div>
            <div className="p-8 lg:p-16">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                <span className="text-blue-600 uppercase tracking-widest">{articles[0].category}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {articles[0].readTime}</span>
              </div>
              <h2 className="mt-4 text-3xl font-black leading-tight text-slate-900 group-hover:text-blue-600 transition">
                {articles[0].title}
              </h2>
              <p className="mt-6 text-lg text-slate-600">
                {articles[0].excerpt}
              </p>
              <button className="mt-10 flex items-center gap-2 font-black text-blue-600 hover:gap-3 transition-all">
                {t('guide.readMore')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Filter */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition ${
                  idx === 0 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </section>

      {/* Article Grid */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-black text-slate-900">{t('guide.latest')}</h3>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(1).map((article) => (
            <div key={article.id} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:shadow-xl">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-blue-600">{article.category}</span>
                  <span className="text-slate-400">{article.date}</span>
                </div>
                <h4 className="mt-3 text-lg font-black text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                  {article.title}
                </h4>
                <p className="mt-3 text-sm text-slate-500 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </div>
                  <button className="rounded-full bg-slate-50 p-2 text-slate-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-16 text-center">
          <button className="rounded-2xl border-2 border-slate-200 bg-white px-10 py-4 text-lg font-bold text-slate-700 transition hover:border-blue-600 hover:text-blue-600">
            Show more articles
          </button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-indigo-50 px-8 py-16 text-center lg:px-16">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-black text-slate-900">Đăng ký nhận cẩm nang hàng tuần</h2>
            <p className="mt-4 text-slate-600">
              Nhận những lời khuyên hữu ích nhất về sự nghiệp và thông tin thị trường mới nhất trực tiếp vào hộp thư của bạn.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
              <button className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white transition hover:bg-blue-700">
                Đăng ký ngay
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400 font-bold">
              Chúng tôi cam kết bảo mật thông tin và không spam. Bạn có thể hủy đăng ký bất cứ lúc nào.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
