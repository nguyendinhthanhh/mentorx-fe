import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Soften the border radius
# Change rounded-xl to rounded-2xl for main cards to make them less square
content = content.replace('rounded-xl border border-slate-200', 'rounded-2xl border border-slate-200')
content = content.replace('rounded-xl bg-white p-6 shadow-2xl', 'rounded-2xl bg-white p-6 shadow-2xl') # Modals

# 2. Unify the colors (Remove the "AI rainbow" palette)
# Sidebar general info icons: currently they are all `bg-slate-100 text-[#4f46e5]`, wait, in the previous script I actually did:
# content = content.replace('flex h-11 w-11 ... rounded-full bg-emerald-50 text-emerald-600', 'flex h-10 w-10 ... text-[#4f46e5]')
# Let's double check what colors are still there. 
# There's a section: "Kỹ năng bắt buộc" with Tags icon
content = content.replace('text-purple-500', 'text-indigo-500')
content = content.replace('bg-purple-50/80', 'bg-slate-50')
content = content.replace('border-purple-100', 'border-slate-200')
content = content.replace('text-purple-700', 'text-slate-700')
content = content.replace('hover:bg-purple-100', 'hover:bg-slate-100')
content = content.replace('hover:text-purple-800', 'hover:text-indigo-600')

# Main Column headers left border
content = content.replace('border-l-4 border-[#4f46e5]', 'border-l-4 border-indigo-500')

# Client Info Card icon
content = content.replace('bg-gradient-to-br from-indigo-100 to-indigo-50 text-xl font-black text-[#4f46e5] shadow-inner', 'bg-slate-100 text-xl font-bold text-slate-700')

# AI Assistant Callout
content = content.replace('bg-gradient-to-br from-indigo-50 to-white', 'bg-slate-50')
content = content.replace('ring-1 ring-indigo-100/50', 'border border-slate-200')
content = content.replace('bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white', 'bg-indigo-100 text-indigo-600')
content = content.replace('text-[#1b2252]', 'text-slate-800')

# Top header
content = content.replace('bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700', 'bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-700')

# Clean up any remaining emerald/amber/rose in the text or backgrounds (except for status badges)
# Status tags in job contract might need to stay green/amber for semantic reasons, but let's check.
# "Escrow secured" uses emerald-50 and emerald-900, which is fine for money.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Colors unified and borders softened!")
