import { Link } from 'react-router-dom'
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

const workflow = [
  {
    step: '01',
    title: 'Tìm mentor phù hợp',
    description: 'Tìm theo kỹ năng, lĩnh vực và mục tiêu phát triển.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Xem hồ sơ và kinh nghiệm',
    description: 'Đọc kỹ hồ sơ, chuyên môn, phong cách hỗ trợ và mức giá.',
    icon: FileSearch,
  },
  {
    step: '03',
    title: 'Chọn thời gian và đặt lịch',
    description: 'Đặt buổi mentoring linh hoạt theo nhu cầu cụ thể của bạn.',
    icon: CalendarDays,
  },
  {
    step: '04',
    title: 'Tham gia buổi mentoring',
    description: 'Nhận hướng dẫn rõ ràng và chuyển lời khuyên thành hành động.',
    icon: MessageSquareText,
  },
]

const values = [
  'Mentor có chuyên môn phù hợp.',
  'Kinh nghiệm thực tế.',
  'Thông tin minh bạch.',
  'Đồng hành lâu dài.',
]

const menteeItems = [
  'Xây dựng lộ trình học tập.',
  'Review CV và dự án.',
  'Luyện phỏng vấn.',
  'Giải đáp vấn đề kỹ thuật.',
]

const mentorItems = [
  'Chia sẻ kinh nghiệm thực tế.',
  'Hỗ trợ cộng đồng công nghệ.',
  'Xây dựng thương hiệu cá nhân.',
  'Tạo thêm nguồn thu nhập.',
]

const pricingRows = [
  { range: 'Dưới 200.000đ', fee: '10.000đ cố định' },
  { range: '200.000đ - dưới 500.000đ', fee: '10%' },
  { range: '500.000đ - dưới 1.000.000đ', fee: '9%' },
  { range: '1.000.000đ - dưới 2.000.000đ', fee: '8%' },
  { range: '2.000.000đ - dưới 5.000.000đ', fee: '7%' },
  { range: 'Từ 5.000.000đ trở lên', fee: '5%, tối đa 350.000đ' },
]

const stats = [
  { value: '100+', label: 'mentor' },
  { value: '20+', label: 'lĩnh vực' },
  { value: '1.000+', label: 'phiên mentoring' },
  { value: '95%', label: 'người dùng hài lòng' },
]

