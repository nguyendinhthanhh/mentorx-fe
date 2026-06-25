import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I need to replace the Actions section in the TOP HEADER CARD.
# Here is what's currently in the file:
#             {/* Actions */}
#             <div className="flex gap-4">
# ...
#             <div className="mt-4 flex gap-4">
#               <button onClick={copyLink} className="text-[14px] text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5">
#                 <Share2 className="h-4 w-4" />
#                 {copied ? 'Đã copy link!' : 'Chia sẻ công việc này'}
#               </button>
#             </div>

actions_start = "{/* Actions */}"
actions_end = "</div>\n        </div>\n\n        \n          \n          <div className=\"h-full\">"

a_start_idx = content.find(actions_start)
a_end_idx = content.find("</div>\n        </div>\n\n        \n          \n          <div className=\"h-full\">")

if a_start_idx == -1 or a_end_idx == -1:
    # Try finding slightly different ending
    a_end_idx = content.find("</div>\n        </div>\n\n", a_start_idx)
    if a_start_idx == -1 or a_end_idx == -1:
        print("Could not find Actions block.")
        sys.exit(1)

new_actions = """{/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {!isOwner && canApply && !existingProposal ? (
                <>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex h-[46px] flex-1 min-w-[200px] items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" /> Ứng tuyển ngay
                  </button>
                  <button
                    onClick={toggleSaved}
                    className={`flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] font-bold transition-colors ${
                      saved
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {saved ? 'Đã lưu' : 'Lưu tin'}
                  </button>
                </>
              ) : isOwner ? (
                <div className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50 px-6 py-3">
                  <p className="font-bold text-indigo-700 text-center">Job của bạn (Quản lý tại cột bên phải)</p>
                </div>
              ) : existingProposal ? (
                <div className="flex-1 rounded-lg border border-emerald-100 bg-emerald-50 px-6 py-3">
                  <p className="flex items-center justify-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Đã ứng tuyển ({getProposalStatusLabel(existingProposal.status)})
                  </p>
                </div>
              ) : shouldPromptMentorAccess ? (
                <Link
                  to="/become-mentor"
                  className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Đăng ký Mentor
                </Link>
              ) : null}
              
              <button 
                onClick={copyLink} 
                className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 text-[15px] font-bold text-slate-700 transition hover:bg-slate-200 hover:text-indigo-600"
              >
                <Share2 className="h-4 w-4" />
                {copied ? 'Đã copy!' : 'Chia sẻ'}
              </button>
            </div>
          </div>"""

# Replace the content
content = content[:a_start_idx] + new_actions + content[a_end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Action Buttons Layout!")
