import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { useRecordView, useViewCount } from '@/hooks/useAnalytics'
import ViewTimelineChart from '@/components/analytics/ViewTimelineChart'
import {
  Eye,
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
  Clock3,
  Loader2,
  ArrowRight
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
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

type ProfileTab = 'overview' | 'mentoring' | 'courses' | 'resources' | 'reviews'
type ScheduleDay = { dayLabel: string; dateLabel: string; slots: MentorAvailabilityResponse[]; key: string; today?: boolean; blocked?: boolean }

export default function MentorPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  useRecordView('user', userId)
  const { data: viewCountData } = useViewCount('user', userId)
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
    <div className="bg-[#F8FAFC] min-h-screen text-gray-900 pb-20">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Danh sách Mentor', to: '/mentors' },
            { label: name },
          ]}
        />
      </div>

      {/* 1. Hero Cover Banner */}
      <div 
        className={`relative h-48 sm:h-64 ${!mentor?.coverUrl ? 'bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800' : 'bg-slate-900'}`}
      >
        {mentor?.coverUrl ? (
          <img src={mentor.coverUrl} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        )}
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 -mt-20">

        {/* 3. Main 2-Column Grid */}
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          
          {/* LEFT COLUMN: Avatar + IntroPanel + Main Content */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="px-6 pb-8 pt-6 sm:px-8">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6 relative z-10">
                  <div className="relative shrink-0 -mt-20 sm:-mt-28 ml-2">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl border-[6px] border-white bg-white shadow-lg overflow-hidden">
                      {mentor.user?.avatarUrl ? (
                        <img src={mentor.user.avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-5xl font-black text-white">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {true && (
                      <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-blue-500 text-white shadow-sm" title="Verified Mentor">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{name}</h1>
                    <p className="mt-2 text-lg sm:text-xl font-bold text-gray-600">{title}</p>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                      {(mentor.averageRating || 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span>{mentor.averageRating?.toFixed(1)}</span>
                          <span className="text-amber-600/70">({mentor.totalReviews} reviews)</span>
                        </div>
                      )}
                      {mentor.location && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                          <Globe className="h-4 w-4" />
                          <span>{mentor.location}</span>
                        </div>
                      )}
                      {viewCountData?.viewCount != null && (
                         <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                           <Eye className="h-4 w-4" />
                           <span>{viewCountData.viewCount.toLocaleString()} views</span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-8">
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
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <nav className="flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-100 pb-2 sm:flex-nowrap sm:gap-6 sm:overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap border-b-2 px-1 pb-3 text-[15px] font-black transition-all sm:pb-4 ${
                      activeTab === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 space-y-10">
                {(activeTab === 'overview' || activeTab === 'mentoring') && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                      <SectionHeader title={language === 'vi' ? 'Gói Mentoring 1-1 nổi bật' : t('mentor.public.featuredPackages')} />
                      {packages.length > 0 ? (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                          {sortPackages(packages).slice(0, 6).map((item, idx) => (
                            <MentoringPackageCard
                              key={item.id}
                              item={item}
                              language={language}
                              featured={idx === 0}
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
                    </div>

                    <div>
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
                    </div>
                  </div>
                )}

                {(activeTab === 'overview' || activeTab === 'courses') && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <SectionHeader title={t('mentor.public.featuredCourses')} />
                    {courses.length > 0 ? (
                      <div className="grid gap-5 lg:grid-cols-2">
                        {courses.slice(0, 4).map((course) => (
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
                  </div>
                )}

                {(activeTab === 'overview' || activeTab === 'resources') && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <SectionHeader title={t('mentor.public.publicResources')} />
                    <ResourcesPanel mentor={mentor} proofLinks={proofLinks} documents={publicDocuments} />
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
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
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition-colors hover:bg-blue-700 shadow-sm"
                        >
                          {t('mentor.public.writeReview')}
                        </button>
                      )}
                    </div>

                    {user && !isOwnProfile && !canReviewMentor && (
                      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
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
                  </div>
                )}
              </div>
            </div>
            
            {/* Owner-only: View Timeline */}
            {isOwnProfile && <ViewTimelineChart targetType="user" targetId={userId} />}

            {actionError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {actionError}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Booking Sidebar */}
          <div className="hidden lg:block relative">
             <aside className="sticky top-24 space-y-5">
               <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                 <div className="mb-6 border-b border-slate-100 pb-6 text-center">
                   <h2 className="text-xl font-black text-gray-900">Work with {name.split(' ')[0]}</h2>
                   <p className="mt-1 text-sm font-medium text-gray-500">Top-rated mentor on MentorX</p>
                 </div>
                 
                 <div className="space-y-3">
                   {isOwnProfile ? (
                     <button type="button" onClick={() => setIsEditing(true)} className="h-12 w-full rounded-full bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700">
                       {t('mentor.public.editProfile')}
                     </button>
                   ) : (
                     <>
                       <button
                         type="button"
                         onClick={requestBooking}
                         disabled={Boolean(pendingAction)}
                         className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-[15px] font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                       >
                         <Calendar className="h-4 w-4" />
                         {pendingAction === 'book-profile' ? t('mentor.public.openingChat') : t('mentor.public.bookSession')}
                       </button>
                       <button
                         type="button"
                         onClick={() => openMentorChat(undefined, 'message')}
                         disabled={Boolean(pendingAction)}
                         className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-indigo-100 bg-white text-[15px] font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-gray-400"
                       >
                         <MessageSquare className="h-4 w-4" />
                         {pendingAction === 'message' ? t('mentor.public.openingChat') : t('mentor.public.messageMentor')}
                       </button>
                     </>
                   )}
                 </div>

                 <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500">{t('mentor.public.responseRate')}</span>
                      <span className="text-sm font-black text-gray-900">{mentor.successRate != null ? `${Number(mentor.successRate).toFixed(0)}%` : language === 'vi' ? 'Chưa có' : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500">{t('mentor.public.responseTime')}</span>
                      <span className="text-sm font-black text-gray-900">{mentor.responseTimeHours != null ? `< ${mentor.responseTimeHours}h` : language === 'vi' ? 'Chưa có' : 'N/A'}</span>
                    </div>
                 </div>

                 {!isOwnProfile && (
                   <button
                     type="button"
                     onClick={toggleSavedMentor}
                     disabled={savedLoading || saveMentorMutation.isLoading}
                     className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-gray-400"
                   >
                     <Heart className={`h-4 w-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                     {savedLoading || saveMentorMutation.isLoading ? t('mentor.public.updating') : isSaved ? t('mentor.public.savedMentor') : t('mentor.public.saveMentor')}
                   </button>
                 )}
               </div>

               {/* Detail Info Card */}
               <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                 <h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                   {language === 'vi' ? 'Thông tin chi tiết' : 'Details'}
                 </h3>
                 <div className="space-y-5">
                   {mentor.currentTitle && (
                     <ProfileInfoItem
                       icon={<Briefcase className="h-4 w-4 text-indigo-600" />}
                       label={language === 'vi' ? 'Vị trí hiện tại' : 'Current role'}
                       value={mentor.currentCompany ? `${mentor.currentTitle} @ ${mentor.currentCompany}` : mentor.currentTitle}
                     />
                   )}
                   {mentor.location && (
                     <ProfileInfoItem
                       icon={<Globe className="h-4 w-4 text-indigo-600" />}
                       label={language === 'vi' ? 'Địa điểm / múi giờ' : 'Location / timezone'}
                       value={mentor.location}
                     />
                   )}
                   {mentor.languages?.length ? (
                     <ProfileInfoItem
                       icon={<Users className="h-4 w-4 text-indigo-600" />}
                       label={language === 'vi' ? 'Ngôn ngữ' : 'Languages'}
                       value={mentor.languages.join(', ')}
                     />
                   ) : null}
                   {mentor.portfolioUrl && (
                     <ProfileInfoItem
                       icon={<ExternalLink className="h-4 w-4 text-indigo-600" />}
                       label={t('mentor.public.portfolio')}
                       value={language === 'vi' ? 'Mở portfolio' : 'Open portfolio'}
                       href={mentor.portfolioUrl}
                     />
                   )}
                 </div>
               </div>
             </aside>
          </div>
        </div>
      </div>
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
  viewCount,
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
  viewCount?: number
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
          {viewCount ? (
            <>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-slate-500">{viewCount.toLocaleString()} views</span>
            </>
          ) : null}
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
      icon: <Globe className="h-4 w-4" />,
      label: mentor.primaryDomain || t('common.notSpecifiedYet'),
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: mentor.hourlyRateMxc ? t('mentor.public.ratePerHour', { amount: formatMxc(mentor.hourlyRateMxc, language) }) : t('common.contact'),
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: mentor.yearsOfExperience ? t('mentor.public.yearsCount', { count: mentor.yearsOfExperience }) : t('common.notSpecifiedYet'),
    },
  ].filter((item) => Boolean(item.label))

  const introTitle = language === 'vi' ? 'Giới thiệu bản thân' : 'About this mentor'
  const achievementTitle = language === 'vi' ? 'Thành tích nổi bật' : 'Top achievements'
  const experienceTitle = language === 'vi' ? 'Đã từng làm việc tại:' : 'Worked with:'

  return (
    <section className="space-y-8">
      {/* Bio + Quick Facts */}
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-black text-gray-950">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Users className="h-4.5 w-4.5" />
          </div>
          {introTitle}
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-gray-600">{professionalSummary}</p>

        {quickFacts.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {quickFacts.map((metric, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  {metric.icon}
                </div>
                <span className="text-sm font-bold text-slate-800">{metric.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video + Achievements side by side - now with more room */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,1fr)]">
        <IntroVideoCard visual={introVisual} videoUrl={mentor.videoIntroUrl} />

        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-base font-black text-slate-950">
            <Trophy className="h-5 w-5 text-amber-500" />
            {achievementTitle}
          </h3>

          <div className="space-y-3.5">
            {proofLinks.slice(0, 2).map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 px-3 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
              >
                <ExternalLink className="mt-0.5 h-4 w-4 flex-none" />
                <span className="line-clamp-2">{link.label}</span>
              </a>
            ))}

            {achievements.length > 0 ? (
              achievements.slice(0, 4).map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                  <Award className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  <span className="line-clamp-2">{achievement.title}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2.5 text-sm font-medium text-slate-400">
                <Award className="mt-0.5 h-4 w-4 flex-none" />
                <span>{t('mentor.public.noPublicAchievementsYet')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experience */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-black text-gray-950">
          <Briefcase className="h-4 w-4 text-slate-500" />
          {experienceTitle}
        </p>
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

      {/* Skills */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-black text-gray-950">
          <BookOpen className="h-4 w-4 text-slate-500" />
          {t('mentor.public.skills')}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {(mentor.skills || []).length > 0 ? (
            mentor.skills!.map((skill) => (
              <span key={skill} className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm font-medium text-gray-500">{t('mentor.public.noSkillsListedYet')}</span>
          )}
        </div>
      </div>
    </section>
  )
}

function ProfileInfoItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-0.5 block text-sm font-black text-blue-600 hover:text-blue-800 hover:underline">
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  )
}

function MentoringPackageCard({
  item,
  onBook,
  pending,
  language,
  featured = false,
}: {
  item: MentorPackageResponse
  onBook: () => void
  pending: boolean
  language: 'en' | 'vi'
  featured?: boolean
}) {
  const { t } = useI18n()
  const totalMinutes = item.durationHours * 60
  const durationLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ''}`
    : `${totalMinutes} phút`
  const features = (item.features || []).slice(0, 4)

  const packageTypeLabel: Record<string, { vi: string; en: string; color: string }> = {
    SINGLE_SESSION: { vi: 'Buổi đơn', en: 'Single session', color: 'bg-sky-100 text-sky-700' },
    PACKAGE_DEAL: { vi: 'Gói nhiều buổi', en: 'Multi-session', color: 'bg-violet-100 text-violet-700' },
    SUBSCRIPTION: { vi: 'Định kỳ', en: 'Recurring', color: 'bg-emerald-100 text-emerald-700' },
  }
  const typeInfo = packageTypeLabel[item.packageType] || packageTypeLabel.SINGLE_SESSION

  return (
    <article className={`group relative flex h-full flex-col rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg ${
      featured ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeInfo.color}`}>
            {language === 'vi' ? typeInfo.vi : typeInfo.en}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500">
            <Clock3 className="h-3 w-3" />
            {durationLabel}
          </span>
          {featured && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {language === 'vi' ? 'Phổ biến' : 'Popular'}
            </span>
          )}
        </div>

        <h3 className="text-[17px] font-bold text-slate-900 leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="px-5 pt-4 flex-1">
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={`${item.id}-${index}`} className="flex items-start gap-2 text-[13px] text-slate-600">
                <div className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price + CTA */}
      <div className="p-5 pt-4 mt-auto">
        <div className="flex items-end justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
              {language === 'vi' ? 'Giá' : 'Price'}
            </p>
            <p className="text-xl font-bold text-slate-900 tracking-tight">
              {formatMxc(item.priceMxc, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={onBook}
            disabled={pending}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5" />
                {t('mentor.public.package.book')}
              </>
            )}
          </button>
        </div>
      </div>
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
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(15,23,42,0.15)]">
      {imageUrl ? (
        <img src={imageUrl} alt={asset.title} className="h-10 w-10 rounded-xl object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Briefcase className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-black text-gray-950 line-clamp-1">{asset.title}</p>
        {asset.issuer && <p className="text-xs font-medium text-gray-500 line-clamp-1">{asset.issuer}</p>}
      </div>
    </div>
  )
}

function CompanyBadge({ company }: { company: string }) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(15,23,42,0.15)]">
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

function ProfileDetailCard() {
  // Empty definition to avoid TS errors if imported elsewhere, but it should be unused now
  return null;
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
