import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import {
  Award,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  ExternalLink,
  Globe,
  Heart,
  MessageSquare,
  Play,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from 'lucide-react'

import { chatApi } from '@/api/chatApi'
import { mentorApi } from '@/api/mentorApi'
import { reviewApi } from '@/api/reviewApi'
import { useI18n } from '@/i18n/I18nProvider'
import ReviewForm from '@/components/review/ReviewForm'
import ReviewList from '@/components/review/ReviewList'
import { useAuthStore } from '@/store/authStore'
import {
  MentorProfileAssetResponse,
  MentorProfileAssetType,
  MentorProfileResponse,
  MessageType,
  ReviewTargetType,
} from '@/types'
import { formatMxc } from '@/utils/formatters'
import { getMentorProofLinks } from '@/utils/proofLinks'

import MentorProfileEditor from './MentorProfileSetupPage'

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
  const { t, language } = useI18n()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: mentor, isLoading } = useQuery(['mentor', userId], () => mentorApi.getMentorProfile(userId!), {
    enabled: !!userId,
  })

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
  const { data: canReviewMentor = false } = useQuery(
    ['mentor-review-eligibility', user?.userId, userId],
    () => reviewApi.canReviewMentor(userId!),
    { enabled: !!user?.userId && !!userId }
  )

  const saveMentorMutation = useMutation(
    (nextSaved: boolean) => {
      if (!user?.userId || !userId) {
        throw new Error('Missing user or mentor id')
      }

      return nextSaved ? mentorApi.saveMentor(user.userId, userId) : mentorApi.unsaveMentor(user.userId, userId)
    },
    {
      onSuccess: () => {
        refetchSavedStatus()
      },
      onError: (error) => {
        console.error('Failed to update saved mentor status', error)
        setActionError(t('mentor.public.error.saved'))
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
        <h2 className="mt-5 text-2xl font-black text-gray-950 dark:text-white">{t('mentor.public.notFoundTitle')}</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">{t('mentor.public.notFoundBody')}</p>
        <Link to="/mentors" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
          {t('mentor.public.browseMentors')}
        </Link>
      </div>
    )
  }

  const name = mentor.user?.fullName || mentor.user?.displayName || 'Mentor'
  const title = mentor.headline || mentor.currentTitle || mentor.primaryDomain || 'Mentor'
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
        (room) => room.roomType === 'DIRECT_MESSAGE' && room.members.some((member) => member.userId === mentor.userId)
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
      setActionError(t('mentor.public.error.chat'))
    } finally {
      setPendingAction(null)
    }
  }

  const requestBooking = () =>
    openMentorChat(
      language === 'vi'
        ? `Chào ${name}, tôi muốn đặt một buổi mentoring 1:1 với bạn. Bạn có thể giúp tôi tìm khung giờ phù hợp không?`
        : `Hi ${name}, I'd like to book a 1:1 mentoring session with you. Can you help me find a suitable time?`,
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
    { key: 'overview', label: t('mentor.public.tabs.overview') },
    { key: 'mentoring', label: t('mentor.public.tabs.mentoring') },
    { key: 'courses', label: t('mentor.public.tabs.courses') },
    { key: 'resources', label: t('mentor.public.tabs.resources') },
    { key: 'reviews', label: t('mentor.public.tabs.reviews') },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        to="/mentors"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('mentor.public.backToMentors')}
      </Link>

      <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        {t('mentor.profile.publicProfile')}
      </div>

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
          <SectionHeader title={t('mentor.public.featuredPackages')} />
        
          {mentoringPackages.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {mentoringPackages.map((item, index) => (
                <MentoringPackageCard
                  key={item.id || index}
                  item={item}
                  language={language}
                  pending={pendingAction === `package-${item.id || index}`}
                  onBook={() =>
                    openMentorChat(
                      language === 'vi'
                        ? `Chào ${name}, tôi muốn đặt gói "${item.title}" (${formatPackagePrice(item, language)}). Bạn có thể hướng dẫn bước tiếp theo không?`
                        : `Hi ${name}, I'd like to book the "${item.title}" package (${formatPackagePrice(item, language)}). Can you help me with the next step?`,
                      `package-${item.id || index}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-500">{t('mentor.public.noPackages')}</p>
            </div>
          )}

          <SchedulePanel
            schedule={schedule}
            pendingAction={pendingAction}
            onBookSlot={(slotLabel) =>
              openMentorChat(
                language === 'vi'
                  ? `Chào ${name}, tôi muốn đặt một buổi mentoring vào ${slotLabel}. Khung giờ này còn trống không?`
                  : `Hi ${name}, I'd like to book a mentoring session at ${slotLabel}. Is this time still available?`,
                `slot-${slotLabel}`
              )
            }
          />
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'courses') && (
        <>
          <SectionHeader title={t('mentor.public.featuredCourses')} />
          {mentorCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {mentorCourses.map((course, index) => (
                <CourseCard
                  key={course.id || index}
                  course={course}
                  language={language}
                  pending={pendingAction === `course-${course.id || index}`}
                  onAsk={() =>
                    openMentorChat(
                      language === 'vi'
                        ? `Chào ${name}, tôi muốn tìm hiểu thêm về khóa học "${course.title}". Bạn có thể tư vấn giúp tôi không?`
                        : `Hi ${name}, I'd like to learn more about the course "${course.title}". Can you advise me?`,
                      `course-${course.id || index}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-500">{t('mentor.public.noCourses')}</p>
            </div>
          )}
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'resources') && (
        <>
          <SectionHeader title={t('mentor.public.publicResources')} />
          <ResourcesPanel mentor={mentor} assets={assets} />
        </>
      )}

      {activeTab === 'reviews' && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-950 dark:text-white">{t('mentor.public.learnerReviews')}</h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {t('mentor.public.reviewSummary', {
                  count: mentor.totalReviews,
                  rating: mentor.averageRating?.toFixed(1) || 'N/A',
                })}
              </p>
            </div>
            {user && !isOwnProfile && canReviewMentor && !showReviewForm && (
              <button
                type="button"
                onClick={() => setShowReviewForm(true)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition-colors hover:bg-blue-700"
              >
                {t('mentor.public.writeReview')}
              </button>
            )}
          </div>

          {user && !isOwnProfile && !canReviewMentor && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              {t('mentor.public.reviewLocked')}
            </div>
          )}

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
  const { t } = useI18n()
  const proofLinks = getMentorProofLinks(mentor)

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-24 lg:self-start">
      <div className="relative mx-auto h-32 w-32">
        <img src={image} alt={name} className="h-32 w-32 rounded-full object-cover ring-8 ring-blue-50 dark:ring-blue-950/30" />
        <div className="absolute -right-1 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {t('mentor.profile.publicProfile')}
        </div>
        <div className="mb-3 ml-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          {t('mentor.public.verified')}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">{name}</h1>
        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {mentor.averageRating?.toFixed(1) || 'N/A'}
          <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-500">{t('mentor.public.ratingReviews', { count: mentor.totalReviews })}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isOwnProfile ? (
          <button
            type="button"
            onClick={onEdit}
            className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            {t('mentor.public.editProfile')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBook}
              disabled={!!pendingAction}
              className="h-12 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none dark:disabled:bg-gray-800"
            >
              {pendingAction === 'book-profile' ? t('mentor.public.openingChat') : t('mentor.public.bookSession')}
            </button>
            <button
              type="button"
              onClick={onMessage}
              disabled={!!pendingAction}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30 dark:disabled:border-gray-800"
            >
              <MessageSquare className="h-4 w-4" />
              {pendingAction === 'message' ? t('mentor.public.opening') : t('mentor.public.messageMentor')}
            </button>
          </>
        )}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <ProfileMiniStat label={t('mentor.public.responseRate')} value={`${mentor.successRate || 98}%`} />
        <ProfileMiniStat
          label={t('mentor.public.responseTime')}
          value={
            mentor.responseTimeHours
              ? t('mentor.public.responseWithinHours', { hours: mentor.responseTimeHours })
              : t('mentor.public.responseCalculated')
          }
        />
      </div>

      {proofLinks.length > 0 && (
        <div className="mt-7 space-y-2 border-t border-gray-100 pt-5 dark:border-gray-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('mentor.public.proofLinks')}</p>
          <div className="flex flex-wrap gap-2">
            {proofLinks.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleSaved}
        disabled={savingMentor || isOwnProfile}
        title={saved ? t('mentor.public.removeSaved') : t('mentor.public.saveMentor')}
        className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
          saved
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
            : 'bg-gray-50 text-gray-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:bg-gray-900 dark:text-gray-400'
        }`}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        {savingMentor ? t('mentor.public.updating') : saved ? t('mentor.public.savedMentor') : t('mentor.public.saveMentor')}
      </button>
    </aside>
  )
}

function IntroPanel({ mentor, name, assets }: { mentor: MentorProfileResponse; name: string; assets: MentorProfileAssetResponse[] }) {
  const { t, language } = useI18n()
  const experiences = assets.filter((asset) => asset.type === MentorProfileAssetType.EXPERIENCE)
  const achievements = assets.filter((asset) => asset.type === MentorProfileAssetType.ACHIEVEMENT)
  const proofLinks = getMentorProofLinks(mentor)
  const professionalSummary =
    mentor.professionalBio ||
    mentor.helpDescription ||
    t('mentor.public.fallbackBio', { name })

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-gray-950 dark:text-white">
            <Users className="h-5 w-5 text-blue-600" />
            {t('mentor.public.professionalOverview')}
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-400">{professionalSummary}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <ProfileDetailCard
              icon={<Globe className="h-4 w-4 text-blue-600" />}
              label={t('mentor.public.primaryDomain')}
              value={mentor.primaryDomain || t('common.notSpecifiedYet')}
            />
            <ProfileDetailCard
              icon={<Clock className="h-4 w-4 text-blue-600" />}
              label={t('mentor.public.typicalRate')}
              value={
                mentor.hourlyRateMxc
                  ? t('mentor.public.ratePerHour', { amount: formatMxc(mentor.hourlyRateMxc, language) })
                  : t('common.contact')
              }
            />
            <ProfileDetailCard
              icon={<Calendar className="h-4 w-4 text-blue-600" />}
              label={t('mentor.public.experience')}
              value={mentor.yearsOfExperience ? t('mentor.public.yearsCount', { count: mentor.yearsOfExperience }) : t('common.notSpecifiedYet')}
            />
            <ProfileDetailCard
              icon={<ExternalLink className="h-4 w-4 text-blue-600" />}
              label={t('mentor.public.portfolio')}
              value={mentor.portfolioUrl ? t('mentor.public.openPortfolio') : t('mentor.public.noPublicPortfolioYet')}
              href={mentor.portfolioUrl}
            />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-gray-950 dark:text-white">{t('mentor.public.skills')}</p>
            <div className="flex flex-wrap gap-2">
              {(mentor.skills || []).length > 0 ? (
                mentor.skills!.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm font-medium text-gray-500">{t('mentor.public.noSkillsListedYet')}</span>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-gray-950">
            <div className="relative aspect-video">
              <img src={introImage} alt={t('mentor.public.videoAlt')} className="h-full w-full object-cover opacity-75" />
              {mentor.videoIntroUrl ? (
                <a
                  href={mentor.videoIntroUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-xl transition-transform hover:scale-105"
                >
                  <Play className="ml-1 h-7 w-7 fill-current" />
                </a>
              ) : (
                <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-xl">
                  <Play className="ml-1 h-7 w-7 fill-current" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-gray-950 dark:text-white">{t('mentor.public.experienceHighlights')}</p>
            <div className="flex flex-wrap items-center gap-5 text-xl font-black text-gray-900 dark:text-gray-100">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <span key={exp.id} className="text-blue-700">
                    {exp.title}
                  </span>
                ))
              ) : (
                <span className="text-sm font-medium text-gray-500">{t('mentor.public.noPublicExperienceYet')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-950 dark:text-white">
            <Trophy className="h-4 w-4 text-blue-600" />
            {t('mentor.public.publicProofAchievements')}
          </h3>
          <div className="space-y-3">
            {proofLinks.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300"
              >
                <ExternalLink className="h-4 w-4 flex-none" />
                <span>{link.label}</span>
              </a>
            ))}
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <div key={achievement.id} className="flex gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  <span>{achievement.title}</span>
                </div>
              ))
            ) : (
              <div className="flex gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                <span>{t('mentor.public.noPublicAchievementsYet')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ResourcesPanel({ mentor, assets }: { mentor: MentorProfileResponse; assets: MentorProfileAssetResponse[] }) {
  const { t } = useI18n()
  const documents = assets.filter((asset) => asset.type === MentorProfileAssetType.DOCUMENT)
  const proofLinks = getMentorProofLinks(mentor)

  if (documents.length === 0 && proofLinks.length === 0 && !mentor.portfolioUrl && !mentor.cvUrl && !mentor.certificateUrl) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-500">{t('mentor.public.noResources')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {mentor.portfolioUrl && (
        <ResourceCard title={t('mentor.public.resource.portfolio')} description={t('mentor.public.resource.portfolioDescription')} href={mentor.portfolioUrl} />
      )}
      {mentor.cvUrl && <ResourceCard title={t('mentor.public.resource.resume')} description={t('mentor.public.resource.resumeDescription')} href={mentor.cvUrl} />}
      {mentor.certificateUrl && (
        <ResourceCard title={t('mentor.public.resource.certificate')} description={t('mentor.public.resource.certificateDescription')} href={mentor.certificateUrl} />
      )}
      {proofLinks.map((link) => (
        <ResourceCard key={`${link.label}-${link.url}`} title={link.label} description={t('mentor.public.resource.proofDescription')} href={link.url} />
      ))}
      {documents.map((document) => (
        <ResourceCard
          key={document.id}
          title={document.title}
          description={document.description || document.issuer || t('mentor.public.resource.documentDescription')}
          href={document.fileUrl}
        />
      ))}
    </div>
  )
}

function ResourceCard({ title, description, href }: { title: string; description: string; href?: string }) {
  const { t } = useI18n()
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        <ExternalLink className="h-4 w-4 text-blue-600" />
        {t('mentor.public.resource.label')}
      </div>
      <h3 className="mt-3 text-lg font-black text-gray-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </a>
  )
}

function ProfileDetailCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        {icon}
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-black text-blue-700 hover:text-blue-800 dark:text-blue-300">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm font-black text-gray-950 dark:text-white">{value}</p>
      )}
    </div>
  )
}

