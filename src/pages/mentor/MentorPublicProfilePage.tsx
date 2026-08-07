import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  MapPin,
  MessageCircle,
  PlayCircle,
  Star,
  UsersRound,
} from 'lucide-react'

import { chatApi } from '@/api/chatApi'
import { courseApi } from '@/api/courseApi'
import { mentorApi } from '@/api/mentorApi'
import blogApi, { type BlogPost } from '@/api/blogApi'
import { platformSettingApi } from '@/api/platformSettingApi'
import { reviewApi } from '@/api/reviewApi'
import ViewTimelineChart from '@/components/analytics/ViewTimelineChart'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import {
  buildMentorBadges,
  DEFAULT_MENTOR_BADGE_SETTINGS,
  MentorBadge,
  MentorBadgePills,
} from '@/components/mentor/MentorBadgePills'
import SingleSessionBookingModal from '@/components/mentor/SingleSessionBookingModal'
import ReviewForm from '@/components/review/ReviewForm'
import ReviewList from '@/components/review/ReviewList'
import { useRecordView } from '@/hooks/useAnalytics'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import {
  CourseProductType,
  CourseResponse,
  MentorAvailabilityResponse,
  MentorPackageResponse,
  MentorProfileAssetResponse,
  MentorProfileAssetType,
  MentorProfileResponse,
  MentorWeeklyAvailabilityResponse,
  MessageType,
  PackageType,
  ReviewSummaryResponse,
  ReviewTargetType,
} from '@/types'
import { formatMxc } from '@/utils/formatters'
import { getMentorProofLinks } from '@/utils/proofLinks'

import MentorProfileEditor from './MentorProfileSetupPage'

type ScheduleDay = {
  key: string
  dayLabel: string
  dateLabel: string
  slots: MentorAvailabilityResponse[]
}

type ResourceItem = {
  id: string
  title: string
  description: string
  url: string
}

type CourseOriginState = {
  fromMentorProfile: {
    mentorUserId: string
    mentorName: string
  }
}

type Translate = ReturnType<typeof useI18n>['t']

