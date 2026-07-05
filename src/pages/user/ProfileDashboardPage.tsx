import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from 'react-query'
import { walletApi } from '@/api/walletApi'
import { formatMxc } from '@/utils/formatters'
import { useI18n } from '@/i18n/I18nProvider'
import {
  Wallet,
  Briefcase,
  ShoppingBag,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { canSwitchToMentorMode } from '@/utils/roleRedirect'

export default function ProfileDashboardPage() {
  const { language } = useI18n()
  const { user } = useAuthStore()

  const { data: balance, isLoading: isBalanceLoading } = useQuery(
    ['userBalance', user?.userId],
    () => walletApi.getUserBalance(user!.userId),
    { enabled: !!user?.userId, staleTime: 5 * 60 * 1000 }
  )

  if (!user) return null

  const displayName = user.displayName || user.fullName
  const mentorApproved = canSwitchToMentorMode(user)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {'Ch\u00e0o m\u1eebng tr\u1edf l\u1ea1i, '}{displayName}! {'\uD83D\uDC4B'}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {'\u0110\u00e2y l\u00e0 kh\u00f4ng gian qu\u1ea3n l\u00fd c\u00e1 nh\u00e2n c\u1ee7a b\u1ea1n. Theo d\u00f5i ti\u1ebfn \u0111\u1ed9 v\u00e0 b\u1eaft \u0111\u1ea7u d\u1ef1 \u00e1n m\u1edbi.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-50 transition-transform group-hover:scale-150 dark:bg-indigo-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Wallet className="h-6 w-6" />
            </div>
            <Link to="/wallet" className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700">
              {'Xem v\u00ed'} <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{'S\u1ed1 d\u01b0 kh\u1ea3 d\u1ee5ng'}</p>
            <div className="mt-1 flex h-8 items-center">
              {isBalanceLoading ? (
                <div className="h-6 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
              ) : (
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatMxc(balance?.available || 0, language)}
                </h3>
              )}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-150 dark:bg-emerald-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <Link to="/users/requests" className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700">
              {'Qu\u1ea3n l\u00fd'} <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{'Y\u00eau c\u1ea7u c\u00f4ng vi\u1ec7c'}</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{'Truy c\u1eadp'}</h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-fuchsia-50 transition-transform group-hover:scale-150 dark:bg-fuchsia-900/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <Link to="/profile/courses" className="flex items-center text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700">
              {'V\u00e0o h\u1ecdc'} <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          <div className="relative mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{'Kho\u00e1 h\u1ecdc c\u1ee7a t\u00f4i'}</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{'Truy c\u1eadp'}</h3>
          </div>
        </div>
      </div>

      {!mentorApproved && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6C4DFF] to-[#8C6DFD] p-8 text-white shadow-xl shadow-indigo-500/20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-2 text-indigo-100">
                <Award className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">{'C\u01a1 h\u1ed9i m\u1edbi'}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                {'Tr\u1edf th\u00e0nh Mentor ngay h\u00f4m nay'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-indigo-100">
                {'Chia s\u1ebb ki\u1ebfn th\u1ee9c c\u1ee7a b\u1ea1n, nh\u1eadn y\u00eau c\u1ea7u t\u01b0 v\u1ea5n 1:1, m\u1edf kh\u00f3a h\u1ecdc ri\u00eang v\u00e0 gia t\u0103ng thu nh\u1eadp v\u1edbi Token MXC.'}
              </p>
            </div>
            <Link
              to="/become-a-mentor"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-8 text-sm font-bold text-indigo-600 transition-all hover:scale-105 hover:bg-slate-50 hover:shadow-lg"
            >
              {'\u0110\u0103ng k\u00fd ngay'}
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-black text-slate-900 dark:text-white">{'Ho\u1ea1t \u0111\u1ed9ng g\u1ea7n \u0111\u00e2y'}</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
            <Clock className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">{'Ch\u01b0a c\u00f3 ho\u1ea1t \u0111\u1ed9ng n\u00e0o'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {'C\u00e1c ho\u1ea1t \u0111\u1ed9ng thanh to\u00e1n, \u0111\u1eb7t l\u1ecbch s\u1ebd hi\u1ec3n th\u1ecb t\u1ea1i \u0111\u00e2y.'}
          </p>
        </div>
      </div>
    </div>
  )
}
