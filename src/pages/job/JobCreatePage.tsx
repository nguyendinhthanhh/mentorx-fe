import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lightbulb,
  Scale,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import JobCreateForm from '@/components/job/JobCreateForm'
import { useAuthStore } from '@/store/authStore'

export default function JobCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#f7f8fc] text-slate-950 pb-20 overflow-hidden">
      {/* Background Meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/30 mix-blend-multiply rounded-[40%_60%_70%_30%/40%_50%_60%_50%] filter blur-3xl opacity-60 animate-[spin_15s_linear_infinite] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-300/30 mix-blend-multiply rounded-[60%_40%_30%_70%/60%_30%_70%_40%] filter blur-3xl opacity-60 animate-[spin_12s_linear_infinite_reverse] pointer-events-none"></div>

      <main className="relative mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 lg:px-8 z-10">
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link to="/jobs" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-[#4f46e5] mb-4 transition-colors group bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 hover:border-[#4f46e5]/30">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Quay lại danh sách công việc
            </Link>
            <div className="flex items-center gap-2 mb-2 md:justify-start justify-center">
               <div className="px-3 py-1 rounded-full bg-white/70 border border-white flex items-center gap-1.5 w-fit shadow-sm backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-[#4f46e5]" />
                  <span className="text-[12px] font-bold text-[#4f46e5] tracking-wider uppercase">Tạo Yêu Cầu Mới</span>
               </div>
            </div>
            <h1 className="text-4xl font-extrabold text-[#1b2252] sm:text-5xl tracking-tight leading-tight mt-2">
              Khởi tạo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]">Cơ Hội Mới</span>
            </h1>
            <p className="mt-3 text-[15px] text-slate-500 max-w-2xl mx-auto md:mx-0">
              Mô tả chi tiết bài toán của bạn để hệ thống kết nối với những Mentor xuất sắc nhất. Một yêu cầu rõ ràng sẽ thu hút nhân tài chất lượng.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <JobCreateForm clientId={user.userId} />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[20px] border border-white/50 bg-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(79,70,229,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 mb-5 shadow-inner">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1b2252]">Viết yêu cầu hiệu quả</h3>
              <ul className="mt-4 space-y-3 text-[14px] text-slate-600 list-disc pl-5 marker:text-amber-300">
                <li><strong className="text-slate-800">Cụ thể hóa:</strong> Mô tả rõ ràng bài toán bạn đang gặp phải.</li>
                <li><strong className="text-slate-800">Kết quả:</strong> Nêu rõ Output mong muốn nhận được.</li>
                <li><strong className="text-slate-800">Minh họa:</strong> Đính kèm tài liệu liên quan để Mentor dễ hình dung nhất.</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-white/50 bg-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(79,70,229,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 mb-5 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1b2252]">Thanh toán an toàn</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Hệ thống ký quỹ (Escrow) của MentorX đảm bảo <strong>MX Coin</strong> của bạn chỉ được chuyển đi khi bạn xác nhận công việc đã hoàn thành đúng cam kết.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors">
                <ShieldCheck className="w-4 h-4" /> Tìm hiểu thêm về Escrow
              </div>
            </div>

            <div className="rounded-[20px] border border-white/50 bg-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(79,70,229,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 mb-5 shadow-inner">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1b2252]">Minh bạch & Tranh chấp</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Mọi thỏa thuận đều được ghi lại. Đội ngũ MentorX hỗ trợ xử lý tranh chấp công bằng 24/7 bảo vệ quyền lợi hai bên.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[12px] font-bold text-slate-400 border-t border-slate-100 pt-4">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Hệ thống xác minh độc lập
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
