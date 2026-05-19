import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { useMemo, useState } from 'react'
import {
  Award,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Heart,
  Mail,
  MessageSquare,
  Play,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import ReviewList from '@/components/review/ReviewList'
import ReviewForm from '@/components/review/ReviewForm'
import MentorProfileEditor from './MentorProfileSetupPage'
import { MentorProfileAssetResponse, MentorProfileAssetType, MentorProfileResponse, MessageType, ReviewTargetType } from '@/types'

const courseImages = [
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=80',
]

const profileFallbacks = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
]

const introImage = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80'

type ProfileTab = 'overview' | 'mentoring' | 'courses' | 'resources' | 'reviews'
type ScheduleDay = { day: string; date: string; slots: string[]; today?: boolean; off?: boolean }

export default function MentorPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: mentor, isLoading } = useQuery(
    ['mentor', userId],
    () => mentorApi.getMentorProfile(userId!),
    { enabled: !!userId }
  )

  const { data: packages = [], isLoading: packagesLoading } = useQuery(
    ['mentor-packages', userId],
    () => mentorApi.getActiveMentorPackages(userId!),
    { enabled: !!userId }
  )

  const { data: courses = [], isLoading: coursesLoading } = useQuery(
    ['mentor-courses', userId],
    () => mentorApi.getPublishedMentorCourses(userId!),
    { enabled: !!userId }
  )

  const { data: weeklyAvailability, isLoading: availabilityLoading } = useQuery(
    ['mentor-availability', userId],
    () => mentorApi.getWeeklyAvailability(userId!),
    { enabled: !!userId }
  )

  const { data: assets = [], isLoading: assetsLoading } = useQuery(
    ['mentor-profile-assets', userId],
    () => mentorApi.getProfileAssets(userId!),
    { enabled: !!userId }
  )

  const { data: isSaved = false, isLoading: savedLoading, refetch: refetchSavedStatus } = useQuery(
    ['mentor-saved-status', user?.userId, userId],
    () => mentorApi.isMentorSaved(user!.userId, userId!),
    { enabled: !!user?.userId && !!userId }
  )

  const saveMentorMutation = useMutation(
    (nextSaved: boolean) => {
      if (!user?.userId || !userId) {
        throw new Error('Missing user or mentor id')
      }

      return nextSaved
        ? mentorApi.saveMentor(user.userId, userId)
        : mentorApi.unsaveMentor(user.userId, userId)
    },
    {
      onSuccess: () => {
        refetchSavedStatus()
      },
      onError: (error) => {
        console.error('Failed to update saved mentor status', error)
        setActionError('Không thể cập nhật trạng thái lưu mentor lúc này. Vui lòng thử lại.')
      },
    }
  )

  const profileImage = useMemo(() => {
    if (mentor?.user?.avatarUrl) return mentor.user.avatarUrl
    const index = userId ? userId.charCodeAt(0) % profileFallbacks.length : 0
    return profileFallbacks[index]
  }, [mentor?.user?.avatarUrl, userId])

  if (isLoading || packagesLoading || coursesLoading || availabilityLoading || assetsLoading) {
    return <ProfileSkeleton />
  }

  const isOwnProfile = user?.userId === mentor?.userId

  if (isEditing && isOwnProfile) {
    return <MentorProfileEditor onCancelEdit={() => setIsEditing(false)} />
  }

  if (!mentor) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-300 dark:bg-gray-900">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-950 dark:text-white">Mentor not found</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">This profile may have been removed or is not public.</p>
        <Link to="/mentors" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
          Browse mentors
        </Link>
      </div>
    )
  }

  const name = mentor.user?.fullName || mentor.user?.displayName || 'Mentor'
  const title = mentor.headline || 'Senior Product Designer'
  
  const mentoringPackages = packages
  const mentorCourses = courses
  const schedule = weeklyAvailability ? buildScheduleFromAPI(weeklyAvailability) : []

  const openMentorChat = async (initialMessage?: string, actionKey = 'message') => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnProfile) {
      navigate('/profile')
      return
    }

    setActionError(null)
    setPendingAction(actionKey)

    try {
      const roomPage = await chatApi.getUserRooms(user.userId, { size: 100 })
      const existingRoom = roomPage.content.find(
        (room) =>
          room.roomType === 'DIRECT_MESSAGE' &&
          room.members.some((member) => member.userId === mentor.userId)
      )

      const room =
        existingRoom ||
        (await chatApi.createRoom({
          roomType: 'DIRECT_MESSAGE',
          roomName: name,
          description: `Mentoring conversation with ${name}`,
          createdByUserId: user.userId,
          isPrivate: true,
          maxMembers: 2,
          referenceId: mentor.userId,
          referenceType: 'MENTOR_PROFILE',
          memberIds: [user.userId, mentor.userId],
        }))

      if (initialMessage) {
        await chatApi.sendMessage({
          chatRoomId: room.id,
          senderId: user.userId,
          content: initialMessage,
          messageType: MessageType.TEXT,
          metadata: {
            source: 'mentor_profile',
            mentorUserId: mentor.userId,
            action: actionKey,
          },
        })
      }

      navigate('/chat')
    } catch (error) {
      console.error('Failed to open mentor chat', error)
      setActionError('Không thể mở cuộc trò chuyện với mentor lúc này. Vui lòng thử lại.')
    } finally {
      setPendingAction(null)
    }
  }

  const requestBooking = () =>
    openMentorChat(
      `Chào ${name}, mình muốn đặt lịch mentoring 1-1 với bạn. Bạn có thể tư vấn giúp mình khung giờ phù hợp không?`,
      'book-profile'
    )

  const toggleSavedMentor = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnProfile) return

    setActionError(null)
    saveMentorMutation.mutate(!isSaved)
  }

  const tabs: Array<{ key: ProfileTab; label: string }> = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'mentoring', label: 'Mentoring 1-1' },
    { key: 'courses', label: 'Khóa học' },
    { key: 'resources', label: 'Tài liệu' },
    { key: 'reviews', label: 'Đánh giá' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        to="/mentors"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách mentor
      </Link>

      <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <MentorIdentityCard
          mentor={mentor}
          name={name}
          title={title}
          image={profileImage}
          saved={isSaved}
          onToggleSaved={toggleSavedMentor}
          savingMentor={savedLoading || saveMentorMutation.isLoading}
          onMessage={() => openMentorChat(undefined, 'message')}
          onBook={requestBooking}
          onEdit={() => setIsEditing(true)}
          pendingAction={pendingAction}
          isOwnProfile={isOwnProfile}
        />

        <IntroPanel mentor={mentor} name={name} assets={assets} />
      </section>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {actionError}
        </div>
      )}

      <nav className="flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap border-b-2 px-0.5 pb-4 text-sm font-black transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {(activeTab === 'overview' || activeTab === 'mentoring') && (
        <>
          <SectionHeader title="Gói Mentoring 1-1 phổ biến" />
          {mentoringPackages.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {mentoringPackages.map((item, index) => (
                <MentoringPackageCard
                  key={item.id || index}
                  item={item}
                  pending={pendingAction === `package-${item.id || index}`}
                  onBook={() =>
                    openMentorChat(
                      `Chào ${name}, mình muốn đặt gói "${item.title}" (${formatPackagePrice(item)}). Bạn hỗ trợ mình bước tiếp theo nhé.`,
                      `package-${item.id || index}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-500">Mentor chưa tạo gói mentoring nào.</p>
            </div>
          )}

          <SchedulePanel
            schedule={schedule}
            pendingAction={pendingAction}
            onBookSlot={(slotLabel) =>
              openMentorChat(
                `Chào ${name}, mình muốn đặt lịch mentoring vào ${slotLabel}. Khung giờ này còn phù hợp không?`,
                `slot-${slotLabel}`
              )
            }
          />
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'courses') && (
        <>
          <SectionHeader title="Khóa học nổi bật" />
          {mentorCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {mentorCourses.map((course, index) => (
                <CourseCard
                  key={course.id || index}
                  course={course}
                  pending={pendingAction === `course-${course.id || index}`}
                  onAsk={() =>
                    openMentorChat(
                      `Chào ${name}, mình muốn tìm hiểu thêm về khóa học "${course.title}". Bạn tư vấn giúp mình nhé.`,
                      `course-${course.id || index}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-500">Mentor chưa xuất bản khóa học nào.</p>
            </div>
          )}
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'resources') && (
        <>
          <SectionHeader title="Tài liệu hữu ích" />
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500">Mentor chưa có tài liệu công khai từ API.</p>
          </div>
        </>
      )}

      {activeTab === 'reviews' && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-950 dark:text-white">Đánh giá từ học viên</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {mentor.totalReviews} đánh giá, điểm trung bình {mentor.averageRating?.toFixed(1) || 'N/A'}.
              </p>
            </div>
            {user && !isOwnProfile && !showReviewForm && (
              <button
                type="button"
                onClick={() => setShowReviewForm(true)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition-colors hover:bg-blue-700"
              >
                Viết đánh giá
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-6">
              <ReviewForm
                targetType={ReviewTargetType.MENTOR}
                targetId={mentor.userId}
                onClose={() => setShowReviewForm(false)}
                onSuccess={() => setShowReviewForm(false)}
              />
            </div>
          )}

          <ReviewList targetType={ReviewTargetType.MENTOR} targetId={mentor.userId} />
        </section>
      )}
    </div>
  )
}

