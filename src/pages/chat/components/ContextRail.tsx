import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
  FileImage,
  FileText,
  Link as LinkIcon,
  Lock,
  Star,
  X,
} from 'lucide-react'
import { ChatRoomMemberSummary, ChatRoomResponse, ContractResponse, CourseResponse, MentorProfileResponse, JobResponse } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import {
  EmptySharedState,
  SharedFile,
  SharedImage,
  SharedLink,
  formatRoomType,
  summarizeWeeklyAvailability,
} from '../chatShared'

type ContextRailProps = {
  selectedRoom: ChatRoomResponse | null
  otherMember?: ChatRoomMemberSummary
  mentorProfile: MentorProfileResponse | null | undefined
  mentorCourses: CourseResponse[]
  weeklyAvailability: any
  sharedImages: SharedImage[]
  sharedFiles: SharedFile[]
  sharedLinks: SharedLink[]
  isProfileLoading: boolean
  isCoursesLoading: boolean
  isAvailabilityLoading: boolean
  linkedJob?: JobResponse | null
  isLinkedJobLoading?: boolean
  linkedContract?: ContractResponse | null
  isLinkedContractLoading?: boolean
  onClose?: () => void
  compact?: boolean
}

export default function ContextRail({
  selectedRoom,
  otherMember,
  mentorProfile,
  mentorCourses,
  weeklyAvailability,
  sharedImages,
  sharedFiles,
  sharedLinks,
  isProfileLoading,
  isCoursesLoading,
  isAvailabilityLoading,
  linkedJob,
  isLinkedJobLoading,
  linkedContract,
  isLinkedContractLoading,
  onClose,
  compact,
}: ContextRailProps) {
  if (!selectedRoom) return null

  const availabilitySummary = summarizeWeeklyAvailability(weeklyAvailability)
  const displayName =
    mentorProfile?.user?.displayName ||
    mentorProfile?.user?.fullName ||
    otherMember?.displayName ||
    otherMember?.fullName ||
    selectedRoom.roomName
  const avatarUrl = mentorProfile?.user?.avatarUrl || otherMember?.avatarUrl
  const skillChips = buildSkillChips(mentorProfile)

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#f7f8fe]">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[#10164a]">
              {mentorProfile ? 'Mentor details' : 'Room details'}
            </h2>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#52608b] hover:bg-indigo-50 hover:text-indigo-700"
                title="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <ChevronUp className="h-4 w-4 text-[#52608b]" />
            )}
          </div>

          <div className="mt-4 text-center">
            <div className="relative mx-auto h-[86px] w-[86px]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white">
                  {getInitials(displayName)}
                </div>
              )}
              {otherMember?.isOnline && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <h3 className="truncate text-[17px] font-bold text-[#10164a]">{displayName}</h3>
              {mentorProfile?.isFeatured && (
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600">Top Mentor</span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-[#52608b]">
              {mentorProfile?.headline || otherMember?.memberRole?.replace(/_/g, ' ') || formatRoomType(selectedRoom.roomType)}
            </p>

            {isProfileLoading ? (
              <div className="mx-auto mt-4 h-4 w-40 animate-pulse rounded-full bg-slate-100" />
            ) : mentorProfile ? (
              <>
                <div className="mt-3 flex items-center justify-center gap-1 text-[13px] text-[#52608b]">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-[#10164a]">{mentorProfile.averageRating?.toFixed(1) || 'N/A'}</span>
                  <span>({mentorProfile.totalReviews} reviews)</span>
                </div>

                {skillChips.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {skillChips.map((chip) => (
                      <span key={chip} className="rounded-lg bg-[#f0f2ff] px-2.5 py-1 text-[11px] font-medium text-[#25305f]">
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <Link
                    to={`/mentors/${mentorProfile.userId}`}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-[13px] font-bold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Book session
                  </Link>
                  <Link
                    to={`/mentors/${mentorProfile.userId}`}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#dce2f2] bg-white px-4 text-[13px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
                  >
                    View profile
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg bg-[#f7f8fe] px-3 py-3 text-[13px] text-[#66729d]">
                This conversation is using room-level context.
              </div>
            )}
          </div>
        </section>

        {/* Job Details Section */}
        {(linkedJob || isLinkedJobLoading) && (
          <section className="rounded-lg border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-[14px] font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-emerald-600" />
                </span>
                Thông tin Job
              </h3>
              {linkedJob && (
                <Link to={`/jobs/${linkedJob.jobId}`} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700">
                  Xem chi tiết
                </Link>
              )}
            </div>

            {isLinkedJobLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 w-3/4 bg-emerald-100/50 rounded-full" />
                <div className="h-3 w-1/2 bg-emerald-100/50 rounded-full" />
                <div className="h-8 w-full bg-emerald-100/50 rounded-lg mt-3" />
              </div>
            ) : linkedJob ? (
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2" title={linkedJob.title}>
                  {linkedJob.title}
                </h4>
                <p className="mt-1.5 text-[12px] text-slate-500 line-clamp-2">
                  {linkedJob.description}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-md p-2 border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">Budget</p>
                    <p className="text-[12px] font-black text-slate-900">
                      {linkedJob.budgetType === 'FIXED' 
                        ? formatCurrency(linkedJob.budgetMaxMxc || 0)
                        : formatCurrency(linkedJob.hourlyRateMxc || 0).replace(' MXC', ' MXC/hr')}
                    </p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">Deadline</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">
                      {linkedJob.deadlineAt ? new Date(linkedJob.deadlineAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {(linkedContract || isLinkedContractLoading) && (
          <section className="rounded-lg border border-indigo-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-[14px] font-bold text-[#10164a] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-indigo-600" />
                </span>
                Work status
              </h3>
            </div>

            {isLinkedContractLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                <div className="h-10 w-full bg-slate-100 rounded-xl" />
              </div>
            ) : linkedContract ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-50 px-3 py-3 border border-indigo-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Progress</p>
                      <p className="mt-1 text-[18px] font-black text-slate-900">{Math.max(0, Math.min(100, linkedContract.progressPercentage || 0))}%</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                      {formatContractStatus(linkedContract.status)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.max(0, Math.min(100, linkedContract.progressPercentage || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-md p-2 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Deadline</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">
                      {linkedContract.endDate ? new Date(linkedContract.endDate).toLocaleDateString('vi-VN') : linkedJob?.deadlineAt ? new Date(linkedJob.deadlineAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Escrow</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">
                      {linkedContract.fundsInEscrow ? formatCurrency(linkedContract.amountInEscrow || 0) : 'Released'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-3 border border-slate-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                    <p className="text-[12px] leading-5 text-slate-600">
                      {buildDeadlineHelper(linkedContract, linkedJob)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {(availabilitySummary.length > 0 || isAvailabilityLoading) && (
          <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14px] font-bold text-[#10164a]">Next availability</h3>
              {mentorProfile && (
                <Link to={`/mentors/${mentorProfile.userId}`} className="text-[12px] font-semibold text-indigo-600">
                  Reschedule
                </Link>
              )}
            </div>

            {isAvailabilityLoading ? (
              <div className="mt-3 space-y-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-4 animate-pulse rounded-full bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {availabilitySummary.slice(0, compact ? 2 : 3).map((entry) => (
                  <div key={entry} className="flex items-start gap-3 rounded-lg bg-[#f7f8fe] px-3 py-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-[13px] font-bold text-[#10164a]">Mentoring slot</p>
                      <p className="mt-1 text-[12px] text-[#52608b]">{entry}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Shared Images Section */}
        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[14px] font-bold text-[#10164a]">Ảnh & Video</h3>
            {sharedImages.length > 0 && <span className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">Xem tất cả</span>}
          </div>

          {sharedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {sharedImages.slice(0, 6).map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="aspect-square rounded-md overflow-hidden bg-slate-100 hover:opacity-80 transition-opacity">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <EmptySharedState label="Chưa có ảnh/video nào." />
          )}
        </section>

        {/* Shared Files Section */}
        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[14px] font-bold text-[#10164a]">Tài liệu</h3>
            {sharedFiles.length > 0 && <span className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">Xem tất cả</span>}
          </div>

          {sharedFiles.length > 0 ? (
            <div className="space-y-3">
              {sharedFiles.slice(0, compact ? 3 : 4).map((file) => (
                <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                  <FileBadge image={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#10164a]">{file.name}</span>
                    <span className="mt-0.5 block text-[11px] text-[#66729d]">
                      {formatRelativeTime(file.sentAt)}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <EmptySharedState label="Chưa có tài liệu nào." />
          )}
        </section>

        {/* Shared Links Section */}
        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[14px] font-bold text-[#10164a]">Link chia sẻ</h3>
            {sharedLinks.length > 0 && <span className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">Xem tất cả</span>}
          </div>
          
          {sharedLinks.length > 0 ? (
            <div className="space-y-3">
              {sharedLinks.slice(0, compact ? 3 : 4).map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <LinkIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#10164a]">{link.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#66729d]">
                      {link.host}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <EmptySharedState label="Chưa có link nào." />
          )}
        </section>

        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-bold text-[#10164a]">Recommended resources</h3>
            {mentorCourses.length > 0 && <span className="text-[12px] font-semibold text-indigo-600">View all</span>}
          </div>

          {isCoursesLoading ? (
            <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-100" />
          ) : mentorCourses.length > 0 ? (
            <div className="mt-3 space-y-3">
              {mentorCourses.slice(0, compact ? 1 : 2).map((course) => (
                <Link key={course.courseId} to={`/courses/${course.courseId}`} className="flex gap-3">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="h-[72px] w-[72px] rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] font-bold text-[#10164a]">{course.title}</span>
                    <span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-[#66729d]">
                      {course.description || 'Mentor-created guide with practical examples.'}
                    </span>
                    <span className="mt-1 block text-[12px] font-medium text-[#52608b]">
                      {course.priceMxc ? formatCurrency(course.priceMxc) : 'Free'} - {course.totalLessons || 0} lessons
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptySharedState label="No mentor resources yet." />
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}

function FileBadge({ image }: { image?: boolean }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${image ? 'bg-blue-600' : 'bg-red-500'}`}>
      {image ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
    </span>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function buildSkillChips(mentorProfile?: MentorProfileResponse | null) {
  if (!mentorProfile) return []

  const headlineWords = (mentorProfile.headline || '')
    .split(/[\s,/+-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3)
    .slice(0, 4)

  return [...headlineWords, mentorProfile.availability ? formatAvailability(mentorProfile.availability) : 'Mentoring']
    .filter(Boolean)
    .slice(0, 6)
}

function formatAvailability(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatContractStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildDeadlineHelper(contract: ContractResponse, linkedJob?: JobResponse | null) {
  const rawDeadline = contract.endDate || linkedJob?.deadlineAt
  if (!rawDeadline) {
    return 'No deadline is set yet. Keep the chat focused on the next concrete delivery.'
  }

  const deadline = new Date(rawDeadline)
  const today = new Date()
  const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayDiff = Math.round((deadlineStart.getTime() - todayStart.getTime()) / 86400000)

  if (contract.status === 'COMPLETED') {
    return 'This job is already completed. Use the thread for follow-up notes or handoff details.'
  }

  if (dayDiff < 0) {
    const overdueDays = Math.abs(dayDiff)
    return `This delivery is overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}. Agree the next checkpoint in chat.`
  }

  if (dayDiff === 0) {
    return 'This delivery is due today. Keep updates tight and confirm the final handoff clearly.'
  }

  return `${dayDiff} day${dayDiff === 1 ? '' : 's'} left before the current deadline.`
}

function imageToFileLike(image: SharedImage) {
  return {
    id: image.id,
    url: image.url,
    name: image.name,
    sentAt: image.sentAt,
    meta: 'IMAGE',
    isImage: true,
  }
}

function fileToDocumentItem(file: SharedFile) {
  return {
    ...file,
    isImage: false,
  }
}
