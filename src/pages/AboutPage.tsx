import { useI18n } from '@/i18n/I18nProvider'
import { Rocket, Target, Users, BookOpen, Shield, Globe } from 'lucide-react'

export default function AboutPage() {
  const { t } = useI18n()

  const stats = [
    { label: t('about.stats.mentors'), value: '500+', icon: Users },
    { label: t('about.stats.students'), value: '10,000+', icon: Globe },
    { label: t('about.stats.courses'), value: '200+', icon: BookOpen },
  ]

  const values = [
    { title: t('about.values.growth'), description: t('home.why.career.description'), icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: t('about.values.integrity'), description: t('home.why.mentor.description'), icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: t('about.values.community'), description: t('home.why.job.description'), icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#101a4a] py-20 text-white lg:py-32">
        {/* Animated background elements */}
        <div className="absolute left-0 top-0 h-full w-full overflow-hidden opacity-20">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500 blur-[100px]" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-purple-500 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {t('about.title')}
              </h1>
              <p className="mt-6 text-xl text-blue-100 lg:max-w-md">
                {t('about.subtitle')}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button className="rounded-xl bg-[#4f46e5] px-8 py-3.5 text-lg font-bold transition hover:bg-[#4338ca] hover:shadow-lg hover:shadow-indigo-500/30">
                  {t('nav.register')}
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
                <img 
                  src="/assets/images/about-hero.png" 
                  alt="Mentor X Hero" 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-xl sm:-bottom-10 sm:-left-10">
                <p className="text-3xl font-black text-white">#1</p>
                <p className="text-sm font-bold text-blue-200">Mentoring Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="-mt-12 relative z-10 mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <div key={idx} className="group rounded-2xl border border-[#e2e6f5] bg-white p-8 text-center shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">{t('about.story.title')}</h2>
            <div className="mt-4 h-1.5 w-20 mx-auto rounded-full bg-blue-600" />
            <p className="mt-8 text-lg leading-relaxed text-slate-600">
              {t('about.story.content')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-600">
                {t('about.mission.title')}
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                Tầm nhìn của chúng tôi vươn xa hơn cả việc kết nối.
              </h2>
              <p className="mt-6 text-lg text-slate-600">
                {t('about.mission.content')}
              </p>
              <div className="mt-10 space-y-4">
                {['Đồng hành cùng bạn trên mọi bước đường sự nghiệp.', 'Học hỏi từ những chuyên gia hàng đầu thị trường.', 'Cơ hội việc làm chất lượng cao mỗi ngày.'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Target className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="h-64 rounded-2xl bg-blue-100 overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" className="w-full h-full object-cover" alt="Team" />
                </div>
                <div className="h-40 rounded-2xl bg-indigo-600 p-6 text-white flex flex-col justify-end">
                  <p className="text-2xl font-black">1:1</p>
                  <p className="text-sm font-bold opacity-80">Mentoring</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-40 rounded-2xl bg-[#101a4a] p-6 text-white flex flex-col justify-end">
                  <p className="text-2xl font-black">24/7</p>
                  <p className="text-sm font-bold opacity-80">Support</p>
                </div>
                <div className="h-64 rounded-2xl bg-purple-100 overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Workshop" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">{t('about.values.title')}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-3xl border border-[#e2e6f5] bg-white p-8 text-left transition hover:border-blue-200 hover:shadow-xl">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${value.bg} ${value.color} transition group-hover:scale-110`}>
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900">{value.title}</h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4f46e5] to-[#2d6cdf] px-8 py-16 text-center text-white lg:px-16 lg:py-24">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
              Sẵn sàng để bứt phá sự nghiệp?
            </h2>
            <p className="mt-6 text-lg text-blue-100">
              Tham gia cùng 10,000+ người dùng và tìm thấy người dẫn dắt hoàn hảo cho hành trình của bạn ngay hôm nay.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button className="rounded-2xl bg-white px-10 py-4 text-lg font-bold text-[#4f46e5] transition hover:bg-blue-50">
                Bắt đầu ngay
              </button>
              <button className="rounded-2xl border border-white/20 bg-white/10 px-10 py-4 text-lg font-bold backdrop-blur-md transition hover:bg-white/20">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        </div>
      </section>
    </div>
  )
}
