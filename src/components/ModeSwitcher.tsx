import { useState } from 'react'
import { ChevronDown, GraduationCap, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n/I18nProvider'
import { canSwitchToMentorMode } from '@/utils/roleRedirect'
import { UserMode } from '@/types'

export default function ModeSwitcher({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setCurrentMode } = useAuthStore()
  const [open, setOpen] = useState(false)

  if (!canSwitchToMentorMode(user)) return null

  const isMentorMode = location.pathname.startsWith('/mentor')
  const CurrentIcon = isMentorMode ? GraduationCap : User
  const currentLabel = isMentorMode ? t('nav.modeSwitchMentor') : t('nav.modeSwitchUser')

  const goToMode = (mode: UserMode) => {
    setOpen(false)
    if ((mode === UserMode.MENTOR) === isMentorMode) return
    setCurrentMode(mode)
    navigate(mode === UserMode.MENTOR ? '/mentor/dashboard' : '/')
  }

  const options = [
    { mode: UserMode.USER, icon: User, label: t('nav.modeSwitchUser') },
    { mode: UserMode.MENTOR, icon: GraduationCap, label: t('nav.modeSwitchMentor') },
  ]

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('nav.modeSwitchLabel')}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        <CurrentIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label={t('nav.modeSwitchLabel')}
            className="absolute right-0 top-full z-20 mt-2 w-full min-w-[12rem] origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
          >
            {options.map(({ mode, icon: Icon, label }) => {
              const active = (mode === UserMode.MENTOR) === isMentorMode
              return (
                <button
                  key={mode}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => goToMode(mode)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
