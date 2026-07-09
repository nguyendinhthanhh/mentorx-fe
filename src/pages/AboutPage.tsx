import { Link } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Compass,
  FileSearch,
  GraduationCap,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  Target,
  UserRound,
  Users,
} from 'lucide-react'

const mentorRoute = '/mentors'
const becomeMentorRoute = '/become-a-mentor'

const problems = [
  {
    title: 'Không biết bắt đầu từ đâu',
    description: 'Người học công nghệ thường mất nhiều thời gian để chọn hướng đi và xác định lộ trình phù hợp.',
    icon: Compass,
  },
  {
    title: 'Thiếu kinh nghiệm thực tế',
    description: 'Tài liệu rất nhiều nhưng thiếu góc nhìn từ người đã trực tiếp làm việc trong ngành.',
    icon: Code2,
  },
  {
    title: 'Khó chuẩn bị cho công việc',
    description: 'CV, dự án, phỏng vấn và cách làm việc thực tế thường cần người hướng dẫn đủ sát bối cảnh.',
    icon: Target,
  },
]

const values = [
  'Mentor có chuyên môn phù hợp',
  'Kinh nghiệm làm việc thực tế',
  'Thông tin đánh giá minh bạch',
  'Sự đồng hành dài hạn',
]

const menteeItems = [
  'Xây dựng lộ trình học tập',
  'Review CV và portfolio',
  'Luyện phỏng vấn thực tế',
  'Giải quyết bài toán kỹ thuật',
]

const mentorItems = [
  'Chia sẻ kinh nghiệm thực chiến',
  'Phát triển cộng đồng công nghệ',
  'Xây dựng thương hiệu cá nhân',
  'Tạo thêm nguồn thu nhập ổn định',
]

const pricingTiers = [
  {
    name: 'Khởi đầu',
    description: 'Giao dịch nhỏ',
    price: '10',
    unit: 'MX',
    pillText: 'Dưới 200 MX',
    pillColor: 'bg-slate-100 text-slate-700',
    features: ['Thanh toán an toàn', 'Bảo vệ bởi Escrow', 'Phí cố định 10 MX'],
    highlight: false,
  },
  {
    name: 'Tiêu chuẩn',
    description: 'Tiết kiệm hơn',
    price: '10',
    unit: '%',
    pillText: '200 – dưới 500 MX',
    pillColor: 'bg-emerald-50 text-emerald-700',
    features: ['Thanh toán an toàn', 'Bảo vệ bởi Escrow', 'Phí nền tảng 10%'],
    highlight: false,
  },
  {
    name: 'Phổ biến',
    description: 'Giá trị tốt nhất',
    price: '9',
    unit: '%',
    pillText: '500 – dưới 1.000 MX',
    pillColor: 'bg-indigo-50 text-indigo-700',
    features: ['Tối ưu chi phí nhất', 'Bảo vệ bởi Escrow', 'Phí nền tảng 9%'],
    highlight: true,
  },
  {
    name: 'Nâng cao',
    description: 'Dành cho chuyên sâu',
    price: '8',
    unit: '%',
    pillText: '1.000 – dưới 2.000 MX',
    pillColor: 'bg-purple-50 text-purple-700',
    features: ['Tiết kiệm chi phí', 'Bảo vệ bởi Escrow', 'Phí nền tảng 8%'],
    highlight: false,
  },
  {
    name: 'Cao cấp',
    description: 'Giao dịch lớn',
    price: '7',
    unit: '%',
    pillText: '2.000 – dưới 5.000 MX',
    pillColor: 'bg-orange-50 text-orange-700',
    features: ['Tối ưu cao nhất', 'Bảo vệ bởi Escrow', 'Phí nền tảng 7%'],
    highlight: false,
  },
  {
    name: 'Đặc quyền',
    description: 'Dành cho tổ chức',
    price: '5',
    unit: '%',
    pillText: 'Từ 5.000 MX trở lên',
    pillColor: 'bg-pink-50 text-pink-700',
    features: ['Hỗ trợ đặc quyền', 'Bảo vệ bởi Escrow', 'Tối đa 350 MX phí'],
    highlight: false,
  },
]

