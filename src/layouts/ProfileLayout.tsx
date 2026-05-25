import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Award,
  Bell,
  Heart,
  Settings,
  ShoppingBag,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { canSwitchToMentorMode } from '@/utils/roleRedirect'
import AppHeader from '@/components/AppHeader'

const baseTabs = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/profile/saved', label: 'Saved mentors', icon: Heart },
  { to: '/profile/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile/courses', label: 'Courses', icon: ShoppingBag },
  { to: '/profile/settings', label: 'Settings', icon: Settings },
]

export default function ProfileLayout() {
  const location = useLocation()
  const { user } = useAuthStore()

  if (!user) return null

  const isFullWidthPage = location.pathname === '/become-a-mentor'
  const displayName = user.displayName || user.fullName || 'User'
  const initials = displayName.charAt(0).toUpperCase()
  const mentorApproved = canSwitchToMentorMode(user)

  const tabs = [
    ...baseTabs,
    ...(mentorApproved ? [] : [{ to: '/become-a-mentor', label: 'Become a mentor', icon: Award }]),
  ]

  const isActive = (path: string) => {
    if (path === '/profile') return location.pathname === '/profile'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {!isFullWidthPage && (
            <aside className="w-full flex-none space-y-6 lg:w-72">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 dark:shadow-none">
                <div className="mb-6 flex items-center gap-4 px-2 py-3">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-white">{initials}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white">
                      {displayName}
                    </h1>
                    <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {user.email.split('@')[0]}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Menu
                  </div>
                  {tabs.map((item) => {
                    const active = isActive(item.to)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800/50'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {active && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800/50 dark:bg-slate-800/30">
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Mentor X v1.0
                  </p>
                </div>
              </div>
            </aside>
          )}

          <div className={`min-w-0 flex-1 ${isFullWidthPage ? 'mx-auto max-w-7xl' : ''}`}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
