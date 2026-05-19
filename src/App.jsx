import './App.css'

const stats = [
  { value: '1,200+', label: 'Mentor toan cau' },
  { value: '4.9/5', label: 'Diem hai long trung binh' },
  { value: '24h', label: 'Thoi gian ghep mentor' },
  { value: '15+', label: 'Linh vuc chuyen sau' },
]

const features = [
  {
    title: 'AI Matching theo muc tieu',
    description:
      'He thong hoc may phan tich muc tieu, ky nang va lich cua ban de de xuat mentor phu hop nhat.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3.5l8 4.5v8l-8 4.5-8-4.5v-8l8-4.5zm0 2.2L6 8v5.6l6 3.3 6-3.3V8l-6-2.3zm0 3.1a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
        />
      </svg>
    ),
  },
  {
    title: 'Lo trinh ca nhan hoa',
    description:
      'Mentor cung ban thiet ke lo trinh theo moc 30-60-90 ngay voi ket qua do luong ro rang.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1zm3 4h8v2H7V9zm0 4h5v2H7v-2z"
        />
      </svg>
    ),
  },
  {
    title: 'Theo doi tien do realtime',
    description:
      'Dashboard hien thi tien do, nhiem vu va feedback sau moi buoi de dam bao ban di dung huong.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm2 4h3v9H7V8zm7 3h3v6h-3v-6z"
        />
      </svg>
    ),
  },
  {
    title: 'Ho tro 1-1 linh hoat',
    description:
      'Dat lich nhanh, chon dinh dang video hoac text, tai lieu duoc luu tru va dong bo.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 4h10a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1zm2 4h6v2H9V8zm0 4h6v2H9v-2z"
        />
      </svg>
    ),
  },
]

const steps = [
  {
    title: 'Chia se muc tieu nghe nghiep',
    description:
      'Tra loi nhanh 5 phut de MentorX hieu muc tieu, ky nang va lo trinh ban mong muon.',
  },
  {
    title: 'Nhan de xuat mentor',
    description:
      'Xem danh sach mentor phu hop kem ho so, lich ranh va danh gia tu hoc vien truoc.',
  },
  {
    title: 'Bat dau hoc 1-1',
    description:
      'Dat lich, nhan tai lieu va theo doi tien do ngay trong cung mot khong gian lam viec.',
  },
]

const mentors = [
  {
    name: 'Linh Pham',
    role: 'Product Lead @ Fintech',
    focus: 'Growth Strategy',
    rating: '4.9',
    sessions: '230 buoi',
  },
  {
    name: 'Minh Tran',
    role: 'Engineering Manager @ SaaS',
    focus: 'System Design',
    rating: '5.0',
    sessions: '180 buoi',
  },
  {
    name: 'Ngoc Anh',
    role: 'Head of Marketing @ EdTech',
    focus: 'Go-to-Market',
    rating: '4.8',
    sessions: '210 buoi',
  },
]

const testimonials = [
  {
    quote:
      'Sau 6 tuan minh da chuyen nganh thanh cong. Mentor luon theo sat va ho tro rat thuc te.',
    name: 'Hoang Minh',
    role: 'Frontend Developer',
  },
  {
    quote:
      'Lo trinh ro rang, feedback chi tiet. Minh tu tin hon trong cac buoi phong van Product.',
    name: 'Thu Trang',
    role: 'Associate PM',
  },
  {
    quote:
      'MentorX giup minh xay dung network moi va len ke hoach phat trien doi nhom.',
    name: 'Anh Quan',
    role: 'Team Lead',
  },
]