function MentorIdentityCard({
  mentor,
  name,
  title,
  image,
  saved,
  onToggleSaved,
  savingMentor,
  onMessage,
  onBook,
  onEdit,
  pendingAction,
  isOwnProfile,
}: {
  mentor: MentorProfileResponse
  name: string
  title: string
  image: string
  saved: boolean
  onToggleSaved: () => void
  savingMentor: boolean
  onMessage: () => void
  onBook: () => void
  onEdit: () => void
  pendingAction: string | null
  isOwnProfile: boolean
}) {
  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-24 lg:self-start">
      <div className="relative mx-auto h-32 w-32">
        <img src={image} alt={name} className="h-32 w-32 rounded-full object-cover ring-8 ring-blue-50 dark:ring-blue-950/30" />
        <div className="absolute -right-1 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="mb-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          Đã xác minh
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">{name}</h1>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {mentor.averageRating?.toFixed(1) || 'N/A'}
          <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-500">{mentor.totalReviews} đánh giá</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isOwnProfile ? (
          <button
            type="button"
            onClick={onEdit}
            className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            Chỉnh sửa hồ sơ
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBook}
              disabled={!!pendingAction}
              className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none dark:disabled:bg-gray-800"
            >
              {pendingAction === 'book-profile' ? 'Đang mở chat...' : 'Đặt lịch 1-1'}
            </button>
            <button
              type="button"
              onClick={onMessage}
              disabled={!!pendingAction}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30 dark:disabled:border-gray-800"
            >
              <MessageSquare className="h-4 w-4" />
              {pendingAction === 'message' ? 'Đang mở...' : 'Nhắn tin'}
            </button>
          </>
        )}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <ProfileMiniStat label="Tỷ lệ phản hồi" value={`${mentor.successRate || 98}%`} />
        <ProfileMiniStat label="Thời gian trả lời" value={mentor.responseTimeHours ? `Trong ${mentor.responseTimeHours} giờ` : 'Trong 2 giờ'} />
      </div>

      <button
        type="button"
        onClick={onToggleSaved}
        disabled={savingMentor || isOwnProfile}
        title={saved ? 'Bỏ lưu mentor' : 'Lưu mentor'}
        className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
          saved
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
            : 'bg-gray-50 text-gray-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:bg-gray-900 dark:text-gray-400'
        }`}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        {savingMentor ? 'Đang cập nhật...' : saved ? 'Đã lưu mentor' : 'Lưu mentor'}
      </button>
    </aside>
  )
}

function IntroPanel({ mentor, name, assets }: { mentor: MentorProfileResponse; name: string; assets: MentorProfileAssetResponse[] }) {
  const experiences = assets.filter(a => a.type === MentorProfileAssetType.EXPERIENCE)
  const achievements = assets.filter(a => a.type === MentorProfileAssetType.ACHIEVEMENT)

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-gray-950 dark:text-white">
            <Users className="h-5 w-5 text-blue-600" />
            Giới thiệu bản thân
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-400">
            {mentor.user?.bio ||
              `Xin chào, mình là ${name}. Mình có ${mentor.yearsOfExperience || 8} năm kinh nghiệm trong lĩnh vực mentoring và sản phẩm số. Mình hỗ trợ học viên định hướng kỹ năng, review công việc thực tế và xây dựng lộ trình phát triển rõ ràng.`}
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl bg-gray-950">
            <div className="relative aspect-video">
              <img src={introImage} alt="Mentor intro video" className="h-full w-full object-cover opacity-75" />
              <button className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-xl transition-transform hover:scale-105">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-gray-950 dark:text-white">Đã từng làm việc tại:</p>
            <div className="flex flex-wrap items-center gap-5 text-xl font-black text-gray-900 dark:text-gray-100">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <span key={exp.id} className="text-blue-700">{exp.title}</span>
                ))
              ) : (
                <>
                  <span className="text-blue-700">TechCorp</span>
                  <span className="text-amber-600">InnovateHub</span>
                  <span className="tracking-tight text-gray-500">Google</span>
                  <span className="text-sm font-bold text-gray-500">UX Certificate</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-950 dark:text-white">
            <Trophy className="h-4 w-4 text-blue-600" />
            Thành tựu nổi bật
          </h3>
          <div className="space-y-3">
            {achievements.length > 0 ? (
              achievements.map((ach) => (
                <div key={ach.id} className="flex gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  <span>{ach.title}</span>
                </div>
              ))
            ) : (
              [
                'Vietnam Design Award 2024 - Best UX App',
                'Top Mentor của năm 2023',
                'Google UX Certificate Professional',
                `${mentor.totalReviews} đánh giá từ học viên`,
              ].map((item) => (
                <div key={item} className="flex gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  <span>{item}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function MentoringPackageCard({ item, onBook, pending }: { item: any; onBook: () => void; pending: boolean }) {
  // Handle both API response and mock data structure
  const duration = item.durationHours ? `${item.durationHours * 60} phút` : item.duration || '60 phút'
  const title = item.title
  const description = item.description
  const price = formatPackagePrice(item)
  const features = item.features || []

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
      <span className="inline-flex rounded-full bg-gray-50 px-3 py-1 text-xs font-black text-gray-700 dark:bg-gray-900 dark:text-gray-300">
        {duration}
      </span>
      <h3 className="mt-4 text-lg font-black text-gray-950 dark:text-white">{title}</h3>
      <p className="mt-2 min-h-[44px] text-sm leading-6 text-gray-500">{description}</p>
      <div className="mt-4">
        <p className="text-3xl font-black text-blue-600">{price}</p>
        {item.subPrice && <p className="mt-1 text-xs font-medium text-gray-400">{item.subPrice}</p>}
      </div>
      {features.length > 0 && (
        <ul className="mt-5 space-y-2">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Check className="h-4 w-4 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onBook}
        disabled={pending}
        className="mt-6 h-11 w-full rounded-2xl bg-blue-600 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-800"
      >
        {pending ? 'Đang mở chat...' : 'Đặt lịch'}
      </button>
    </article>
  )
}

function formatPackagePrice(item: any) {
  if (item.priceMxc !== undefined && item.priceMxc !== null) {
    return `${Math.round(Number(item.priceMxc))} MXC`
  }

  return item.price || 'Liên hệ'
}

function SchedulePanel({
  schedule,
  pendingAction,
  onBookSlot,
}: {
  schedule: ScheduleDay[]
  pendingAction: string | null
  onBookSlot: (slotLabel: string) => void
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-gray-950 dark:text-white">
            <Calendar className="h-5 w-5 text-blue-600" />
            Lịch trống tuần này
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Chọn khung giờ phù hợp để đặt lịch ngay.</p>
        </div>
      </div>
      {schedule.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
        {schedule.map((day) => (
          <div
            key={day.day}
            className={`rounded-2xl border p-3 text-center ${
              day.today
                ? 'border-blue-200 bg-blue-50 shadow-md shadow-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:shadow-none'
                : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <p className="text-xs font-bold text-gray-500">{day.day}</p>
            <p className="mt-1 text-base font-black text-gray-950 dark:text-white">{day.date}</p>
            <div className="mt-3 space-y-2">
              {day.slots.length ? (
                day.slots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => onBookSlot(`${day.day} ${day.date} ${slot}`)}
                    disabled={pendingAction === `slot-${day.day} ${day.date} ${slot}`}
                    className={`h-7 w-full rounded-full text-xs font-black ${
                      day.today
                        ? 'bg-blue-600 text-white'
                        : 'border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-gray-950 dark:text-blue-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))
              ) : (
                <span className="inline-flex h-7 w-full items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400 dark:bg-gray-800">
                  {day.off ? 'Nghỉ' : 'Đã kín'}
                </span>
              )}
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Mentor chưa cấu hình lịch trống công khai.
        </div>
      )}
    </section>
  )
}

function CourseCard({ course, onAsk, pending }: { course: any; onAsk: () => void; pending: boolean }) {
  // Handle both API response and mock data structure
  const title = course.title
  const lessonsCount = course.lessonsCount || course.lessons || 0
  const image = course.thumbnailUrl || course.image || courseImages[0]
  const level = course.level || 'BEGINNER'
  const levelText = level === 'BEGINNER' ? 'Cơ bản' : level === 'INTERMEDIATE' ? 'Trung cấp' : 'Nâng cao'

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
      <img src={image} alt={title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
      <h3 className="mt-4 text-lg font-black text-gray-950 dark:text-white">{title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" />
        {lessonsCount} bài học · {levelText}
      </p>
      <button
        type="button"
        onClick={onAsk}
        disabled={pending}
        className="mt-4 h-10 w-full rounded-2xl border border-blue-300 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30 dark:disabled:border-gray-800"
      >
        {pending ? 'Đang mở chat...' : 'Hỏi về khóa học'}
      </button>
    </article>
  )
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">{title}</h2>
      {action && <button className="text-sm font-black text-blue-700 hover:text-blue-800 dark:text-blue-300">{action}</button>}
    </div>
  )
}

function ProfileMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-black text-gray-950 dark:text-white">{value}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" />
        ))}
      </div>
    </div>
  )
}

function buildScheduleFromAPI(weeklyAvailability: any): ScheduleDay[] {
  const today = new Date()
  const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const schedule = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert Sunday from 0 to 7
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
    const dayName = i === 0 ? 'Hôm nay' : dayNames[date.getDay()]

    const timeSlots = weeklyAvailability?.weeklySchedule?.[dayOfWeek] || []
    const slots = timeSlots.map((slot: any) => slot.startTime.substring(0, 5)) // Extract HH:mm

    // Check if date is blocked
    const isBlocked = weeklyAvailability?.blockedDates?.some((blockedDate: string) => {
      const blocked = new Date(blockedDate)
      return blocked.toDateString() === date.toDateString()
    })

    schedule.push({
      day: dayName,
      date: dateStr,
      slots: isBlocked ? [] : slots,
      today: i === 0,
      off: timeSlots.length === 0 && !isBlocked,
    })
  }

  return schedule
}
