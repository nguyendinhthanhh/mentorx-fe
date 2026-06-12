import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import {
  Award,
  BookOpen,
  Briefcase,
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
import ReviewForm from '@/components/review/ReviewForm'
import ReviewList from '@/components/review/ReviewList'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import {
  MentorAvailabilityResponse,
  MentorOfferingResponse,
  MentorPackageResponse,
  MentorProfileAssetResponse,
  MentorProfileAssetType,
  MentorProfileResponse,
  MentorWeeklyAvailabilityResponse,
  MessageType,
  ReviewTargetType,
} from '@/types'
import { formatMxc } from '@/utils/formatters'
import { getMentorProofLinks } from '@/utils/proofLinks'

import MentorProfileEditor from './MentorProfileSetupPage'

type ProfileTab = 'overview' | 'mentoring' | 'courses' | 'resources' | 'reviews'
type ScheduleDay = { dayLabel: string; dateLabel: string; slots: MentorAvailabilityResponse[]; key: string; today?: boolean; blocked?: boolean }

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

  const { data: mentor, isLoading: mentorLoading } = useQuery(['mentor', userId], () => mentorApi.getMentorProfile(userId!), {
    enabled: Boolean(userId),
  })
  const { data: packages = [], isLoading: packagesLoading } = useQuery(['mentor-packages', userId], () => mentorApi.getActiveMentorPackages(userId!), {
    enabled: Boolean(userId),
  })
  const { data: courses = [], isLoading: coursesLoading } = useQuery(['mentor-courses', userId], () => mentorApi.getPublishedMentorCourses(userId!), {
    enabled: Boolean(userId),
  })
  const { data: availability, isLoading: availabilityLoading } = useQuery(['mentor-availability', userId], () => mentorApi.getWeeklyAvailability(userId!), {
    enabled: Boolean(userId),
  })
  const { data: assets = [], isLoading: assetsLoading } = useQuery(['mentor-assets', userId], () => mentorApi.getProfileAssets(userId!), {
    enabled: Boolean(userId),
  })
  const { data: isSaved = false, isLoading: savedLoading, refetch: refetchSavedStatus } = useQuery(
    ['mentor-saved-status', user?.userId, userId],
    () => mentorApi.isMentorSaved(user!.userId, userId!),
    { enabled: Boolean(user?.userId && userId) }
  )
  const { data: canReviewMentor = false } = useQuery(
    ['mentor-review-eligibility', user?.userId, userId],
    () => reviewApi.canReviewMentor(userId!),
    { enabled: Boolean(user?.userId && userId) }
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
      onError: () => {
        setActionError(t('mentor.public.error.saved'))
      },
    }
  )

  const isOwnProfile = user?.userId === mentor?.userId

  if (mentorLoading || packagesLoading || coursesLoading || availabilityLoading || assetsLoading) {
    return <ProfileSkeleton />
  }

  if (!mentor) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-300">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-950">{t('mentor.public.notFoundTitle')}</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">{t('mentor.public.notFoundBody')}</p>
        <Link to="/mentors" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
          {t('mentor.public.browseMentors')}
        </Link>
      </div>
    )
  }

  if (isEditing && isOwnProfile) {
    return <MentorProfileEditor onCancelEdit={() => setIsEditing(false)} />
  }

  const name = mentor.user?.fullName || mentor.user?.displayName || 'Mentor'
  const title = mentor.headline || mentor.currentTitle || mentor.primaryDomain || t('common.mentor')
  const proofLinks = getMentorProofLinks(mentor)
  const featuredExperiences = sortFeatured(assets.filter((asset) => asset.type === MentorProfileAssetType.EXPERIENCE)).slice(0, 6)
  const featuredAchievements = sortFeatured(
    assets.filter((asset) => asset.type === MentorProfileAssetType.ACHIEVEMENT || asset.type === MentorProfileAssetType.CERTIFICATE)
  ).slice(0, 6)
  const publicDocuments = sortFeatured(assets.filter((asset) => asset.type === MentorProfileAssetType.DOCUMENT))
  const schedule = buildScheduleFromAvailability(availability, language)
  const profileVisual = getProfileVisual(mentor, assets, name)
  const introVisual = getIntroVisual(mentor, assets, courses, profileVisual)
  const companyHighlights = buildCompanyHighlights(mentor, featuredExperiences)

  const tabs: Array<{ key: ProfileTab; label: string }> = [
    { key: 'overview', label: t('mentor.public.tabs.overview') },
    { key: 'mentoring', label: t('mentor.public.tabs.mentoring') },
    { key: 'courses', label: t('mentor.public.tabs.courses') },
    { key: 'resources', label: t('mentor.public.tabs.resources') },
    { key: 'reviews', label: t('mentor.public.tabs.reviews') },
  ]

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
        (room) => room.roomType === 'DIRECT_MESSAGE' && room.members.some((member) => member.userId === mentor.userId)
      )

      const room = existingRoom || await chatApi.createRoom({
        roomType: 'DIRECT_MESSAGE',
        roomName: name,
        description: `Mentoring conversation with ${name}`,
        createdByUserId: user.userId,
        isPrivate: true,
        maxMembers: 2,
        referenceId: mentor.userId,
        referenceType: 'MENTOR_PROFILE',
        memberIds: [user.userId, mentor.userId],
      })

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
        ? `Chao ${name}, toi muon dat mot buoi mentoring 1:1 voi ban. Ban co the goi y khung gio phu hop khong?`
        : `Hi ${name}, I'd like to book a 1:1 mentoring session with you. Can you suggest a suitable time?`,
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

  return (
    <div className="mx-auto max-w-[1360px] space-y-8 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/mentors" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-700">
          <ChevronLeft className="h-4 w-4" />
          {t('mentor.public.backToMentors')}
        </Link>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
          {t('mentor.profile.publicProfile')}
        </span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <IdentityCard
          mentor={mentor}
          name={name}
          title={title}
          profileVisual={profileVisual}
          saved={isSaved}
          savingMentor={savedLoading || saveMentorMutation.isLoading}
          pendingAction={pendingAction}
          isOwnProfile={isOwnProfile}
          onToggleSaved={toggleSavedMentor}
          onMessage={() => openMentorChat(undefined, 'message')}
          onBook={requestBooking}
          onEdit={() => setIsEditing(true)}
          language={language}
        />

        <IntroPanel
          mentor={mentor}
          name={name}
          assets={assets}
          experiences={featuredExperiences}
          companies={companyHighlights}
          achievements={featuredAchievements}
          introVisual={introVisual}
          proofLinks={proofLinks}
          language={language}
        />
      </section>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {actionError}
        </div>
      )}

      <nav className="flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-200 pb-1 sm:flex-nowrap sm:gap-6 sm:overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap border-b-2 px-0.5 pb-2 text-sm font-black transition-colors sm:pb-4 ${
              activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {(activeTab === 'overview' || activeTab === 'mentoring') && (
        <>
          <SectionHeader title={language === 'vi' ? 'Goi Mentoring 1-1 pho bien' : t('mentor.public.featuredPackages')} />
          {packages.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {sortPackages(packages).slice(0, 3).map((item) => (
                <MentoringPackageCard
                  key={item.id}
                  item={item}
                  language={language}
                  pending={pendingAction === `package-${item.id}`}
                  onBook={() =>
                    openMentorChat(
                      language === 'vi'
                        ? `Chao ${name}, toi muon dat goi "${item.title}" (${formatMxc(item.priceMxc, language)}). Ban co the huong dan buoc tiep theo khong?`
                        : `Hi ${name}, I'd like to book the "${item.title}" package (${formatMxc(item.priceMxc, language)}). Can you help me with the next step?`,
                      `package-${item.id}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyCard message={t('mentor.public.noPackages')} />
          )}

          <SchedulePanel
            schedule={schedule}
            pendingAction={pendingAction}
            onBookSlot={(slot) =>
              openMentorChat(
                language === 'vi'
                  ? `Chao ${name}, toi muon dat buoi mentoring vao ${slot}. Khung gio nay con trong khong?`
                  : `Hi ${name}, I'd like to book a mentoring session at ${slot}. Is this time still available?`,
                `slot-${slot}`
              )
            }
            language={language}
          />
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'courses') && (
        <>
          <SectionHeader title={t('mentor.public.featuredCourses')} />
          {courses.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {courses.slice(0, 3).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  language={language}
                  pending={pendingAction === `course-${course.id}`}
                  onAsk={() =>
                    openMentorChat(
                      language === 'vi'
                        ? `Chao ${name}, toi muon tim hieu them ve khoa hoc "${course.title}". Ban co the tu van giup toi khong?`
                        : `Hi ${name}, I'd like to learn more about the course "${course.title}". Can you advise me?`,
                      `course-${course.id}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyCard message={t('mentor.public.noCourses')} />
          )}
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'resources') && (
        <>
          <SectionHeader title={t('mentor.public.publicResources')} />
          <ResourcesPanel mentor={mentor} proofLinks={proofLinks} documents={publicDocuments} />
        </>
      )}

      {activeTab === 'reviews' && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-950">{t('mentor.public.learnerReviews')}</h2>
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

function IdentityCard({
  mentor,
  name,
  title,
  profileVisual,
  saved,
  savingMentor,
  pendingAction,
  isOwnProfile,
  onToggleSaved,
  onMessage,
  onBook,
  onEdit,
  language,
}: {
  mentor: MentorProfileResponse
  name: string
  title: string
  profileVisual: ProfileVisual
  saved: boolean
  savingMentor: boolean
  pendingAction: string | null
  isOwnProfile: boolean
  onToggleSaved: () => void
  onMessage: () => void
  onBook: () => void
  onEdit: () => void
  language: 'en' | 'vi'
}) {
  const { t } = useI18n()
  const stats = [
    {
      label: t('mentor.public.responseRate'),
      value: mentor.successRate != null ? `${Number(mentor.successRate).toFixed(0)}%` : language === 'vi' ? 'Chua co du lieu' : 'No data yet',
    },
    {
      label: t('mentor.public.responseTime'),
      value:
        mentor.responseTimeHours != null
          ? t('mentor.public.responseWithinHours', { hours: mentor.responseTimeHours })
          : language === 'vi'
            ? 'Chua du du lieu tin nhan'
            : 'Not enough message data yet',
    },
  ]

  return (
    <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_22px_65px_-40px_rgba(15,23,42,0.45)] sm:p-6 xl:sticky xl:top-24 xl:self-start">
      <div className="flex justify-center">
        <div className="relative">
          <AvatarVisual visual={profileVisual} name={name} className="h-28 w-28 ring-8 ring-orange-50" />
          <div className="absolute -right-1 top-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('mentor.public.verified')}
          </div>
        </div>
      </div>

      <div className="mt-5 text-center">
        <h1 className="text-[32px] font-black tracking-tight text-slate-950">{name}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{title}</p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {mentor.averageRating?.toFixed(1) || 'N/A'}
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-slate-500">{t('mentor.public.ratingReviews', { count: mentor.totalReviews })}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isOwnProfile ? (
          <button type="button" onClick={onEdit} className="h-12 w-full rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700">
            {t('mentor.public.editProfile')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBook}
              disabled={Boolean(pendingAction)}
              className="h-12 w-full rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {pendingAction === 'book-profile' ? t('mentor.public.openingChat') : t('mentor.public.bookSession')}
            </button>
            <button
              type="button"
              onClick={onMessage}
              disabled={Boolean(pendingAction)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <MessageSquare className="h-4 w-4" />
              {pendingAction === 'message' ? t('mentor.public.openingChat') : t('mentor.public.messageMentor')}
            </button>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
        {stats.map((item) => (
          <MiniStat key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {!isOwnProfile && (
        <button
          type="button"
          onClick={onToggleSaved}
          disabled={savingMentor}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-50 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-current text-rose-500' : ''}`} />
          {savingMentor ? t('mentor.public.updating') : saved ? t('mentor.public.savedMentor') : t('mentor.public.saveMentor')}
        </button>
      )}
    </aside>
  )
}

function IntroPanel({
  mentor,
  name,
  assets,
  experiences,
  companies,
  achievements,
  introVisual,
  proofLinks,
  language,
}: {
  mentor: MentorProfileResponse
  name: string
  assets: MentorProfileAssetResponse[]
  experiences: MentorProfileAssetResponse[]
  companies: string[]
  achievements: MentorProfileAssetResponse[]
  introVisual: IntroVisual
  proofLinks: Array<{ label: string; url: string }>
  language: 'en' | 'vi'
}) {
  const { t } = useI18n()
  const professionalSummary = mentor.professionalBio || mentor.helpDescription || t('mentor.public.fallbackBio', { name })
  const quickFacts = [
    {
      icon: <Globe className="h-4 w-4 text-blue-600" />,
      value: mentor.primaryDomain || t('common.notSpecifiedYet'),
    },
    {
      icon: <Clock className="h-4 w-4 text-blue-600" />,
      value: mentor.hourlyRateMxc ? t('mentor.public.ratePerHour', { amount: formatMxc(mentor.hourlyRateMxc, language) }) : t('common.contact'),
    },
    {
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      value: mentor.yearsOfExperience ? t('mentor.public.yearsCount', { count: mentor.yearsOfExperience }) : t('common.notSpecifiedYet'),
    },
  ].filter((item) => Boolean(item.value))

  const introTitle = language === 'vi' ? 'Gioi thieu ban than' : 'About this mentor'
  const achievementTitle = language === 'vi' ? 'Thanh tich noi bat' : 'Top achievements'
  const experienceTitle = language === 'vi' ? 'Da tung lam viec tai:' : 'Worked with:'

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_65px_-40px_rgba(15,23,42,0.45)] lg:p-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-gray-950">
            <Users className="h-5 w-5 text-blue-600" />
            {introTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">{professionalSummary}</p>

          {quickFacts.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {quickFacts.map((metric) => (
                <div key={metric.value} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-800">
                  {metric.icon}
                  <span>{metric.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_280px]">
            <IntroVideoCard visual={introVisual} videoUrl={mentor.videoIntroUrl} />

            <div className="rounded-[24px] bg-slate-50 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950">
                <Trophy className="h-4 w-4 text-blue-600" />
                {achievementTitle}
              </h3>

              <div className="space-y-3">
                {proofLinks.slice(0, 2).map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 flex-none" />
                    <span>{link.label}</span>
                  </a>
                ))}

                {achievements.length > 0 ? (
                  achievements.slice(0, 4).map((achievement) => (
                    <div key={achievement.id} className="flex gap-2 text-sm font-medium text-slate-600">
                      <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                      <span>{achievement.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2 text-sm font-medium text-slate-600">
                    <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                    <span>{t('mentor.public.noPublicAchievementsYet')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-gray-950">{experienceTitle}</p>
            {companies.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {companies.map((company) => (
                  <CompanyBadge key={company} company={company} />
                ))}
              </div>
            ) : experiences.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {experiences.slice(0, 4).map((experience) => (
                  <ExperienceBadge key={experience.id} asset={experience} />
                ))}
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-500">{t('mentor.public.noPublicExperienceYet')}</span>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-gray-950">{t('mentor.public.skills')}</p>
            <div className="flex flex-wrap gap-2">
              {(mentor.skills || []).length > 0 ? (
                mentor.skills!.map((skill) => (
                  <span key={skill} className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm font-medium text-gray-500">{t('mentor.public.noSkillsListedYet')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {mentor.currentTitle && (
            <ProfileDetailCard
              icon={<Briefcase className="h-4 w-4 text-blue-600" />}
              label={language === 'vi' ? 'Vi tri hien tai' : 'Current role'}
              value={mentor.currentCompany ? `${mentor.currentTitle} @ ${mentor.currentCompany}` : mentor.currentTitle}
            />
          )}
          {mentor.location && (
            <ProfileDetailCard
              icon={<Globe className="h-4 w-4 text-blue-600" />}
              label={language === 'vi' ? 'Dia diem / mui gio' : 'Location / timezone'}
              value={mentor.location}
            />
          )}
          {mentor.languages?.length ? (
            <ProfileDetailCard
              icon={<Users className="h-4 w-4 text-blue-600" />}
              label={language === 'vi' ? 'Ngon ngu' : 'Languages'}
              value={mentor.languages.join(', ')}
            />
          ) : null}
          {mentor.portfolioUrl && (
            <ProfileDetailCard
              icon={<ExternalLink className="h-4 w-4 text-blue-600" />}
              label={t('mentor.public.portfolio')}
              value={t('mentor.public.openPortfolio')}
              href={mentor.portfolioUrl}
            />
          )}
          {assets.length > 0 && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                {language === 'vi' ? 'Noi dung cong khai' : 'Public assets'}
              </p>
              <div className="space-y-2">
                {assets.slice(0, 4).map((asset) => (
                  <div key={asset.id} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    {asset.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MentoringPackageCard({
  item,
  onBook,
  pending,
  language,
}: {
  item: MentorPackageResponse
  onBook: () => void
  pending: boolean
  language: 'en' | 'vi'
}) {
  const { t } = useI18n()
  const durationLabel = `${item.durationHours * 60} min`
  const features = (item.features || []).slice(0, 3)

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_60px_-35px_rgba(37,99,235,0.3)]">
      <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
        {durationLabel}
      </span>
      <h3 className="mt-4 text-lg font-black text-gray-950">{item.title}</h3>
      <p className="mt-2 min-h-[68px] text-sm leading-6 text-gray-500">{item.description}</p>
      <div className="mt-4">
        <p className="text-3xl font-black text-blue-600">{formatMxc(item.priceMxc, language)}</p>
      </div>
      {features.length > 0 && (
        <ul className="mt-5 space-y-2">
          {features.map((feature, index) => (
            <li key={`${item.id}-${index}`} className="flex items-center gap-2 text-sm font-medium text-gray-600">
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
        className="mt-6 h-11 w-full rounded-full bg-blue-600 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? t('mentor.public.openingChat') : t('mentor.public.package.book')}
      </button>
    </article>
  )
}

function CourseCard({
  course,
  onAsk,
  pending,
  language,
}: {
  course: MentorOfferingResponse
  onAsk: () => void
  pending: boolean
  language: 'en' | 'vi'
}) {
  const { t } = useI18n()
  const image = course.thumbnailUrl
  const levelText =
    course.level === 'ADVANCED'
      ? t('mentor.public.course.advanced')
      : course.level === 'INTERMEDIATE'
        ? t('mentor.public.course.intermediate')
        : t('mentor.public.course.beginner')

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_60px_-35px_rgba(37,99,235,0.3)]">
      {image ? (
        <img src={image} alt={course.title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <BookOpen className="h-10 w-10" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-black text-gray-950">{course.title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" />
        {t('mentor.public.course.lessons', { count: course.lessonsCount })} • {levelText}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">{course.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-black text-blue-600">{formatMxc(course.priceMxc, language)}</span>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{course.durationHours}h</span>
      </div>
      <button
        type="button"
        onClick={onAsk}
        disabled={pending}
        className="mt-4 h-10 w-full rounded-full border border-blue-300 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
      >
        {pending ? t('mentor.public.openingChat') : t('mentor.public.course.ask')}
      </button>
    </article>
  )
}

function SchedulePanel({
  schedule,
  pendingAction,
  onBookSlot,
  language,
}: {
  schedule: ScheduleDay[]
  pendingAction: string | null
  onBookSlot: (slotLabel: string) => void
  language: 'en' | 'vi'
}) {
  const { t } = useI18n()
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-gray-950">
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('mentor.public.schedule.title')}
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">{t('mentor.public.schedule.subtitle')}</p>
        </div>
      </div>

      {schedule.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          {schedule.map((day) => (
            <div
              key={day.key}
              className={`rounded-[22px] border p-3 text-center ${
                day.today ? 'border-blue-200 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <p className="text-xs font-bold text-gray-500">{day.dayLabel}</p>
              <p className="mt-1 text-base font-black text-gray-950">{day.dateLabel}</p>
              <div className="mt-3 space-y-2">
                {day.slots.length > 0 ? (
                  day.slots.map((slot) => {
                    const slotLabel = `${day.dayLabel} ${day.dateLabel} ${slot.startTime.slice(0, 5)}`
                    return (
                      <button
                        type="button"
                        key={`${day.key}-${slot.id}`}
                        onClick={() => onBookSlot(slotLabel)}
                        disabled={pendingAction === `slot-${slotLabel}`}
                        className={`h-7 w-full rounded-full text-xs font-black ${
                          day.today ? 'bg-blue-600 text-white' : 'border border-blue-300 bg-white text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {slot.startTime.slice(0, 5)}
                      </button>
                    )
                  })
                ) : (
                  <span className="inline-flex h-7 w-full items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-400">
                    {day.blocked ? (language === 'vi' ? 'Da block' : 'Blocked') : t('mentor.public.schedule.off')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCard message={t('mentor.public.schedule.noAvailability')} />
      )}
    </section>
  )
}

function ResourcesPanel({
  mentor,
  proofLinks,
  documents,
}: {
  mentor: MentorProfileResponse
  proofLinks: Array<{ label: string; url: string }>
  documents: MentorProfileAssetResponse[]
}) {
  const { t } = useI18n()

  if (documents.length === 0 && proofLinks.length === 0 && !mentor.portfolioUrl && !mentor.cvUrl && !mentor.certificateUrl) {
    return <EmptyCard message={t('mentor.public.noResources')} />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {mentor.portfolioUrl && (
        <ResourceCard title={t('mentor.public.resource.portfolio')} description={t('mentor.public.resource.portfolioDescription')} href={mentor.portfolioUrl} />
      )}
      {mentor.cvUrl && (
        <ResourceCard title={t('mentor.public.resource.resume')} description={t('mentor.public.resource.resumeDescription')} href={mentor.cvUrl} />
      )}
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

function IntroVideoCard({ visual, videoUrl }: { visual: IntroVisual; videoUrl?: string }) {
  return (
    <div className="overflow-hidden rounded-[26px] bg-gray-950">
      <div className="relative aspect-video">
        {visual.imageUrl ? (
          <img src={visual.imageUrl} alt={visual.alt} className="h-full w-full object-cover opacity-85" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
            <Play className="h-10 w-10" />
          </div>
        )}

        {videoUrl ? (
          <a
            href={videoUrl}
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
  )
}

function ExperienceBadge({ asset }: { asset: MentorProfileAssetResponse }) {
  const imageUrl = getAssetImage(asset)
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
      {imageUrl ? (
        <img src={imageUrl} alt={asset.title} className="h-10 w-10 rounded-xl object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Briefcase className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-black text-gray-950">{asset.title}</p>
        {asset.issuer && <p className="text-xs font-medium text-gray-500">{asset.issuer}</p>}
      </div>
    </div>
  )
}

function CompanyBadge({ company }: { company: string }) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-[0_16px_36px_-32px_rgba(15,23,42,0.45)]">
      {company}
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
      className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-32px_rgba(37,99,235,0.25)]"
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        <ExternalLink className="h-4 w-4 text-blue-600" />
        {t('mentor.public.resource.label')}
      </div>
      <h3 className="mt-3 text-lg font-black text-gray-950">{title}</h3>
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
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        {icon}
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-black text-blue-700 hover:text-blue-800">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm font-black text-gray-950">{value}</p>
      )}
    </div>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black tracking-tight text-gray-950">{title}</h2>
      {action}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-black text-gray-950">{value}</p>
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-8">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100" />
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-3xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

type ProfileVisual = { imageUrl?: string; initials: string }
type IntroVisual = { imageUrl?: string; alt: string }

function sortFeatured<T extends { isFeatured?: boolean; displayOrder?: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (Boolean(b.isFeatured) !== Boolean(a.isFeatured)) {
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
    }
    return (a.displayOrder || 0) - (b.displayOrder || 0)
  })
}

function sortPackages(items: MentorPackageResponse[]) {
  return [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
}

function buildCompanyHighlights(mentor: MentorProfileResponse, experiences: MentorProfileAssetResponse[]) {
  const values = [
    mentor.currentCompany,
    ...experiences.flatMap((experience) => [experience.issuer, experience.title]),
  ]

  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\s*[@|-]\s*.*/g, '').trim())
    .filter((value) => value.length >= 2 && value.length <= 30)
    .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 4)
}

function buildScheduleFromAvailability(
  availability: MentorWeeklyAvailabilityResponse | undefined,
  language: 'en' | 'vi'
): ScheduleDay[] {
  if (!availability) return []

  const dayLabels = language === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const today = new Date()
  const schedule: ScheduleDay[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    const jsDay = date.getDay()
    const backendDay = jsDay === 0 ? 7 : jsDay
    const slots = (availability.weeklySchedule?.[backendDay] || []).filter((slot) => slot.isActive)
    const isoDate = date.toISOString().split('T')[0]

    schedule.push({
      key: `${isoDate}-${backendDay}`,
      dayLabel: offset === 0 ? (language === 'vi' ? 'Hom nay' : 'Today') : dayLabels[jsDay],
      dateLabel: `${date.getDate()}/${date.getMonth() + 1}`,
      slots,
      today: offset === 0,
      blocked: availability.blockedDates.includes(isoDate),
    })
  }

  return schedule.map((day) => ({
    ...day,
    slots: day.blocked ? [] : day.slots,
  }))
}

function getProfileVisual(
  mentor: MentorProfileResponse,
  assets: MentorProfileAssetResponse[],
  name: string
): ProfileVisual {
  const imageUrl =
    mentor.user?.avatarUrl ||
    getAssetImage(sortFeatured(assets).find((asset) => Boolean(getAssetImage(asset))))

  return {
    imageUrl,
    initials: getInitials(name),
  }
}

function getIntroVisual(
  mentor: MentorProfileResponse,
  assets: MentorProfileAssetResponse[],
  courses: MentorOfferingResponse[],
  profileVisual: ProfileVisual
): IntroVisual {
  const videoThumb = getVideoThumbnailUrl(mentor.videoIntroUrl)
  const imageUrl =
    videoThumb ||
    courses.find((course) => Boolean(course.thumbnailUrl))?.thumbnailUrl ||
    getAssetImage(sortFeatured(assets).find((asset) => Boolean(getAssetImage(asset)))) ||
    profileVisual.imageUrl

  return {
    imageUrl,
    alt: mentor.headline || mentor.user?.fullName || 'Mentor intro',
  }
}

function AvatarVisual({ visual, name, className = '' }: { visual: ProfileVisual; name: string; className?: string }) {
  if (visual.imageUrl) {
    return <img src={visual.imageUrl} alt={name} className={`rounded-full object-cover ${className}`} />
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-200 to-violet-300 text-5xl font-light text-slate-950 ${className}`}>
      {visual.initials}
    </div>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'M'
}

function getAssetImage(asset?: MentorProfileAssetResponse) {
  if (!asset) return undefined
  if (isImageUrl(asset.iconUrl)) return asset.iconUrl
  if (isImageUrl(asset.fileUrl)) return asset.fileUrl
  return undefined
}

function isImageUrl(value?: string) {
  return Boolean(value && /\.(png|jpe?g|webp|gif|svg)$/i.test(value))
}

function getVideoThumbnailUrl(videoUrl?: string) {
  if (!videoUrl) return undefined

  const youtubeMatch =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i.exec(videoUrl) ||
    /youtube\.com\/embed\/([^&?/]+)/i.exec(videoUrl)

  if (youtubeMatch?.[1]) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
  }

  return undefined
}
