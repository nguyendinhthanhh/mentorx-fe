import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lightbulb,
  Scale
} from 'lucide-react'
import JobCreateForm from '@/components/job/JobCreateForm'
import { useAuthStore } from '@/store/authStore'

export default function JobCreatePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950 pb-20">
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quay lại danh sách công việc
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Đăng yêu cầu hỗ trợ
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Mô tả vấn đề của bạn và nhận đề xuất từ mentor phù hợp.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0">
            <JobCreateForm clientId={user.userId} />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500 mb-4">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Viết yêu cầu hiệu quả</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600 list-disc pl-4 marker:text-slate-300">
                <li>Mô tả rõ ràng vấn đề bạn đang gặp phải.</li>
                <li>Nêu rõ kết quả mong muốn (Output).</li>
                <li>Đính kèm tài liệu liên quan để Mentor dễ hình dung.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Thanh toán an toàn</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hệ thống ký quỹ (Escrow) của Mentor X đảm bảo MX Coin của bạn chỉ được chuyển đi khi bạn xác nhận hoàn thành.
              </p>
              <a href="#" className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                Tìm hiểu thêm về Escrow
              </a>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-4">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Minh bạch & Tranh chấp</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mọi thỏa thuận đều được ghi lại. Mentor X hỗ trợ xử lý tranh chấp công bằng 24/7.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Đã xác minh
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

