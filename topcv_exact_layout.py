import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will write a regex to replace the entire TOP HEADER CARD and the MAIN/SIDEBAR structure.
# But regex can be fragile for such large blocks.
# Let's find the specific block starting from `{/* TOP HEADER CARD (TopCV Style) */}` to the end of it.
import sys

# Replace the TOP HEADER CARD
header_start_marker = "{/* TOP HEADER CARD (TopCV Style) */}"
header_end_marker = '<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">'

header_start_idx = content.find(header_start_marker)
header_end_idx = content.find(header_end_marker)

if header_start_idx == -1 or header_end_idx == -1:
    print("Could not find header markers.")
    sys.exit(1)

new_header = """{/* TOP HEADER CARD (TopCV Style) */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* "Logo" / Avatar */}
            <div className="hidden md:flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 shadow-sm">
              <Briefcase className="h-10 w-10 text-slate-300" />
            </div>

            <div className="flex-1 w-full">
              <h1 className="mb-2 text-2xl font-bold leading-tight text-[#1b2252] sm:text-[26px]">
                {job.title}
              </h1>
              <h2 className="mb-6 text-[15px] font-bold uppercase text-slate-500">
                {clientName}
              </h2>

              {/* TopCV Key Stats Row */}
              <div className="mb-2 flex flex-wrap gap-y-4 gap-x-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-500">Ngân sách</p>
                    <p className="text-[15px] font-bold text-[#1b2252]">{derived.budget}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-500">Hình thức</p>
                    <p className="text-[15px] font-bold text-[#1b2252]">{derived.jobTypeLabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-500">Cấp bậc</p>
                    <p className="text-[15px] font-bold text-[#1b2252]">{derived.experienceLevelLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full shrink-0 md:w-[240px] flex flex-col gap-3">
              {!isOwner && canApply && !existingProposal ? (
                <>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" /> Ứng tuyển ngay
                  </button>
                  <button
                    onClick={toggleSaved}
                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-[15px] font-bold transition-colors ${
                      saved
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-[#4f46e5] text-[#4f46e5] hover:bg-indigo-50'
                    }`}
                  >
                    {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {saved ? 'Đã lưu' : 'Lưu tin'}
                  </button>
                </>
              ) : isOwner ? (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
                  <p className="font-bold text-indigo-700">Job của bạn</p>
                  <p className="mt-1 text-sm text-indigo-600/80">Quản lý tại cột bên phải</p>
                </div>
              ) : existingProposal ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <p className="flex items-center justify-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Đã ứng tuyển
                  </p>
                  <p className="mt-1 text-sm text-emerald-600/80">{getProposalStatusLabel(existingProposal.status)}</p>
                </div>
              ) : shouldPromptMentorAccess ? (
                <Link
                  to="/become-mentor"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Đăng ký Mentor
                </Link>
              ) : null}
              
              <button onClick={copyLink} className="mt-2 text-[13px] font-medium text-slate-500 hover:text-indigo-600 text-center w-full">
                {copied ? 'Đã copy link!' : 'Chia sẻ công việc này'}
              </button>
            </div>
          </div>
        </div>

        """

content = content[:header_start_idx] + new_header + content[header_end_idx:]

# Next, let's fix the "Chi tiết công việc" card to match TopCV (border left on header)
# Wait, I already have `border-l-4 border-indigo-500 pl-3` for the headers. TopCV actually uses:
# "Chi tiết tin tuyển dụng"
# Then inside: "Mô tả công việc", "Yêu cầu ứng viên", "Quyền lợi".
# I'll modify the text from "Chi tiết công việc" to "Chi tiết tin tuyển dụng"
content = content.replace('>Chi tiết công việc<', '>Chi tiết tin tuyển dụng<')
content = content.replace('>Yêu cầu ứng viên<', '>Yêu cầu ứng viên<') # already there

# For the Sidebar, let's change "Thông tin chung" to match TopCV.
# TopCV sidebar just has "Thông tin chung" with Deadline, Level, JobType etc.
# Since Budget, JobType, and Level are in the header now, the sidebar can keep Deadline and Categories.
# Let's rebuild the Sidebar "Thông tin chung"
sidebar_general_start = "{/* THÔNG TIN CHUNG CARD */}"
sidebar_general_end = "{/* Client Info Card */}"

sg_start_idx = content.find(sidebar_general_start)
sg_end_idx = content.find(sidebar_general_end)

if sg_start_idx != -1 and sg_end_idx != -1:
    new_sidebar_general = """{/* THÔNG TIN CHUNG CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
               <h3 className="mb-5 text-lg font-bold text-[#1b2252] border-b border-slate-100 pb-3">Thông tin chung</h3>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-medium text-slate-500">Hạn nộp</p>
                        <p className="text-[14px] font-bold text-[#1b2252]">{derived.deadline}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Briefcase className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-medium text-slate-500">Lĩnh vực</p>
                        <p className="text-[14px] font-bold text-[#1b2252]">{derived.categoryName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <MessageSquare className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-medium text-slate-500">Lượt ứng tuyển</p>
                        <p className="text-[14px] font-bold text-[#1b2252]">{proposalCount}</p>
                     </div>
                  </div>
               </div>
            </div>

            """
    content = content[:sg_start_idx] + new_sidebar_general + content[sg_end_idx:]


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("TopCV accurate layout applied!")