const stats = [
  { value: '100+', label: 'Mentor được xác minh' },
  { value: '20+', label: 'Lĩnh vực công nghệ' },
  { value: '1,000+', label: 'Phiên mentoring' },
  { value: '95%', label: 'Người dùng hài lòng' },
]

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

function SectionHeader({
  title,
  description,
  badge,
  align = 'center',
}: {
  title: string
  description?: string
  badge?: string
  align?: 'center' | 'left'
}) {
  const alignClass = align === 'left' ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center flex flex-col items-center'

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className={alignClass}
    >
      {badge && (
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
          {badge}
        </span>
      )}
      <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg leading-relaxed text-slate-600">{description}</p>}
    </motion.div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Visual Hero Section */}
      <section className="border-b border-slate-200 bg-white overflow-hidden">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8 lg:py-24">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={slideInLeft}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
              Về Mentor X
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[56px]">
              Phát triển bản thân <br className="hidden sm:block" />
              với mentor phù hợp.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Nền tảng kết nối trực tiếp bạn với những kỹ sư, nhà thiết kế và chuyên gia công nghệ giàu kinh nghiệm. Xây dựng lộ trình, sửa lỗi thực tế và tự tin thăng tiến.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={mentorRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1"
              >
                Tìm mentor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={becomeMentorRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 font-bold text-slate-900 transition-colors hover:bg-slate-200"
              >
                Trở thành mentor
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Đặt lịch linh hoạt
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Xác minh uy tín
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="relative w-full"
            initial="hidden" 
            animate="visible" 
            variants={slideInRight}
          >
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
                alt="Mentoring session illustration" 
                className="w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <motion.div 
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            badge="Mục tiêu"
            title="Định hướng rõ ràng cho hành trình công nghệ"
            description="Tập trung giải quyết những điểm nghẽn phổ biến nhất của người học khi muốn đi nhanh và đi đúng hướng."
          />
          <motion.div 
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {problems.map((item) => (
              <motion.article 
                key={item.title} 
                variants={fadeInUp}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <item.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Visual Workflow Section (Zig-Zag) */}
      <section className="bg-slate-50 border-t border-slate-200 overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            badge="Quy trình"
            title="Cách thức hoạt động"
            description="Mọi thứ được thiết kế để bạn nhanh chóng đi từ nhu cầu sang một buổi mentoring hiệu quả."
          />
          
          <div className="mt-16 space-y-24">
            {/* Step 1 & 2 */}
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <motion.div 
                className="order-2 lg:order-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={slideInLeft}
              >
                <img 
                  src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
                  alt="Search mentor workflow" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </motion.div>
              <motion.div 
                className="order-1 lg:order-2 lg:pl-10 space-y-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.div className="group" variants={fadeInUp}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition-transform group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                      1
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Tìm mentor phù hợp</h3>
                  </div>
                  <p className="mt-3 ml-13 text-base leading-relaxed text-slate-600">
                    Tìm kiếm theo kỹ năng, lĩnh vực và mục tiêu phát triển. Công cụ tìm kiếm mạnh mẽ giúp bạn nhanh chóng thu hẹp danh sách các chuyên gia phù hợp nhất với nhu cầu hiện tại.
                  </p>
                </motion.div>
                <motion.div className="group" variants={fadeInUp}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition-transform group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                      2
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Xem hồ sơ chuyên gia</h3>
                  </div>
                  <p className="mt-3 ml-13 text-base leading-relaxed text-slate-600">
                    Đọc kỹ chuyên môn, kinh nghiệm thực chiến, phong cách hỗ trợ, đánh giá từ người học trước và mức giá để đưa ra quyết định chính xác.
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Step 3 & 4 */}
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <motion.div 
                className="space-y-10 lg:pr-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.div className="group" variants={fadeInUp}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition-transform group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                      3
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Đặt lịch linh hoạt</h3>
                  </div>
                  <p className="mt-3 ml-13 text-base leading-relaxed text-slate-600">
                    Chọn thời gian mentoring phù hợp thông qua lịch trực quan. Việc đồng bộ lịch diễn ra tự động để hai bên dễ dàng sắp xếp thời gian chung.
                  </p>
                </motion.div>
                <motion.div className="group" variants={fadeInUp}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition-transform group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                      4
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Tham gia mentoring</h3>
                  </div>
                  <p className="mt-3 ml-13 text-base leading-relaxed text-slate-600">
                    Tham gia buổi gọi video chất lượng cao hoặc trò chuyện trực tiếp để nhận hướng dẫn rõ ràng, và quan trọng nhất là chuyển lời khuyên thành hành động thực tế.
                  </p>
                </motion.div>
              </motion.div>
              <motion.div 
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={slideInRight}
              >
                <img 
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
                  alt="Online mentoring workflow" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          
          {/* Section intro */}
          <SectionHeader
            badge="Chi phí"
            title="Phí nền tảng minh bạch"
            description="Không có phí ẩn. Phí được hiển thị rõ trước khi đặt lịch. Bạn luôn biết chính xác số tiền cần thanh toán hoặc nhận được."
          />

          <motion.div
            className="mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <motion.div 
                  key={tier.name}
                  variants={fadeInUp}
                  className={`relative flex flex-col rounded-[2rem] border p-8 shadow-sm transition-all hover:shadow-md ${
                    tier.highlight 
                      ? 'border-indigo-500 shadow-indigo-500/20 shadow-xl md:-translate-y-4 z-10 bg-white ring-1 ring-indigo-500' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                        Phổ biến nhất
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{tier.description}</p>
                  </div>
                  
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900">{tier.price}</span>
                    <span className="text-lg font-bold text-slate-500">{tier.unit}</span>
                  </div>
                  
                  <div className="mb-8">
                    <span className={`inline-block rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${tier.pillColor}`}>
                      {tier.pillText}
                    </span>
                  </div>
                  
                  <ul className="mb-8 flex-1 space-y-4">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    to={mentorRoute}
                    className={`w-full text-center rounded-xl py-3.5 text-sm font-bold transition-all ${
                      tier.highlight 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:-translate-y-0.5' 
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    Tìm mentor ngay
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Trust & Example Below */}
            <motion.div variants={fadeInUp} className="mt-12 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Thanh toán an toàn qua Escrow</h4>
                    <p className="mt-1 text-sm text-slate-600">Tiền của bạn chỉ được chuyển cho mentor sau khi buổi học diễn ra thành công.</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-px h-16 bg-slate-200" />
              <div className="flex-1 w-full rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-900 mb-2">💡 Ví dụ tính phí</h4>
                <p className="text-sm text-indigo-800">
                  Với buổi mentoring trị giá <span className="font-bold">800 MX</span>, phí nền tảng là <span className="font-bold text-indigo-600">72 MX</span> (9%). Mentor thực nhận <span className="font-bold text-emerald-600">728 MX</span>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            badge="Vai trò"
            title="Phát triển cùng Mentor X"
            description="Chúng tôi xây dựng hệ sinh thái để cả hai phía đều nhận được giá trị rõ ràng."
          />
          <motion.div 
            className="mt-12 grid gap-6 lg:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.article 
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 hover:border-indigo-200"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Dành cho người học</h3>
              </div>
              <div className="mt-6 flex-1 space-y-4">
                {menteeItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-base font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to={mentorRoute}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 font-bold text-white transition hover:bg-indigo-700"
              >
                Tìm mentor phù hợp
              </Link>
            </motion.article>

            <motion.article 
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 hover:border-indigo-200"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Dành cho mentor</h3>
              </div>
              <div className="mt-6 flex-1 space-y-4">
                {mentorItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-base font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to={becomeMentorRoute}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-900 transition hover:bg-slate-200"
              >
                Trở thành mentor
              </Link>
            </motion.article>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div 
            className="rounded-3xl bg-slate-900 px-6 py-16 text-center shadow-2xl shadow-slate-900/20 sm:px-12 sm:py-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
          >
            <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Sẵn sàng bắt đầu hành trình?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Hàng trăm chuyên gia đang sẵn sàng hỗ trợ bạn.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={mentorRoute}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 font-bold text-slate-900 transition hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105"
              >
                Khám phá mentor
              </Link>
              <Link
                to={becomeMentorRoute}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-8 font-bold text-white transition hover:bg-slate-700"
              >
                Trở thành mentor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