export default function MentorPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedBookingPackage, setSelectedBookingPackage] = useState<MentorPackageResponse | null>(null)

  useRecordView('user', userId)

  const mentorQuery = useQuery(
    ['mentor', userId],
    () => mentorApi.getMentorProfile(userId!),
    { enabled: Boolean(userId), retry: false }
  )
  const packagesQuery = useQuery(
    ['mentor-packages', userId],
    () => mentorApi.getActiveMentorPackages(userId!),
    { enabled: Boolean(userId), retry: false }
  )
  const coursesQuery = useQuery(
    ['published-courses-by-instructor', userId],
    () => courseApi.getPublished({ instructorId: userId!, page: 0, size: 6 }),
    { enabled: Boolean(userId), retry: false }
  )
  const blogQuery = useQuery(
    ['mentor-blogs', userId, mentorQuery.data?.user?.fullName],
    () => blogApi.getPosts({ query: mentorQuery.data?.user?.fullName || '', size: 3 }),
    { enabled: Boolean(mentorQuery.data?.user?.fullName), retry: false }
  )
  const availabilityQuery = useQuery(
    ['mentor-availability', userId],
    () => mentorApi.getWeeklyAvailability(userId!),
    { enabled: Boolean(userId), retry: false }
  )
  const assetsQuery = useQuery(
    ['mentor-assets', userId],
    () => mentorApi.getProfileAssets(userId!),
    { enabled: Boolean(userId), retry: false }
  )
  const savedQuery = useQuery(
    ['mentor-saved-status', user?.userId, userId],
    () => mentorApi.isMentorSaved(user!.userId, userId!),
    { enabled: Boolean(user?.userId && userId), retry: false }
  )
  const reviewEligibilityQuery = useQuery(
    ['mentor-review-eligibility', user?.userId, userId],
    () => reviewApi.canReviewMentor(userId!),
    { enabled: Boolean(user?.userId && userId), retry: false }
  )
  const reviewSummaryQuery = useQuery(
    ['review-summary', ReviewTargetType.MENTOR, userId],
    () => reviewApi.getSummaryByTarget(ReviewTargetType.MENTOR, userId!),
    { enabled: Boolean(userId), retry: false }
  )
  const mentorBadgeSettingsQuery = useQuery(
    ['mentor-badge-settings'],
    platformSettingApi.getPublicMentorBadgeSettings,
    {
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  )

  const saveMentorMutation = useMutation(
    (nextSaved: boolean) => {
      if (!user?.userId || !userId) throw new Error('Missing user or mentor id')
      return nextSaved
        ? mentorApi.saveMentor(user.userId, userId)
        : mentorApi.unsaveMentor(user.userId, userId)
    },
    {
      onSuccess: () => savedQuery.refetch(),
      onError: () => setActionError(t('mentor.public.error.saved')),
    }
  )

  const mentor = mentorQuery.data
  const isOwnProfile = user?.userId === mentor?.userId

  if (mentorQuery.isLoading) return <ProfileSkeleton />

  if (mentorQuery.isError || !mentor) {
    return <ProfileError onRetry={() => mentorQuery.refetch()} />
  }

  if (isEditing && isOwnProfile) {
    return <MentorProfileEditor onCancelEdit={() => setIsEditing(false)} />
  }

  const name = mentor.user?.displayName || mentor.user?.fullName || t('common.mentor')
  const title = mentor.headline || mentor.primaryDomain || mentor.currentTitle || t('common.mentor')
  const packages = sortPackages(packagesQuery.data || [])
  const courses = sortLearningProducts(coursesQuery.data?.content || [])
  const assets = assetsQuery.data || []
  const directBookingPackage = packages.find((item) => item.packageType === PackageType.SINGLE_SESSION)
  const schedule = buildAvailableSchedule(availabilityQuery.data, language)
  const resources = buildResources(mentor, assets, language)
  const badgeSettings = mentorBadgeSettingsQuery.data || DEFAULT_MENTOR_BADGE_SETTINGS
  const heroBadges = buildMentorBadges({
    mentor,
    t,
    reviewSummary: reviewSummaryQuery.data,
    resourceCount: resources.length,
    hasDirectBooking: Boolean(directBookingPackage),
    settings: badgeSettings,
    limit: badgeSettings.profileMaxBadges,
  })

  const openMentorChat = async (initialMessage?: string, actionKey = 'message') => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnProfile) {
      navigate('/mentor/profile')
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
      setActionError(t('mentor.public.error.chat'))
    } finally {
      setPendingAction(null)
    }
  }

  const openBookingFlow = (packageItem?: MentorPackageResponse) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnProfile) {
      navigate('/mentor/profile')
      return
    }

    const targetPackage = packageItem || directBookingPackage
    if (!targetPackage) {
      setActionError(t('mentorProfile.directBookingUnavailable'))
      return
    }

    setActionError(null)
    setSelectedBookingPackage(targetPackage)
  }

  const contactAboutPackage = (item: MentorPackageResponse) => {
    const message =
      language === 'vi'
        ? `Chào ${name}, tôi muốn tìm hiểu thêm về gói "${item.title}" (${formatMxc(item.priceMxc, language)}).`
        : `Hi ${name}, I'd like to learn more about "${item.title}" (${formatMxc(item.priceMxc, language)}).`
    void openMentorChat(message, `package-${item.id}`)
  }

  const toggleSavedMentor = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isOwnProfile) return
    setActionError(null)
    saveMentorMutation.mutate(!savedQuery.data)
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] pb-20 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Breadcrumbs
          items={[
            { label: t('user.publicProfile.home'), to: '/' },
            { label: t('nav.mentors'), to: '/mentors' },
            { label: name },
          ]}
          className="text-slate-600 dark:text-slate-300"
        />

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <ProfileHero
            mentor={mentor}
            name={name}
            title={title}
            reviewSummary={reviewSummaryQuery.data}
            badges={heroBadges}
          />

          <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <ActionCard
                mentor={mentor}
                mentorName={name}
                directPackage={directBookingPackage}
                isOwnProfile={isOwnProfile}
                isSaved={Boolean(savedQuery.data)}
                isSaving={savedQuery.isLoading || saveMentorMutation.isLoading}
                pendingAction={pendingAction}
                actionError={actionError}
                onBook={() => openBookingFlow()}
                onMessage={() => void openMentorChat(undefined, 'message')}
                onToggleSaved={toggleSavedMentor}
                onEdit={() => setIsEditing(true)}
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-10 lg:col-start-1">
            <OfferingsSection
              packages={packages}
              isLoading={packagesQuery.isLoading}
              pendingAction={pendingAction}
              onBook={openBookingFlow}
              onContact={contactAboutPackage}
            />

            {(coursesQuery.isLoading || coursesQuery.isError || courses.length > 0) && (
              <LearningProductsSection
                courses={courses}
                isLoading={coursesQuery.isLoading}
                isError={coursesQuery.isError}
                onRetry={() => coursesQuery.refetch()}
                mentorUserId={mentor.userId}
                mentorName={name}
              />
            )}

            {blogQuery.data?.content && blogQuery.data.content.length > 0 && (
              <BlogPostsSection
                posts={blogQuery.data.content}
                mentorName={name}
              />
            )}

            <AvailabilitySection
              schedule={schedule}
              isLoading={availabilityQuery.isLoading}
              canBook={Boolean(directBookingPackage)}
              onBook={() => openBookingFlow()}
              onMessage={() => void openMentorChat(undefined, 'message')}
            />

            <AboutSection
              mentor={mentor}
              mentorName={name}
              assets={assets}
              resources={resources}
              isLoading={assetsQuery.isLoading}
            />

            <ReviewsSection
              mentor={mentor}
              reviewSummary={reviewSummaryQuery.data}
              canReview={Boolean(reviewEligibilityQuery.data)}
              isOwnProfile={isOwnProfile}
              isAuthenticated={Boolean(user)}
              showReviewForm={showReviewForm}
              onShowReviewForm={() => setShowReviewForm(true)}
              onCloseReviewForm={() => setShowReviewForm(false)}
            />

            {isOwnProfile && userId ? (
              <ViewTimelineChart targetType="user" targetId={userId} />
            ) : null}
          </div>
        </div>
      </div>

      <SingleSessionBookingModal
        open={Boolean(selectedBookingPackage)}
        mentorName={name}
        mentorUserId={userId || mentor.userId}
        packageItem={selectedBookingPackage}
        userId={user?.userId}
        onClose={() => setSelectedBookingPackage(null)}
        onBooked={() => {
          setSelectedBookingPackage(null)
          navigate('/profile/appointments')
        }}
      />
    </div>
  )
}