function SectionHeader({
  title,
  description,
  align = 'center',
}: {
  title: string
  description?: string
  align?: 'center' | 'left'
}) {
  const alignClass = align === 'left' ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center'

  return (
    <div className={alignClass}>
      <h2 className="text-[32px] font-bold leading-tight text-[#0F172A] sm:text-[36px]">{title}</h2>
      {description ? <p className="mt-4 text-[16px] leading-7 text-[#475569]">{description}</p> : null}
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#0F172A]">
      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-3xl text-[38px] font-bold leading-[1.08] text-[#0F172A] sm:text-[52px]">
              Phát triển nhanh hơn với người hướng dẫn phù hợp
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#475569] sm:text-[17px]">
              Mentor X kết nối bạn với những chuyên gia công nghệ giàu kinh nghiệm, giúp bạn xây dựng lộ trình
              học tập, giải quyết vấn đề thực tế và chuẩn bị tốt hơn cho sự nghiệp.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={mentorRoute}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4338CA] focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                Tìm mentor
              </Link>
              <Link
                to={becomeMentorRoute}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                Trở thành mentor
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-[#475569]">
              Đặt lịch linh hoạt · Hồ sơ được xác minh · Thanh toán minh bạch
            </p>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="rounded-[12px] border border-[#E2E8F0] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[18px] font-semibold text-[#0F172A]">Nguyễn Minh Khôi</p>
                      <p className="mt-1 text-sm text-[#475569]">Senior Backend Engineer</p>
                      <p className="mt-1 text-sm text-[#475569]">Tiki · System Design · Java · Microservices</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                    Đã xác minh
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-medium text-[#64748B]">Kinh nghiệm</p>
                    <p className="mt-2 text-sm font-semibold text-[#0F172A]">8 năm làm sản phẩm công nghệ</p>
                  </div>
                  <div className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-medium text-[#64748B]">Giá buổi mentoring</p>
                    <p className="mt-2 text-sm font-semibold text-[#0F172A]">450.000đ / 60 phút</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                    <Star className="h-4 w-4 text-[#4F46E5]" />
                    <span className="font-semibold">4.9</span>
                    <span className="text-[#64748B]">(126 đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#475569]">
                    <Clock3 className="h-4 w-4 text-[#4F46E5]" />
                    Phản hồi trong 24h
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {['System Design', 'Backend', 'Phỏng vấn'].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={mentorRoute}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC]"
                  >
                    Xem hồ sơ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            title="Định hướng rõ ràng hơn cho hành trình công nghệ"
            description="Mentor X tập trung vào những điểm nghẽn phổ biến nhất của người học khi muốn đi nhanh và đi đúng hướng."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {problems.map((item) => (
              <article
                key={item.title}
                className="rounded-[12px] border border-[#E2E8F0] bg-white p-6 transition hover:border-[#CBD5E1] hover:bg-[#FCFCFF]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF2FF] text-[#4F46E5]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-[19px] font-semibold text-[#0F172A]">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[#475569]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            title="Cách Mentor X hoạt động"
            description="Quy trình được giữ đơn giản để người học nhanh chóng đi từ nhu cầu sang một buổi mentoring rõ ràng."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.step} className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#CBD5E1] bg-white text-sm font-semibold text-[#4F46E5]">
                    {item.step}
                  </div>
                  <item.icon className="h-5 w-5 text-[#4F46E5]" />
                </div>
                <h3 className="mt-5 text-[18px] font-semibold text-[#0F172A]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[#475569]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            title="Giá trị cốt lõi"
            description="Mọi tương tác trên nền tảng đều xoay quanh tính phù hợp, tính minh bạch và giá trị dài hạn."
          />

          <div className="mt-12 grid gap-x-8 gap-y-5 md:grid-cols-2">
            {values.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                <p className="text-[16px] leading-7 text-[#0F172A]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            title="Dành cho người học và mentor"
            description="Mentor X được xây để phục vụ đồng thời hai phía, nhưng giữ cùng một ngôn ngữ thiết kế và mức độ rõ ràng."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[12px] border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF2FF] text-[#4F46E5]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-[20px] font-semibold text-[#0F172A]">Dành cho người học</h3>
              </div>
              <div className="mt-6 space-y-3">
                {menteeItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                    <p className="text-[15px] leading-7 text-[#475569]">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to={mentorRoute}
                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4338CA] focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                Khám phá mentor
              </Link>
            </article>

            <article className="rounded-[12px] border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF2FF] text-[#4F46E5]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-[20px] font-semibold text-[#0F172A]">Dành cho mentor</h3>
              </div>
              <div className="mt-6 space-y-3">
                {mentorItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                    <p className="text-[15px] leading-7 text-[#475569]">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                to={becomeMentorRoute}
                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                Trở thành mentor
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            title="Phí nền tảng minh bạch"
            description="Phí được hiển thị rõ trước khi đặt lịch. Mentor và mentee luôn biết chính xác số tiền cần thanh toán và số tiền được nhận."
          />

          <div className="mt-10 overflow-x-auto">
            <div className="mx-auto max-w-[880px] overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white">
              <div className="grid grid-cols-[minmax(260px,1.35fr)_minmax(180px,0.65fr)] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A] sm:px-6">
                <div>Giá trị giao dịch</div>
                <div>Phí nền tảng</div>
              </div>
              <div className="divide-y divide-[#E2E8F0]">
                {pricingRows.map((row) => (
                  <div
                    key={row.range}
                    className="grid grid-cols-[minmax(260px,1.35fr)_minmax(180px,0.65fr)] px-5 py-3 text-sm text-[#475569] sm:px-6"
                  >
                    <div>{row.range}</div>
                    <div className="font-medium text-[#0F172A]">{row.fee}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-4 max-w-[880px]">
            <p className="text-sm leading-6 text-[#64748B]">
              Phí nền tảng được áp dụng theo từng mức giao dịch và hiển thị rõ trước khi xác nhận lịch hẹn.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 border-y border-[#E2E8F0] py-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[30px] font-semibold text-[#0F172A]">{stat.value}</p>
                <p className="mt-1 text-sm text-[#64748B]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1120px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[14px] bg-[#0F172A] px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="mx-auto max-w-2xl text-[32px] font-bold leading-tight text-white sm:text-[36px]">
              Sẵn sàng tìm người đồng hành phù hợp?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-8 text-slate-300">
              Khám phá các mentor giàu kinh nghiệm và bắt đầu xây dựng lộ trình phát triển của bạn.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={mentorRoute}
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Tìm mentor ngay
              </Link>
              <Link
                to={becomeMentorRoute}
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                Trở thành mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
