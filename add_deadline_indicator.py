import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobListPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

helpers = """
function getTimeRemaining(deadlineAt: string | undefined | null) {
  if (!deadlineAt) return 'Không giới hạn';
  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Đã hết hạn';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `Còn ${days} ngày`;
  if (hours > 0) return `Còn ${hours} giờ`;
  return `Sắp hết hạn`;
}

function JobCard"""

# Add the helper function
content = content.replace("function JobCard", helpers)

# Update how the deadline is calculated and rendered
# Current:
# const deadline = job.deadlineAt ? formatDeadline(job.deadlineAt) : t('common.noDeadline')
content = content.replace(
    "const deadline = job.deadlineAt ? formatDeadline(job.deadlineAt) : t('common.noDeadline')",
    "const timeRemaining = getTimeRemaining(job.deadlineAt)"
)

# Current render block:
#            <div className="flex items-center gap-5 text-[14px] text-slate-500 font-medium">
#               <div className="flex items-center gap-1.5">
#                 <Timer className="h-4 w-4 text-slate-400" />
#                 <span>Hạn: <span className="text-slate-700 font-semibold">{deadline}</span></span>
#               </div>
#            </div>

new_render_block = """
            <div className="flex items-center gap-5 text-[14px] text-slate-500 font-medium">
               <div className="flex items-center gap-1.5">
                 <Timer className="h-4 w-4 text-slate-400" />
                 Hạn: 
                 <span className={`px-2 py-0.5 rounded text-[12px] font-bold border ${
                    timeRemaining === 'Đã hết hạn'
                      ? 'text-rose-600 bg-rose-50 border-rose-200'
                      : 'text-[#00b14f] bg-green-50 border-green-100'
                 }`}>
                    {timeRemaining}
                 </span>
               </div>
            </div>
"""

old_render_regex = r'<div className="flex items-center gap-5 text-\[14px\] text-slate-500 font-medium">\s*<div className="flex items-center gap-1\.5">\s*<Timer className="h-4 w-4 text-slate-400" />\s*<span>Hạn: <span className="text-slate-700 font-semibold">\{deadline\}</span></span>\s*</div>\s*</div>'

content = re.sub(
    old_render_regex,
    new_render_block.strip(),
    content,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added deadline indicator to JobListPage!")