function ProfileHero({
  mentor,
  name,
  title,
  reviewSummary,
  badges,
}: {
  mentor: MentorProfileResponse
  name: string
  title: string
  reviewSummary?: ReviewSummaryResponse
  badges: MentorBadge[]
}) {
  const { t, language } = useI18n()
  const avatarUrl = getSafePublicUrl(mentor.user?.avatarUrl)
  const coverUrl = getSafePublicUrl(mentor.coverUrl)
  const repeatedIdentityLabels = new Set(
    [title, mentor.headline, mentor.primaryDomain]
      .filter(Boolean)
      .map(value => value!.trim().toLowerCase())
  )
  const skills = (mentor.skills || [])
    .filter(skill => skill && !repeatedIdentityLabels.has(skill.trim().toLowerCase()))
    .slice(0, 6)
  const helpText =
    getMeaningfulProfileText(mentor.helpDescription) ||
    getMeaningfulProfileText(mentor.professionalBio)
  const reviewCount = reviewSummary?.totalReviews ?? mentor.totalReviews
  const averageRating = reviewSummary?.averageRating ?? mentor.averageRating
  const hasReviews = Boolean(averageRating && reviewCount > 0)
  const distinctDomain = mentor.primaryDomain?.trim().toLowerCase() !== title.trim().toLowerCase()
    ? mentor.primaryDomain
    : undefined

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_50px_rgba(15,23,42,0.045)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      {coverUrl ? (
        <div className="h-24 overflow-hidden bg-emerald-50 sm:h-32 dark:bg-emerald-500/10">
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        </div>
      ) : (
        <div className="h-2 bg-emerald-500" aria-hidden="true" />
      )}

      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative w-28 shrink-0 self-start sm:w-32">
            <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[24px] bg-emerald-100 text-3xl font-bold text-emerald-900 ring-1 ring-inset ring-emerald-200 sm:h-32 sm:w-32 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25">
              <span aria-hidden="true">{getInitials(name)}</span>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : null}
            </div>
            <span
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-white shadow-[0_6px_18px_rgba(5,150,105,0.28)] dark:ring-slate-900"
              title={t('mentorProfile.approved')}
            >
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{t('mentorProfile.approved')}</span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {distinctDomain ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
                {distinctDomain}
              </p>
            ) : null}
            <h1 className={`${distinctDomain ? 'mt-2' : ''} text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl sm:leading-tight dark:text-slate-50`}>
              {name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[17px] font-normal leading-7 text-slate-600 dark:text-slate-300">
              {title}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Star
                  className={`h-4 w-4 ${hasReviews ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                {hasReviews
                  ? t('mentorProfile.ratingReviews', {
                      rating: formatRating(averageRating, language),
                      count: reviewCount,
                    })
                  : t('mentorProfile.noReviews')}
              </span>
              {mentor.totalJobsDone != null && mentor.totalJobsDone > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <UsersRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {t('mentorProfile.completedJobs', { count: mentor.totalJobsDone })}
                </span>
              ) : null}
              {mentor.responseTimeHours != null ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {t('mentorProfile.respondsWithin', { hours: mentor.responseTimeHours })}
                </span>
              ) : null}
            </div>

            <MentorBadgePills badges={badges} className="mt-4" />
          </div>
        </div>

        {skills.length > 0 ? (
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="rounded-[18px] bg-slate-50/80 p-4 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/55 dark:ring-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {t('mentorProfile.focusLabel')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-inset ring-slate-200/70 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="rounded-[20px] bg-slate-50/80 p-5 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/55 dark:ring-slate-700">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
              {t('mentorProfile.helpTitle')}
            </h2>
            <p className="mt-2 max-w-[70ch] whitespace-pre-line text-base leading-7 text-slate-600 dark:text-slate-300">
              {helpText || t('mentorProfile.helpFallback')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ActionCard({
  mentor,
  mentorName,
  directPackage,
  isOwnProfile,
  isSaved,
  isSaving,
  pendingAction,
  actionError,
  onBook,
  onMessage,
  onToggleSaved,
  onEdit,
}: {
  mentor: MentorProfileResponse
  mentorName: string
  directPackage?: MentorPackageResponse
  isOwnProfile: boolean
  isSaved: boolean
  isSaving: boolean
  pendingAction: string | null
  actionError: string | null
  onBook: () => void
  onMessage: () => void
  onToggleSaved: () => void
  onEdit: () => void
}) {
  const { t, language } = useI18n()

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_50px_rgba(5,150,105,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="border-b border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
              {isOwnProfile ? t('mentorProfile.ownerActionLabel') : t('mentorProfile.actionLabel')}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold leading-7 text-slate-950 dark:text-slate-100">
              {isOwnProfile
                ? t('mentorProfile.ownerActionTitle')
                : t('mentorProfile.actionTitle', { name: mentorName })}
            </h2>
          </div>
        </div>
        <p className="mt-4 text-sm font-normal leading-6 text-slate-600 dark:text-slate-300">
          {isOwnProfile
            ? t('mentorProfile.ownerActionDescription')
            : directPackage
              ? t('mentorProfile.actionDescriptionStart')
              : t('mentorProfile.actionDescriptionChat')}
        </p>
      </div>

      <div className="p-6">
        {directPackage && !isOwnProfile ? (
          <div className="mb-5 rounded-[18px] bg-slate-50/80 p-4 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/55 dark:ring-slate-700">
            <p className="text-base font-semibold leading-6 text-slate-950 dark:text-slate-100">
              {directPackage.title}
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium leading-5 text-slate-500 dark:text-slate-400">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {formatDuration(directPackage.durationHours, language, t)}
              </span>
              <span className="shrink-0 text-lg font-medium leading-6 text-slate-950 dark:text-slate-100">
                {formatMxc(directPackage.priceMxc, language)}
              </span>
            </div>
          </div>
        ) : null}

        {isOwnProfile ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-[15px] font-semibold leading-none text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-900"
          >
            {t('mentor.public.editProfile')}
          </button>
        ) : (
          <div className="grid gap-3">
            {directPackage ? (
              <button
                type="button"
                onClick={onBook}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-[15px] font-semibold leading-none text-white shadow-[0_8px_20px_rgba(5,150,105,0.18)] transition-[background-color,box-shadow,transform] hover:bg-emerald-700 hover:shadow-[0_10px_24px_rgba(5,150,105,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-900"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {t('mentorProfile.bookSession')}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onMessage}
              disabled={Boolean(pendingAction)}
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                directPackage
                  ? 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300'
              }`}
            >
              {pendingAction === 'message' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {pendingAction === 'message'
                ? t('mentor.public.openingChat')
                : t('mentorProfile.messageMentor')}
            </button>

            <button
              type="button"
              onClick={onToggleSaved}
              disabled={isSaving}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-semibold leading-none text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Heart
                className={`h-4 w-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`}
                aria-hidden="true"
              />
              {isSaving
                ? t('mentor.public.updating')
                : isSaved
                  ? t('mentor.public.savedMentor')
                  : t('mentor.public.saveMentor')}
            </button>
          </div>
        )}

        {actionError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {actionError}
          </p>
        ) : null}

        <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200 text-[13px] leading-5 dark:divide-slate-800 dark:border-slate-800">
          {mentor.responseTimeHours != null ? (
            <ActionFact
              icon={<Clock3 className="h-4 w-4" />}
              label={t('mentorProfile.responseTime')}
              value={t('mentorProfile.respondsWithinShort', { hours: mentor.responseTimeHours })}
            />
          ) : null}
          {mentor.languages?.length ? (
            <ActionFact
              icon={<Languages className="h-4 w-4" />}
              label={t('mentorProfile.languageLabel')}
              value={mentor.languages.join(', ')}
            />
          ) : null}
          {mentor.location ? (
            <ActionFact
              icon={<MapPin className="h-4 w-4" />}
              label={t('mentorProfile.locationLabel')}
              value={mentor.location}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ActionFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <span className="shrink-0 text-right text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

function OfferingsSection({
  packages,
  isLoading,
  pendingAction,
  onBook,
  onContact,
}: {
  packages: MentorPackageResponse[]
  isLoading: boolean
  pendingAction: string | null
  onBook: (item: MentorPackageResponse) => void
  onContact: (item: MentorPackageResponse) => void
}) {
  const { t } = useI18n()

  return (
    <section aria-labelledby="mentor-offerings-title">
      <SectionHeading
        icon={<GraduationCap className="h-5 w-5" />}
        title={t('mentorProfile.offersTitle')}
        description={t('mentorProfile.offersDescription')}
        id="mentor-offerings-title"
      />

      {isLoading ? (
        <OfferingSkeleton />
      ) : packages.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((item) => (
            <PackageCard
              key={item.id}
              item={item}
              pending={pendingAction === `package-${item.id}`}
              onAction={() =>
                item.packageType === PackageType.SINGLE_SESSION
                  ? onBook(item)
                  : onContact(item)
              }
            />
          ))}
        </div>
      ) : (
        <InlineEmpty
          icon={<MessageCircle className="h-5 w-5" />}
          title={t('mentorProfile.noOffersTitle')}
          description={t('mentorProfile.noOffersDescription')}
        />
      )}
    </section>
  )
}

