import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  ChevronUp,
  FileImage,
  FileText,
  Link as LinkIcon,
  Star,
  X,
} from 'lucide-react'
import { ChatRoomMemberSummary, ChatRoomResponse, CourseResponse, MentorProfileResponse } from '@/types'
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
  const sharedDocuments = [...sharedFiles.map(fileToDocumentItem), ...sharedImages.map(imageToFileLike)]

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

        <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-bold text-[#10164a]">Shared files</h3>
            {sharedDocuments.length > 0 && <span className="text-[12px] font-semibold text-indigo-600">View all</span>}
          </div>

          {sharedDocuments.length > 0 ? (
            <div className="mt-3 space-y-3">
              {sharedDocuments.slice(0, compact ? 3 : 4).map((file) => (
                <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex items-start gap-3">
                  <FileBadge image={file.isImage} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#10164a]">{file.name}</span>
                    <span className="mt-0.5 block text-[12px] text-[#66729d]">
                      {file.meta} - {formatRelativeTime(file.sentAt)}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptySharedState label="No files shared yet." />
            </div>
          )}
        </section>

        {sharedLinks.length > 0 && (
          <section className="rounded-lg border border-[#dce2f2] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14px] font-bold text-[#10164a]">Links</h3>
              <span className="text-[12px] font-semibold text-indigo-600">View all</span>
            </div>
            <div className="mt-3 space-y-3">
              {sharedLinks.slice(0, compact ? 3 : 4).map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f2ff] text-indigo-600">
                    <LinkIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#10164a]">{link.label}</span>
                    <span className="mt-0.5 block text-[12px] text-[#66729d]">
                      {link.host} - {formatRelativeTime(link.sentAt)}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

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