function App() {
  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="logo-badge">MX</div>
            <div>
              <p className="text-lg font-semibold text-slate-900">MentorX</p>
              <p className="text-xs text-slate-500">Career mentorship platform</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Tinh nang
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              Cach hoat dong
            </a>
            <a href="#mentors" className="hover:text-slate-900">
              Mentor
            </a>
            <a href="#testimonials" className="hover:text-slate-900">
              Danh gia
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button type="button" className="btn btn-outline">
              Dang nhap
            </button>
            <button type="button" className="btn btn-primary">
              Bat dau
            </button>
          </div>
          <button type="button" className="btn btn-outline md:hidden">
            Menu
          </button>
        </div>
      </header>

      <main>
        <section className="landing-container hero-grid py-16 lg:py-24">
          <div className="space-y-6">
            <span className="eyebrow">Tang toc su nghiep</span>
            <h1 className="hero-title">
              Ket noi voi mentor chat luong de but pha su nghiep trong 90 ngay.
            </h1>
            <p className="hero-subtitle">
              MentorX giup ban tim dung mentor, xay lo trinh ro rang va theo doi
              tien do moi tuan. Tu muc tieu den ket qua deu duoc do luong.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary px-6 py-3 text-base"
              >
                Bat dau mien phi
              </button>
              <button
                type="button"
                className="btn btn-outline px-6 py-3 text-base"
              >
                Xem mentor noi bat
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex -space-x-2">
                <div className="avatar">AT</div>
                <div className="avatar">ML</div>
                <div className="avatar">PN</div>
                <div className="avatar">+5k</div>
              </div>
              <span>Hon 20.000 hoc vien da tang toc cung MentorX</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="flex items-center justify-between">
              <span className="hero-chip">Live Matching</span>
              <span className="text-xs text-slate-300">Dang mo</span>
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-white">
              Tim mentor phu hop trong 1 buoi
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              MentorX phan tich muc tieu, ky nang va lich cua ban de dua ra danh
              sach mentor phu hop nhat.
            </p>
            <div className="mt-6 grid gap-4">
              <div className="hero-card-panel">
                <div className="flex items-center justify-between text-sm">
                  <span>Mentor de xuat</span>
                  <span className="font-semibold text-emerald-300">
                    98% phu hop
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="avatar avatar-dark">LP</div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Linh Pham
                    </p>
                    <p className="text-xs text-slate-300">
                      Product Lead - 230 buoi
                    </p>
                  </div>
                </div>
              </div>
              <div className="hero-card-panel">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Lich san sang tuan nay
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-800/80 p-3 text-center">
                    Tue
                    <p className="mt-1 text-sm font-semibold text-white">18:00</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 text-center">
                    Thu
                    <p className="mt-1 text-sm font-semibold text-white">09:00</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/20 p-3 text-center">
                    Sat
                    <p className="mt-1 text-sm font-semibold text-emerald-200">
                      14:00
                    </p>
                  </div>
                </div>
              </div>
              <div className="hero-card-panel">
                <div className="flex items-center justify-between text-sm">
                  <span>Tien do lo trinh</span>
                  <span className="font-semibold text-white">72%</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"></div>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Muc tieu tiep theo: Chuan bi portfolio
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-container pb-16">
          <div className="stats-grid">
            {stats.map((item) => (
              <div key={item.label} className="stat-card">
                <p className="text-2xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="landing-container py-16">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Tinh nang noi bat</p>
            <h2 className="section-title">
              Tap trung vao ket qua, toi uu tung buoi mentor.
            </h2>
            <p className="section-subtitle">
              Tu tim mentor, dat lich den theo doi tien do deu duoc thiet ke de
              ban tap trung hoc hoi va hanh dong nhanh hon.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-container py-16">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Cach hoat dong</p>
            <h2 className="section-title">
              Chi 3 buoc de bat dau hanh trinh cung mentor.
            </h2>
            <p className="section-subtitle">
              Onboarding nhanh gon, ban se duoc de xuat mentor va lich hoc phu
              hop trong vong 24 gio.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="step-card">
                <span className="tag">Buoc {index + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="mentors" className="landing-container py-16">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Mentor noi bat</p>
            <h2 className="section-title">
              Mentor giau kinh nghiem tu cac cong ty hang dau.
            </h2>
            <p className="section-subtitle">
              Chon mentor theo linh vuc, phong cach huong dan va lich phu hop
              voi ban.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <div key={mentor.name} className="mentor-card">
                <div className="flex items-center justify-between">
                  <span className="tag">{mentor.focus}</span>
                  <span className="text-sm text-slate-500">
                    Rating {mentor.rating}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {mentor.name}
                </h3>
                <p className="text-sm text-slate-500">{mentor.role}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{mentor.sessions}</span>
                  <button type="button" className="btn btn-outline">
                    Xem ho so
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="testimonials" className="landing-container py-16">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Cam nhan hoc vien</p>
            <h2 className="section-title">
              Hoc vien dat muc tieu nhanh hon nho mentor phu hop.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="testimonial-card">
                <p className="text-sm text-slate-600">"{item.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="avatar">{item.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-container pb-20">
          <div className="cta-panel">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  San sang tang toc su nghiep cung MentorX?
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  Bat dau mien phi, xem mentor phu hop va dat lich ngay hom nay.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="btn btn-primary px-6 py-3 text-base"
                >
                  Bat dau mien phi
                </button>
                <button
                  type="button"
                  className="btn btn-outline bg-white text-slate-900 hover:bg-slate-100"
                >
                  Lien he tu van
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="landing-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">MentorX</p>
            <p className="text-sm text-slate-500">
              Nen tang ket noi mentor va mentee tai Viet Nam.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#features" className="text-slate-500 hover:text-slate-900">
              Tinh nang
            </a>
            <a
              href="#how-it-works"
              className="text-slate-500 hover:text-slate-900"
            >
              Cach hoat dong
            </a>
            <a href="#mentors" className="text-slate-500 hover:text-slate-900">
              Mentor
            </a>
            <a
              href="#testimonials"
              className="text-slate-500 hover:text-slate-900"
            >
              Danh gia
            </a>
          </div>
          <p className="text-xs text-slate-400">
            (c) 2026 MentorX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