function PackageCard({
  item,
  pending,
  onAction,
}: {
  item: MentorPackageResponse
  pending: boolean
  onAction: () => void
}) {
  const { t, language } = useI18n()
  const directBooking = item.packageType === PackageType.SINGLE_SESSION
  const features = (item.features || []).filter(Boolean).slice(0, 4)

  return (
    <article className="flex min-w-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_30px_rgba(5,150,105,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 dark:hover:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
          {getPackageTypeLabel(item.packageType, t)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDuration(item.durationHours, language, t)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-6 text-slate-950 dark:text-slate-100">
        {item.title}
      </h3>
      <p className="mt-2 text-[15px] leading-6 text-slate-600 dark:text-slate-300">
        {item.description}
      </p>

      {features.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('mentorProfile.packagePrice')}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
            {formatMxc(item.priceMxc, language)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-900"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : directBooking ? (
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {directBooking
            ? t('mentorProfile.bookSessionShort')
            : t('mentorProfile.contactAboutPackage')}
        </button>
      </div>
    </article>
  )
}

function AvailabilitySection({
  schedule,
  isLoading,
  canBook,
  onBook,
  onMessage,
}: {
  schedule: ScheduleDay[]
  isLoading: boolean
  canBook: boolean
  onBook: () => void
  onMessage: () => void
}) {
  const { t } = useI18n()

  return (
    <section className="border-t border-slate-200 pt-9 dark:border-slate-800" aria-labelledby="mentor-schedule-title">
      <SectionHeading
        icon={<CalendarDays className="h-5 w-5" />}
        title={t('mentorProfile.scheduleTitle')}
        description={t('mentorProfile.scheduleDescription')}
        id="mentor-schedule-title"
      />

      {isLoading ? (
        <div className="mt-5 h-28 animate-pulse rounded-[18px] bg-slate-200/70 dark:bg-slate-800" />
      ) : schedule.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {schedule.map((day) => (
              <div
                key={day.key}
                className="rounded-[16px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold text-slate-950 dark:text-slate-100">{day.dayLabel}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.dateLabel}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.slots.slice(0, 4).map((slot) => (
                    <span
                      key={`${day.key}-${slot.id}-${slot.startTime}`}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={canBook ? onBook : onMessage}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-offset-slate-950"
          >
            {canBook ? <CalendarDays className="h-4 w-4" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
            {canBook ? t('mentorProfile.viewBookableSlots') : t('mentorProfile.askAboutSchedule')}
          </button>
        </>
      ) : (
        <InlineEmpty
          icon={<Clock3 className="h-5 w-5" />}
          title={t('mentorProfile.scheduleEmptyTitle')}
          description={t('mentorProfile.scheduleEmptyDescription')}
          action={
            <button
              type="button"
              onClick={onMessage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/25 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('mentorProfile.askAboutSchedule')}
            </button>
          }
        />
      )}
    </section>
  )
}

function AboutSection({
  mentor,
  mentorName,
  assets,
  resources,
  isLoading,
}: {
  mentor: MentorProfileResponse
  mentorName: string
  assets: MentorProfileAssetResponse[]
  resources: ResourceItem[]
  isLoading: boolean
}) {
  const { t, language } = useI18n()
  const bio =
    getMeaningfulProfileText(mentor.professionalBio) ||
    getMeaningfulProfileText(mentor.user?.bio) ||
    getMeaningfulProfileText(mentor.helpDescription)
  const publicEvidence = sortFeatured(
    assets.filter(
      (asset) =>
        asset.type === MentorProfileAssetType.EXPERIENCE ||
        asset.type === MentorProfileAssetType.ACHIEVEMENT ||
        asset.type === MentorProfileAssetType.CERTIFICATE
    )
  ).slice(0, 5)
  const videoUrl = getSafeExternalUrl(mentor.videoIntroUrl)
  const quickFacts = [
    mentor.yearsOfExperience != null
      ? {
          icon: <Briefcase className="h-4 w-4" />,
          label: t('mentorProfile.experienceLabel'),
          value: t('mentorProfile.yearsExperience', { count: mentor.yearsOfExperience }),
        }
      : undefined,
    mentor.languages?.length
      ? {
          icon: <Languages className="h-4 w-4" />,
          label: t('mentorProfile.languageLabel'),
          value: formatLanguages(mentor.languages, language),
        }
      : undefined,
    mentor.location
      ? {
          icon: <MapPin className="h-4 w-4" />,
          label: t('mentorProfile.locationLabel'),
          value: mentor.location,
        }
      : undefined,
  ].filter(Boolean) as Array<{ icon: ReactNode; label: string; value: string }>
  const summaryStats = [
    quickFacts[0]
      ? {
          label: quickFacts[0].label,
          value: quickFacts[0].value,
        }
      : undefined,
    resources.length > 0
      ? {
          label: t('mentorBadge.publicProof'),
          value: String(resources.length),
        }
      : undefined,
    publicEvidence.length > 0
      ? {
          label: t('mentorProfile.evidenceTitle'),
          value: String(publicEvidence.length),
        }
      : undefined,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section className="border-t border-slate-200 pt-9 dark:border-slate-800" aria-labelledby="mentor-about-title">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
        {t('mentorProfile.aboutEyebrow', { name: mentorName })}
      </p>
      <h2
        id="mentor-about-title"
        className="mt-3 max-w-2xl text-[28px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[30px] dark:text-slate-100"
      >
        {t('mentorProfile.aboutEditorialTitle')}
      </h2>
      <p className="mt-3 max-w-[68ch] text-base leading-7 text-slate-600 dark:text-slate-300">
        {t('mentorProfile.aboutEditorialDescription', { name: mentorName })}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_16px_40px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-6">
            {summaryStats.length > 0 ? (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {summaryStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[16px] bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/70 dark:ring-slate-700"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="max-w-[64ch] whitespace-pre-line text-[17px] leading-8 text-slate-700 dark:text-slate-200">
              {bio || t('mentorProfile.aboutLeadFallback')}
            </p>
          </div>

          {videoUrl || resources.length > 0 ? (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 ring-1 ring-inset ring-slate-200/80 dark:border-slate-800 dark:bg-slate-800/45 dark:ring-slate-700 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  {t('mentorProfile.evidenceTitle')}
                </p>
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/25 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    {t('mentorProfile.videoIntro')}
                  </a>
                ) : null}
              </div>

              {resources.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-[18px] border border-slate-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-600 dark:hover:shadow-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                            {resource.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {resource.description}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300" aria-hidden="true" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {quickFacts.length > 0 ? (
          <dl className="grid gap-4 md:grid-cols-1">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                  {fact.icon}
                  {fact.label}
                </dt>
                <dd className="mt-2 text-[15px] font-medium leading-6 text-slate-900 dark:text-slate-100">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-8 h-20 animate-pulse rounded-[16px] bg-slate-200/70 dark:bg-slate-800" />
      ) : publicEvidence.length > 0 ? (
        <div className="mt-9 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            {t('mentorProfile.evidenceTitle')}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {publicEvidence.map((asset) => (
              <div
                key={asset.id}
                className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">{asset.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {[getEvidenceTypeLabel(asset.type, t), asset.issuer || asset.description]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function LearningProductsSection({
  courses,
  isLoading,
  isError,
  onRetry,
  mentorUserId,
  mentorName,
}: {
  courses: CourseResponse[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  mentorUserId: string
  mentorName: string
}) {
  const { t } = useI18n()
  const featured = courses[0]
  const secondary = courses.slice(1, 3)

  return (
    <section className="border-t border-slate-200 pt-9 dark:border-slate-800" aria-labelledby="mentor-products-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
            {t('mentorProfile.productsEyebrow')}
          </p>
          <h2
            id="mentor-products-title"
            className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[30px] dark:text-slate-100"
          >
            {t('mentorProfile.productsTitle')}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-slate-600 dark:text-slate-300">
            {t('mentorProfile.productsDescription')}
          </p>
        </div>
        {!isLoading && !isError ? (
          <span className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t('mentorProfile.productCount', { count: courses.length })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <LearningProductsSkeleton />
      ) : isError ? (
        <InlineEmpty
          icon={<BookOpen className="h-5 w-5" />}
          title={t('mentorProfile.productsErrorTitle')}
          description={t('mentorProfile.productsErrorDescription')}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/25 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
            >
              {t('mentorProfile.retry')}
            </button>
          }
        />
      ) : featured ? (
        <div className={`mt-6 grid gap-4 ${secondary.length > 0 ? 'md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]' : ''}`}>
          <FeaturedLearningProduct
            course={featured}
            mentorLinkState={{
              fromMentorProfile: {
                mentorUserId,
                mentorName,
              },
            }}
          />
          {secondary.length > 0 ? (
            <div className="grid gap-4">
              {secondary.map((course) => (
                <CompactLearningProduct
                  key={getCourseId(course)}
                  course={course}
                  mentorLinkState={{
                    fromMentorProfile: {
                      mentorUserId,
                      mentorName,
                    },
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function FeaturedLearningProduct({
  course,
  mentorLinkState,
}: {
  course: CourseResponse
  mentorLinkState: CourseOriginState
}) {
  const { t, language } = useI18n()
  const courseId = getCourseId(course)
  const thumbnailUrl = getSafePublicUrl(course.thumbnailUrl)
  const isDocument = course.productType === CourseProductType.DOCUMENT

  return (
    <Link
      to={`/courses/${courseId}`}
      state={mentorLinkState}
      className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
    >
      <div className="relative aspect-[16/8] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-emerald-700 dark:text-emerald-300">
            {isDocument ? <FileText className="h-10 w-10" /> : <BookOpen className="h-10 w-10" />}
          </span>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur dark:bg-slate-950/90 dark:text-slate-100">
          {getProductTypeLabel(course.productType, t)}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
          {course.title}
        </h3>
        {course.description ? (
          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-slate-600 dark:text-slate-300">
            {course.description}
          </p>
        ) : null}
        <ProductMeta course={course} />
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <span className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            {formatMxc(getProductPrice(course), language)}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {isDocument ? t('mentorProfile.viewDocument') : t('mentorProfile.viewCourse')}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function CompactLearningProduct({
  course,
  mentorLinkState,
}: {
  course: CourseResponse
  mentorLinkState: CourseOriginState
}) {
  const { t, language } = useI18n()
  const courseId = getCourseId(course)
  const thumbnailUrl = getSafePublicUrl(course.thumbnailUrl)
  const isDocument = course.productType === CourseProductType.DOCUMENT

  return (
    <Link
      to={`/courses/${courseId}`}
      state={mentorLinkState}
      className="group grid min-h-[190px] grid-cols-[108px_minmax(0,1fr)] overflow-hidden rounded-[20px] border border-slate-200 bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:grid-cols-[150px_minmax(0,1fr)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
    >
      <div className="overflow-hidden bg-slate-100 dark:bg-slate-800">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-emerald-700 dark:text-emerald-300">
            {isDocument ? <FileText className="h-8 w-8" /> : <BookOpen className="h-8 w-8" />}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
          {getProductTypeLabel(course.productType, t)}
        </span>
        <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-6 text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
          {course.title}
        </h3>
        <ProductMeta course={course} compact />
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-semibold text-slate-950 dark:text-slate-100">
            {formatMxc(getProductPrice(course), language)}
          </span>
          <ArrowUpRight className="h-4 w-4 text-emerald-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-emerald-300" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

function ProductMeta({ course, compact = false }: { course: CourseResponse; compact?: boolean }) {
  const { t, language } = useI18n()
  const items = [
    course.totalLessons != null
      ? formatProductUnits(course.totalLessons, course.productType, language, t)
      : undefined,
    course.totalEnrollments > 0
      ? formatProductLearners(course.totalEnrollments, language, t)
      : undefined,
    !compact && course.averageRating
      ? t('mentorProfile.productRating', { rating: formatRating(course.averageRating, language) })
      : undefined,
  ].filter(Boolean) as string[]

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  )
}

function LearningProductsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]" aria-hidden="true">
      <div className="h-[430px] animate-pulse rounded-[20px] bg-slate-200/70 dark:bg-slate-800" />
      <div className="grid gap-4">
        <div className="h-[207px] animate-pulse rounded-[20px] bg-slate-200/70 dark:bg-slate-800" />
        <div className="h-[207px] animate-pulse rounded-[20px] bg-slate-200/70 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function ReviewsSection({
  mentor,
  reviewSummary,
  canReview,
  isOwnProfile,
  isAuthenticated,
  showReviewForm,
  onShowReviewForm,
  onCloseReviewForm,
}: {
  mentor: MentorProfileResponse
  reviewSummary?: ReviewSummaryResponse
  canReview: boolean
  isOwnProfile: boolean
  isAuthenticated: boolean
  showReviewForm: boolean
  onShowReviewForm: () => void
  onCloseReviewForm: () => void
}) {
  const { t, language } = useI18n()
  const displayedRating = reviewSummary?.averageRating ?? mentor.averageRating
  const rating = displayedRating
    ? formatRating(displayedRating, language)
    : t('mentorProfile.notAvailable')
  const reviewCount = reviewSummary?.totalReviews ?? mentor.totalReviews

  return (
    <section className="border-t border-slate-200 pt-9 dark:border-slate-800" aria-labelledby="mentor-reviews-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          icon={<Star className="h-5 w-5" />}
          title={t('mentorProfile.reviewsTitle')}
          description={t('mentorProfile.reviewsSummary', {
            rating,
            count: reviewCount,
          })}
          id="mentor-reviews-title"
        />
        {isAuthenticated && !isOwnProfile && canReview && !showReviewForm ? (
          <button
            type="button"
            onClick={onShowReviewForm}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/25 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
          >
            {t('mentor.public.writeReview')}
          </button>
        ) : null}
      </div>

      {isAuthenticated && !isOwnProfile && !canReview ? (
        <p className="mt-5 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {t('mentor.public.reviewLocked')}
        </p>
      ) : null}

      {showReviewForm ? (
        <div className="mt-5">
          <ReviewForm
            targetType={ReviewTargetType.MENTOR}
            targetId={mentor.userId}
            onClose={onCloseReviewForm}
            onSuccess={onCloseReviewForm}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <ReviewList
          targetType={ReviewTargetType.MENTOR}
          targetId={mentor.userId}
          summary={reviewSummary}
        />
      </div>
    </section>
  )
}

function SectionHeading({
  icon,
  title,
  description,
  id,
}: {
  icon: ReactNode
  title: string
  description: string
  id: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/15">
          {icon}
        </span>
        <div>
          <h2 id={id} className="text-[28px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[30px] dark:text-slate-100">
            {title}
          </h2>
          <div className="mt-2 h-px w-16 bg-emerald-200 dark:bg-emerald-500/35" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-2 max-w-[65ch] text-[15px] leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  )
}

function InlineEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mt-5 flex flex-col items-start gap-4 rounded-[18px] border border-dashed border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </span>
        <div>
          <h3 className="font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}

function OfferingSkeleton() {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-64 animate-pulse rounded-[18px] bg-slate-200/70 dark:bg-slate-800" />
      ))}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f8f7] px-4 py-8 dark:bg-slate-950" aria-hidden="true">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[430px] animate-pulse rounded-[22px] bg-slate-200/70 dark:bg-slate-800" />
        <div className="h-[420px] animate-pulse rounded-[22px] bg-slate-200/70 dark:bg-slate-800" />
        <div className="h-72 animate-pulse rounded-[22px] bg-slate-200/70 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()

  return (
    <div className="min-h-[60vh] bg-[#f6f8f7] px-4 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-lg rounded-[22px] border border-rose-200 bg-white p-8 text-center dark:border-rose-500/25 dark:bg-slate-900">
        <UsersRound className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-950 dark:text-slate-100">
          {t('mentorProfile.profileUnavailableTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('mentorProfile.profileUnavailableDescription')}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
          >
            {t('mentorProfile.retry')}
          </button>
          <Link
            to="/mentors"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('mentorProfile.backToMentors')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function sortPackages(items: MentorPackageResponse[]) {
  return [...items].sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0))
}

function sortLearningProducts(items: CourseResponse[]) {
  return [...items].sort(
    (left, right) => (right.totalEnrollments || 0) - (left.totalEnrollments || 0)
  )
}

function sortFeatured<T extends { isFeatured?: boolean; displayOrder?: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (Boolean(right.isFeatured) !== Boolean(left.isFeatured)) {
      return Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured))
    }
    return (left.displayOrder || 0) - (right.displayOrder || 0)
  })
}

function buildAvailableSchedule(
  availability: MentorWeeklyAvailabilityResponse | undefined,
  language: 'en' | 'vi'
): ScheduleDay[] {
  if (!availability) return []

  const dayLabels =
    language === 'vi'
      ? ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date()
  const days: ScheduleDay[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    const jsDay = date.getDay()
    const backendDay = jsDay === 0 ? 7 : jsDay
    const isoDate = date.toISOString().split('T')[0]
    const blocked = availability.blockedDates.includes(isoDate)
    const slots = blocked
      ? []
      : (availability.weeklySchedule?.[backendDay] || []).filter((slot) => slot.isActive)

    if (slots.length > 0) {
      days.push({
        key: `${isoDate}-${backendDay}`,
        dayLabel:
          offset === 0
            ? language === 'vi'
              ? 'Hôm nay'
              : 'Today'
            : dayLabels[jsDay],
        dateLabel: `${date.getDate()}/${date.getMonth() + 1}`,
        slots,
      })
    }
  }

  return days
}

function buildResources(
  mentor: MentorProfileResponse,
  assets: MentorProfileAssetResponse[],
  language: 'en' | 'vi'
): ResourceItem[] {
  const items: ResourceItem[] = []
  const seenUrls = new Set<string>()

  const addResource = (id: string, title: string, description: string, value?: string) => {
    const url = getSafeExternalUrl(value)
    if (!url || seenUrls.has(url)) return
    seenUrls.add(url)
    items.push({ id, title, description, url })
  }

  addResource(
    'portfolio',
    language === 'vi' ? 'Portfolio' : 'Portfolio',
    language === 'vi' ? 'Sản phẩm và dự án đã công khai' : 'Public work and projects',
    mentor.portfolioUrl
  )
  addResource(
    'github',
    'GitHub',
    language === 'vi' ? 'Mã nguồn và hoạt động kỹ thuật' : 'Code and technical activity',
    mentor.githubUrl
  )
  addResource(
    'linkedin',
    'LinkedIn',
    language === 'vi' ? 'Thông tin nghề nghiệp công khai' : 'Public professional background',
    mentor.linkedinUrl
  )
  addResource(
    'certificate',
    language === 'vi' ? 'Chứng chỉ' : 'Certificate',
    language === 'vi' ? 'Minh chứng chuyên môn đã công khai' : 'Public expertise evidence',
    mentor.certificateUrl
  )

  getMentorProofLinks(mentor).forEach((link, index) => {
    addResource(
      `proof-${index}-${link.label}`,
      link.label,
      language === 'vi' ? 'Liên kết minh chứng' : 'Evidence link',
      link.url
    )
  })

  assets
    .filter((asset) => asset.type === MentorProfileAssetType.DOCUMENT)
    .forEach((asset) => {
      addResource(
        `document-${asset.id}`,
        asset.title,
        asset.description || asset.issuer || (language === 'vi' ? 'Tài liệu công khai' : 'Public document'),
        asset.fileUrl
      )
    })

  return items
}

function getPackageTypeLabel(
  packageType: PackageType,
  t: Translate
) {
  switch (packageType) {
    case PackageType.PACKAGE_DEAL:
      return t('mentorProfile.packageType.multiSession')
    case PackageType.SUBSCRIPTION:
      return t('mentorProfile.packageType.ongoing')
    default:
      return t('mentorProfile.packageType.single')
  }
}

function getEvidenceTypeLabel(
  type: MentorProfileAssetType,
  t: Translate
) {
  switch (type) {
    case MentorProfileAssetType.ACHIEVEMENT:
      return t('mentorProfile.evidence.achievement')
    case MentorProfileAssetType.CERTIFICATE:
      return t('mentorProfile.evidence.certificate')
    default:
      return t('mentorProfile.evidence.experience')
  }
}

function getProductTypeLabel(productType: CourseProductType | undefined, t: Translate) {
  return productType === CourseProductType.DOCUMENT
    ? t('mentorProfile.productType.document')
    : t('mentorProfile.productType.course')
}

function getCourseId(course: CourseResponse) {
  return course.courseId || course.id || course.slug
}

function getProductPrice(course: CourseResponse) {
  return course.effectivePriceMxc ?? course.priceMxc ?? 0
}

function getMeaningfulProfileText(value?: string) {
  const text = value?.trim()
  if (!text) return undefined

  const normalized = text.toLowerCase()
  const placeholderPhrases = [
    'seeded mentor profile',
    'demo account seeded',
    'development and qa scenarios',
    'mentorx development',
    'supports practical mentoring, reviews, and structured feedback',
  ]

  return placeholderPhrases.some((phrase) => normalized.includes(phrase))
    ? undefined
    : text
}

function formatLanguages(languages: string[], language: 'en' | 'vi') {
  const labels: Record<string, string> =
    language === 'vi'
      ? { vi: 'Tiếng Việt', en: 'English' }
      : { vi: 'Vietnamese', en: 'English' }

  return Array.from(
    new Set(languages.map((item) => labels[item.toLowerCase()] || item))
  ).join(' + ')
}

function formatProductUnits(
  count: number,
  productType: CourseProductType | undefined,
  language: 'en' | 'vi',
  t: Translate
) {
  const isDocument = productType === CourseProductType.DOCUMENT
  const key = isDocument
    ? language === 'en' && count === 1
      ? 'mentorProfile.productSection'
      : 'mentorProfile.productSections'
    : language === 'en' && count === 1
      ? 'mentorProfile.productLesson'
      : 'mentorProfile.productLessons'

  return t(key, { count })
}

function formatProductLearners(count: number, language: 'en' | 'vi', t: Translate) {
  const key =
    language === 'en' && count === 1
      ? 'mentorProfile.productLearner'
      : 'mentorProfile.productLearners'

  return t(key, { count })
}

function getSafePublicUrl(value?: string) {
  if (!value) return undefined
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return getSafeExternalUrl(value)
}

function getSafeExternalUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'M'
  )
}

function formatDuration(count: number, language: 'en' | 'vi', t: Translate) {
  const key =
    language === 'en' && count === 1
      ? 'mentorProfile.durationHour'
      : 'mentorProfile.durationHours'

  return t(key, { count })
}

function formatRating(value: number | undefined, language: 'en' | 'vi') {
  return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value || 0)
}
function BlogPostsSection({
  posts,
  mentorName,
}: {
  posts: BlogPost[]
  mentorName: string
}) {
  return (
    <section className="border-t border-slate-200 pt-9 dark:border-slate-800" aria-labelledby="mentor-blogs-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
            C?m nang & Ki?n th?c
          </p>
          <h2 id="mentor-blogs-title" className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[30px] dark:text-slate-100">
            B�i vi?t c?a {mentorName}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-slate-600 dark:text-slate-300">
            Kh�m ph� c�c b�i vi?t, chia s? kinh nghi?m v� ki?n th?c chuy�n m�n.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={/blog/ + post.slug}
            className="group flex flex-col overflow-hidden rounded-[20px] bg-white ring-1 ring-inset ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {post.coverImage ? (
                <img src={post.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <BookOpen className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                {post.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400 flex-1">
                {post.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">{post.readTime}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  �?c ti?p <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
