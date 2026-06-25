import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

header_start_marker = "{/* TOP HEADER CARD (TopCV Style) */}"
header_end_marker = '<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">'

header_start_idx = content.find(header_start_marker)
header_end_idx = content.find(header_end_marker)

if header_start_idx == -1 or header_end_idx == -1:
    print("Could not find header markers.")
    sys.exit(1)

new_header = """{/* TOP HEADER CARD (TopCV Style) */}
        <div className="mb-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            
            {/* Title */}
            <h1 className="mb-4 text-xl font-bold leading-tight text-[#1b2252] sm:text-[22px]">
              {job.title}
            </h1>

            {/* TopCV Key Stats Row (3 columns) */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[14px] text-slate-500 mb-0.5">Ngân sách</p>
                  <p className="text-[15px] font-bold text-[#1b2252]">{derived.budget}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white">
                  <Layers3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[14px] text-slate-500 mb-0.5">Hình thức</p>
                  <p className="text-[15px] font-bold text-[#1b2252]">{derived.jobTypeLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[14px] text-slate-500 mb-0.5">Cấp bậc</p>
                  <p className="text-[15px] font-bold text-[#1b2252]">{derived.experienceLevelLabel}</p>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="mb-6 text-[15px] text-slate-600">
               Hạn nộp hồ sơ: <span className="font-medium text-[#1b2252]">{derived.deadline}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {!isOwner && canApply && !existingProposal ? (
                <>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" /> Ứng tuyển ngay
                  </button>
                  <button
                    onClick={toggleSaved}
                    className={`flex h-[46px] w-[140px] items-center justify-center gap-2 rounded border text-[15px] font-bold transition-colors ${
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
                <div className="rounded border border-indigo-100 bg-indigo-50 px-6 py-3">
                  <p className="font-bold text-indigo-700">Job của bạn (Quản lý tại cột bên phải)</p>
                </div>
              ) : existingProposal ? (
                <div className="rounded border border-emerald-100 bg-emerald-50 px-6 py-3">
                  <p className="flex items-center justify-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Đã ứng tuyển ({getProposalStatusLabel(existingProposal.status)})
                  </p>
                </div>
              ) : shouldPromptMentorAccess ? (
                <Link
                  to="/become-mentor"
                  className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Đăng ký Mentor
                </Link>
              ) : null}
            </div>
            
            <div className="mt-4 flex gap-4">
              <button onClick={copyLink} className="text-[14px] text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5">
                <Share2 className="h-4 w-4" />
                {copied ? 'Đã copy link!' : 'Chia sẻ công việc này'}
              </button>
            </div>
            
          </div>
        </div>

        """

content = content[:header_start_idx] + new_header + content[header_end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Matched exact TopCV screenshot layout!")
