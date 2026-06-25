import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the specific class names of those 3 buttons.
# 1. "Ứng tuyển ngay" button:
# Current: className="flex h-[46px] flex-1 min-w-[200px] items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
# Target: h-[40px] flex-1 min-w-[160px] ... px-5 text-[14px]
content = content.replace(
    'className="flex h-[46px] flex-1 min-w-[200px] items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"',
    'className="flex h-[40px] flex-1 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-5 text-[14px] font-bold text-white shadow-sm transition hover:bg-indigo-700"'
)

# 2. "Lưu tin" button:
# Current: className={`flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] font-bold transition-colors ${
# Target: h-[40px] ... px-4 text-[14px]
content = content.replace(
    'className={`flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] font-bold transition-colors ${',
    'className={`flex h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-[14px] font-bold transition-colors ${'
)

# 3. "Chia sẻ" button:
# Current: className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 text-[15px] font-bold text-slate-700 transition hover:bg-slate-200 hover:text-indigo-600"
# Target: h-[40px] ... px-4 text-[14px]
content = content.replace(
    'className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 text-[15px] font-bold text-slate-700 transition hover:bg-slate-200 hover:text-indigo-600"',
    'className="flex h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-[14px] font-bold text-gray-700 transition hover:bg-slate-200 hover:text-indigo-600"'
)

# 4. "Đăng ký Mentor" button (just in case they see this instead of Apply):
# Current: className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
# Target: h-[40px] text-[14px]
content = content.replace(
    'className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"',
    'className="flex h-[40px] flex-1 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-5 text-[14px] font-bold text-white shadow-sm transition hover:bg-indigo-700"'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Button sizes reduced!")
