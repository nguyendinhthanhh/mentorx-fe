import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('  return (\n    <div className="mx-auto max-w-[1360px]')
end_idx = content.find('function IdentityCard', start_idx)
closing_idx = content.rfind('  )\n}', start_idx, end_idx)

if start_idx == -1 or end_idx == -1 or closing_idx == -1:
    print("Could not find boundaries")
    sys.exit(1)

new_return_block = """  return (
    <div className="bg-[#F8FAFC] min-h-screen text-gray-900 pb-20">
      {/* 1. Hero Cover Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* 2. Top Navigation (Breadcrumbs) placed absolutely overlapping the cover */}
        <div className="relative -mt-[160px] sm:-mt-[220px] mb-8 z-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="rounded-lg bg-black/30 backdrop-blur-md px-4 py-2 border border-white/10 shadow-sm">
              <Breadcrumbs
                items={[
                  { label: 'Trang chủ', to: '/' },
                  { label: 'Danh sách Mentor', to: '/mentors' },
                  { label: name },
                ]}
                className="text-white hover:text-indigo-200"
              />
            </div>
            {/* Removed the "Hồ sơ mentor công khai" badge as requested */}
          </div>
        </div>

        {/* 3. Main 2-Column Grid */}
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          
          {/* LEFT COLUMN: Avatar + IntroPanel + Main Content */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 pb-8 pt-6 sm:px-8">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-20 sm:-mt-24 mb-6 relative z-10">
                  <div className="relative shrink-0">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl border-[6px] border-white bg-white shadow-lg overflow-hidden">
                      {mentor.user?.avatarUrl ? (
                        <img src={mentor.user.avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-5xl font-black text-white">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {mentor.isVerified && (
                      <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-blue-500 text-white shadow-sm" title="Verified Mentor">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{name}</h1>
                    <p className="mt-2 text-lg sm:text-xl font-bold text-gray-600">{title}</p>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                      {mentor.averageRating > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span>{mentor.averageRating.toFixed(1)}</span>
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
                        <div className="grid gap-5 lg:grid-cols-2">
                          {sortPackages(packages).slice(0, 4).map((item) => (
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
             <aside className="sticky top-24 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
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
             </aside>
          </div>
        </div>
      </div>
    </div>
  )"""

content = content[:start_idx] + new_return_block + "\n" + content[closing_idx+6:]

# Check if `Eye` icon is imported from lucide-react. If not, add it.
if "Eye," not in content and " Eye " not in content:
    # We will just append it to lucide-react import
    content = content.replace("import {", "import { Eye,", 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Redesigned MentorPublicProfilePage successfully!")
