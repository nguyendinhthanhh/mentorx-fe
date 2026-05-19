import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { ArrowRight, BookmarkX, Clock3, Heart, MessageCircle, Star, Trash2, Users } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'
import { MentorProfileResponse } from '@/types'

const mentorFallbackImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
]

export default function SavedMentorsPage() {
  const { user } = useAuthStore()

  const {
    data: mentors = [],
    isLoading,
    refetch,
  } = useQuery(
    ['saved-mentors', user?.userId],
    () => mentorApi.getSavedMentors(user!.userId),
    { enabled: !!user?.userId }
  )

  const removeMutation = useMutation(
    (mentorUserId: string) => mentorApi.unsaveMentor(user!.userId, mentorUserId),
    { onSuccess: () => refetch() }
  )

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              <Heart className="h-3.5 w-3.5 fill-current" />
              Saved mentors
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-950 dark:text-white">Mentor đã lưu</h1>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Xem lại các mentor bạn quan tâm và tiếp tục đặt lịch hoặc nhắn tin khi cần.
            </p>
          </div>
          <Link
            to="/mentors"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
          >
            Tìm thêm mentor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <SavedMentorSkeleton />
      ) : mentors.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {mentors.map((mentor, index) => (
            <SavedMentorCard
              key={mentor.userId}
              mentor={mentor}
              index={index}
              removing={removeMutation.isLoading && removeMutation.variables === mentor.userId}
              onRemove={() => removeMutation.mutate(mentor.userId)}
            />
          ))}
        </div>
      ) : (
        <EmptySavedMentors />
      )}
    </section>
  )
}

function SavedMentorCard({
  mentor,
  index,
  removing,
  onRemove,
}: {
  mentor: MentorProfileResponse
  index: number
  removing: boolean
  onRemove: () => void
}) {
  const name = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
  const headline = mentor.headline || 'Expert mentor'
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'N/A'
  const responseTime = mentor.responseTimeHours ? `Trong ${mentor.responseTimeHours} giờ` : 'Phản hồi nhanh'
  const rate = mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Linh hoạt'

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-gray-800 dark:bg-slate-950">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
          <img src={image} alt={name} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-gray-950 dark:text-white">{name}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600 dark:text-gray-400">{headline}</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={removing}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/30"
              aria-label={`Bỏ lưu ${name}`}
              title="Bỏ lưu mentor"
            >
              {removing ? <BookmarkX className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniBadge icon={Star} label={`${rating} (${mentor.totalReviews || 0})`} />
            <MiniBadge icon={Clock3} label={responseTime} />
            <MiniBadge icon={Users} label={`${mentor.yearsOfExperience || 0}+ năm`} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-slate-900">
        <MiniStat label="Rate" value={rate} />
        <MiniStat label="Success" value={mentor.successRate ? `${Math.round(mentor.successRate)}%` : '98%'} />
        <MiniStat label="Done" value={(mentor.totalJobsDone || 0).toString()} />
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          to={`/mentors/${mentor.userId}`}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          Xem hồ sơ
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/chat"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-800 dark:bg-slate-950 dark:text-gray-400"
          aria-label={`Nhắn tin ${name}`}
          title="Tin nhắn"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function MiniBadge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600 dark:border-gray-800 dark:bg-slate-900 dark:text-gray-300">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  )
}

function SavedMentorSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950">
          <div className="flex gap-4">
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900" />
          <div className="mt-4 h-11 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  )
}

function EmptySavedMentors() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-slate-950">
      <Heart className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-700" />
      <h2 className="mt-4 text-xl font-black text-gray-950 dark:text-white">Bạn chưa lưu mentor nào</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        Khi thấy mentor phù hợp, bấm Lưu mentor ở trang hồ sơ để xem lại tại đây.
      </p>
      <Link
        to="/mentors"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
      >
        Khám phá mentor
      </Link>
    </div>
  )
}
