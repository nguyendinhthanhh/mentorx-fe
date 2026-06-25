import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I need to inject `const timeRemaining = getTimeRemaining(job.deadlineAt)` into the JobDetailPage render block.
# Wait, I can just compute it inline or inside the component.
# Let's see the JSX block directly.
# Currently:
# <div className="mb-6 text-[15px] text-gray-700">
#    Hạn nhận đề xuất: <span className="font-medium text-[#00b14f] bg-green-50 px-2 py-1 rounded-md border border-green-100">{getTimeRemaining(job.deadlineAt)}</span>
# </div>

new_deadline_block = """
            {/* Deadline */}
            <div className="mb-6 flex items-center gap-2 text-[15px] text-gray-700">
               Hạn nhận đề xuất: 
               <span className={`font-bold px-2 py-1 rounded-md border ${
                  getTimeRemaining(job.deadlineAt) === 'Đã hết hạn'
                    ? 'text-rose-600 bg-rose-50 border-rose-200'
                    : 'text-[#00b14f] bg-green-50 border-green-100'
               }`}>
                  {getTimeRemaining(job.deadlineAt)}
               </span>
            </div>
"""

# I need to carefully replace the exact block.
old_block_regex = r'<div className="mb-6 text-\[15px\] text-gray-700">\s*Hạn nhận đề xuất: <span className="[^"]+">\{getTimeRemaining\(job\.deadlineAt\)\}</span>\s*</div>'

content = re.sub(
    old_block_regex,
    new_deadline_block.strip(),
    content,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed alignment and color logic!")
