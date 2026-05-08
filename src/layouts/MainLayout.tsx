import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Menu, X, LogOut, Bell, MessageSquare } from 'lucide-react'

const navLinks = [
  { to: '/jobs', label: 'Việc làm' },
  { to: '/mentors', label: 'Mentor' },
  { to: '/companies', label: 'Công ty' },
  { to: '/blog', label: 'Cẩm nang' },
  { to: '/about', label: 'Giới thiệu' },
]

function SiteFooter() {
  return (
    <footer className="border-t border-[#e2e6f5] bg-[#101a4a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/15" />
              <span className="text-xl font-bold">Mentor X</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-blue-100">
              Nền tảng kết nối việc làm và mentor chất lượng cao, đồng hành cùng bạn trên hành trình phát triển sự nghiệp.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Khám phá</p>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <Link to="/jobs">Việc làm</Link>
              <Link to="/mentors">Mentor</Link>
              <Link to="/companies">Công ty</Link>
              <Link to="/blog">Cẩm nang</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Dành cho ứng viên</p>
            <div className="mt-3 grid gap-2 text-sm text-blue-100">
              <Link to="/register">Tạo hồ sơ</Link>
              <Link to="/jobs">Tìm việc</Link>
              <Link to="/profile">Kỹ năng</Link>
              <Link to="/help">Hỏi đáp</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Nhận tin mới nhất</p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200 outline-none"
              />
              <button type="button" className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/15 pt-4 text-xs text-blue-100">© 2026 Mentor X. Tất cả quyền được bảo lưu.</div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <header className="sticky top-0 z-50 border-b border-[#e2e6f5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#2d6cdf]" />
            <span className="text-xl font-bold text-[#16204b]">Mentor X</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm font-medium text-slate-600 hover:text-[#4f46e5]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link to="/chat" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <Link to="/profile/notifications" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <Bell className="h-4 w-4" />
                </Link>
                <Link to="/profile" className="text-sm font-semibold text-slate-700">
                  {user.displayName || user.fullName || 'Tài khoản'}
                </Link>
                <button onClick={handleLogout} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-[#4f46e5]">
                  Đăng nhập
                </Link>
                <Link to="/register" className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca]">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen((prev) => !prev)} className="rounded-lg p-2 text-slate-600 md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#e2e6f5] bg-white px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-[#e2e6f5] pt-3">
              {user ? (
                <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  Đăng xuất
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="flex-1 rounded-lg bg-[#4f46e5] px-3 py-2 text-center text-sm font-semibold text-white">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
