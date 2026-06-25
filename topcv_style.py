import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Container width & Background
content = content.replace('max-w-[1400px]', 'max-w-6xl')

# 2. Border radius
content = content.replace('rounded-[24px]', 'rounded-xl')
content = content.replace('rounded-[20px]', 'rounded-xl')

# 3. Glassmorphism to Solid White Cards
content = content.replace('backdrop-blur-xl', '')
content = content.replace('bg-white/80', 'bg-white')
content = content.replace('bg-white/70', 'bg-white')
content = content.replace('bg-white/60', 'bg-white')
content = content.replace('border-white/60', 'border-slate-200')
content = content.replace('border-white/50', 'border-slate-200')

# 4. Top Header Typography & Layout
content = content.replace('text-[28px] font-black', 'text-2xl font-bold')
content = content.replace('sm:text-[36px]', 'sm:text-3xl')

# 5. Fix the sidebar "Thông tin chung" icons
# Replace big colored circles with just simple small circles or direct icons
content = content.replace('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600', 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#4f46e5]')
content = content.replace('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600', 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#4f46e5]')
content = content.replace('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600', 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#4f46e5]')
content = content.replace('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600', 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#4f46e5]')

# Sidebar headers
content = content.replace('text-[18px] font-bold text-[#1b2252]', 'text-lg font-bold text-[#1b2252] border-b border-slate-100 pb-3')

# Main Column headers
content = content.replace('text-[20px] font-bold text-[#1b2252]', 'text-xl font-bold text-[#1b2252] border-l-4 border-[#4f46e5] pl-3')
content = content.replace('  pl-3', '') # clean up previous replacement if it had pl-3
content = content.replace('border-l-4 border-[#4f46e5] pl-3', 'border-l-4 border-[#4f46e5] pl-3')

# Write back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("TopCV professional style applied!")
