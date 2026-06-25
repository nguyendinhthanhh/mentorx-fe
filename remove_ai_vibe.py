import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove background meshes
content = re.sub(
    r'<div className="absolute top-\[-10%\] right-\[-10%\].*?pointer-events-none"></div>',
    '',
    content,
    flags=re.DOTALL
)
content = re.sub(
    r'<div className="absolute top-\[30%\] left-\[-5%\].*?pointer-events-none"></div>',
    '',
    content,
    flags=re.DOTALL
)

# 2. Tone down the "glassmorphism" to solid professional cards (TopCV style)
# Instead of `bg-white/80 backdrop-blur-xl border-white/60`, use `bg-white border-slate-200`
content = content.replace(
    'bg-white/80 backdrop-blur-xl border border-white/60',
    'bg-white border border-slate-200'
)
content = content.replace(
    'bg-white/70 backdrop-blur-xl border border-white/60',
    'bg-white border border-slate-200'
)
content = content.replace(
    'bg-white/60 backdrop-blur-xl border border-white/50',
    'bg-white border border-slate-200'
)
content = content.replace(
    'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    'shadow-sm'
)

# 3. Remove glowing orbs inside cards
content = re.sub(
    r'<div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br.*?pointer-events-none"></div>',
    '',
    content,
    flags=re.DOTALL
)

# 4. Simplify the main layout background
content = content.replace(
    'bg-[#f7f8fc]',
    'bg-[#f3f5f7]' # TopCV usually uses a very standard light gray
)

# 5. Simplify buttons if they are too gradient-heavy
# The primary button: bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] -> flat solid color
content = content.replace(
    'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-6 py-4 text-[16px] font-black text-white shadow-md transition-all hover:from-[#4338ca] hover:to-[#6d28d9] hover:shadow-[0_4px_20px_rgb(79,70,229,0.3)] hover:-translate-y-0.5',
    'bg-indigo-600 px-6 py-3 text-[16px] font-bold text-white shadow-sm transition hover:bg-indigo-700'
)
content = content.replace(
    'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-4 text-sm font-black text-white shadow-sm hover:from-[#4338ca] hover:to-[#6d28d9]',
    'bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700'
)

# 6. Make border colors more subtle
content = content.replace('border-l-4 border-indigo-500', '')
content = content.replace('border-l-4 border-purple-500', '')
content = content.replace('border-l-4 border-blue-500', '')
content = content.replace('border-l-4 border-sky-500', '')

# Make titles professional without the thick left borders, maybe just solid text color
content = content.replace('font-black text-[#1b2252]', 'font-bold text-[#1b2252]')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Removed AI vibe!")
