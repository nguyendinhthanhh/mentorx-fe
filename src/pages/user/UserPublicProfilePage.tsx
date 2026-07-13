import { type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { BadgeCheck, CalendarDays, Clock3, ShieldCheck, User } from 'lucide-react'

import { userApi } from '@/api/userApi'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useI18n } from '@/i18n/I18nProvider'
import { MentorStatus } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'

export default function UserPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { t } = useI18n()
  const { data: userProfile, isLoading } = useQuery(['user', userId], () => userApi.getUserById(userId!), {
    enabled: Boolean(userId),
  })

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!userProfile) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 px-4 py-16 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <User className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-xl font-semibold">{t('user.publicProfile.notFoundTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('user.publicProfile.notFoundDescription')}</p>
        </div>
      </main>
    )
  }

  if (userProfile.mentorStatus === MentorStatus.APPROVED) {
    return <Navigate to={`/mentors/${userProfile.userId}`} replace />
  }

  const name = userProfile.displayName || userProfile.fullName || t('user.publicProfile.member')
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <main className="min-h-[100dvh] bg-slate-50 pb-16 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t('user.publicProfile.home'), to: '/' },
            { label: t('user.publicProfile.users'), to: '#' },
            { label: name },
          ]}
        />
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
          <section className="min-w-0">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:gap-6 dark:border-slate-800">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-2xl font-semibold text-white shadow-sm">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : initials}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
                  {userProfile.emailVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label={t('user.publicProfile.verified')} />}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{t('user.publicProfile.member')}</p>
              </div>
            </div>

            <section className="mt-10 max-w-3xl">
              <h2 className="text-base font-semibold">{t('user.publicProfile.about')}</h2>
              {userProfile.bio ? (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-300">{userProfile.bio}</p>
              ) : (
                <p className="mt-3 text-[15px] leading-7 text-slate-500 dark:text-slate-400">{t('user.publicProfile.aboutEmpty')}</p>
              )}
            </section>
          </section>

          <aside className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-1 dark:border-slate-800">
            <h2 className="text-sm font-semibold">{t('user.publicProfile.accountTitle')}</h2>
            <dl className="mt-5 space-y-5">
              <ProfileFact
                icon={<CalendarDays className="h-4 w-4" />}
                label={t('user.publicProfile.memberSince')}
                value={formatRelativeTime(userProfile.createdAt)}
              />
              <ProfileFact
                icon={<ShieldCheck className="h-4 w-4" />}
                label={t('user.publicProfile.verification')}
                value={userProfile.emailVerified ? t('user.publicProfile.verified') : t('user.publicProfile.notVerified')}
                valueClassName={userProfile.emailVerified ? 'text-emerald-700 dark:text-emerald-400' : undefined}
              />
              <ProfileFact
                icon={<Clock3 className="h-4 w-4" />}
                label={t('user.publicProfile.lastActive')}
                value={userProfile.lastSeenAt ? formatRelativeTime(userProfile.lastSeenAt) : t('user.publicProfile.noActivity')}
              />
            </dl>
          </aside>
        </div>
      </div>
    </main>
  )
}

function ProfileFact({
  icon,
  label,
  value,
  valueClassName = '',
}: {
  icon: ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</span>
      <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className={`mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 ${valueClassName}`}>{value}</dd>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
          <div>
            <div className="flex items-end gap-6 border-b border-slate-200 pb-8 dark:border-slate-800">
              <div className="h-24 w-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3"><div className="h-9 w-56 rounded bg-slate-200 dark:bg-slate-800" /><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" /></div>
            </div>
            <div className="mt-10 space-y-3"><div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" /><div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" /><div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" /></div>
          </div>
          <div className="space-y-5 border-t border-slate-200 pt-6 dark:border-slate-800 lg:border-l lg:pl-8 lg:pt-1"><div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />{[0, 1, 2].map((item) => <div key={item} className="h-10 rounded bg-slate-200 dark:bg-slate-800" />)}</div>
        </div>
      </div>
    </main>
  )
}