function MentoringPackageCard({ item, onBook, pending, language }: { item: any; onBook: () => void; pending: boolean; language: 'en' | 'vi' }) {
  const { t } = useI18n()
  const duration = item.durationHours ? `${item.durationHours * 60} min` : item.duration || '60 min'
  const title = item.title
  const description = item.description
  const price = formatPackagePrice(item, language)
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
        {pending ? t('mentor.public.openingChat') : t('mentor.public.package.book')}
      </button>
    </article>
  )
}

function formatPackagePrice(item: any, language: 'en' | 'vi') {
  if (item.priceMxc !== undefined && item.priceMxc !== null) {
    return formatMxc(item.priceMxc, language)
  }

  return item.price || (language === 'vi' ? 'Liên hệ' : 'Contact')
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
  const { t } = useI18n()
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-gray-950 dark:text-white">
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('mentor.public.schedule.title')}
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">{t('mentor.public.schedule.subtitle')}</p>
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
                    {day.off ? t('mentor.public.schedule.off') : t('mentor.public.schedule.full')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          {t('mentor.public.schedule.noAvailability')}
        </div>
      )}
    </section>
  )
}

function CourseCard({ course, onAsk, pending, language: _language }: { course: any; onAsk: () => void; pending: boolean; language?: 'en' | 'vi' }) {
  const { t } = useI18n()
  const title = course.title
  const lessonsCount = course.lessonsCount || course.lessons || 0
  const image = course.thumbnailUrl || course.image || courseImages[0]
  const level = course.level || 'BEGINNER'
  const levelText =
    level === 'BEGINNER'
      ? t('mentor.public.course.beginner')
      : level === 'INTERMEDIATE'
        ? t('mentor.public.course.intermediate')
        : t('mentor.public.course.advanced')

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
      <img src={image} alt={title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
      <h3 className="mt-4 text-lg font-black text-gray-950 dark:text-white">{title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" />
        {t('mentor.public.course.lessons', { count: lessonsCount })} · {levelText}
      </p>
      <button
        type="button"
        onClick={onAsk}
        disabled={pending}
        className="mt-4 h-10 w-full rounded-2xl border border-blue-300 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30 dark:disabled:border-gray-800"
      >
        {pending ? t('mentor.public.openingChat') : t('mentor.public.course.ask')}
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
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const schedule: ScheduleDay[] = []

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
    const dayName = i === 0 ? 'Today' : dayNames[date.getDay()]

    const timeSlots = weeklyAvailability?.weeklySchedule?.[dayOfWeek] || []
    const slots = timeSlots.map((slot: any) => slot.startTime.substring(0, 5))

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
