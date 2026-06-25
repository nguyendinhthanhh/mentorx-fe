import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\HomePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Typography and color fixes
content = content.replace('text-[#1b2252]', 'text-gray-900')
content = content.replace('bg-[#1b2252]', 'bg-gray-900')
content = content.replace('text-slate-700', 'text-gray-800')
content = content.replace('text-slate-600', 'text-gray-700')
content = content.replace('text-slate-500', 'text-gray-600')
content = content.replace('text-slate-400', 'text-gray-500')
content = content.replace('text-slate-300', 'text-gray-400')

# Font weights (TopCV doesn't typically use extrabold/black for everything, mostly bold)
content = content.replace('font-extrabold', 'font-bold')
content = content.replace('font-black', 'font-bold')

# Line heights
content = content.replace('leading-relaxed', 'leading-[1.6]')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied TopCV typography to HomePage!")
