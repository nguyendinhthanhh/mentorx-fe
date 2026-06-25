import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Darken the specific custom hex color used for headers and values
content = content.replace('text-[#1b2252]', 'text-gray-900')
content = content.replace('text-slate-800', 'text-gray-900')
content = content.replace('text-slate-700', 'text-gray-800')
content = content.replace('text-slate-600', 'text-gray-700')
content = content.replace('text-slate-500', 'text-gray-600')

# 2. Fix the body description block to be highly readable like TopCV
# TopCV uses font size ~14px-15px, pure dark gray, line-height ~1.6
content = content.replace(
    'prose prose-slate max-w-none',
    'max-w-none' # Removing prose so it doesn't override our custom text colors
)
content = content.replace(
    'whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800', # Wait, text-slate-700 was replaced by text-gray-800 above
    'whitespace-pre-wrap text-[15px] leading-[1.6] text-gray-800 font-medium'
)
# If the text-slate-700 wasn't exactly that string:
content = content.replace(
    'leading-relaxed text-gray-800',
    'leading-[1.7] text-gray-800'
)

# 3. For the Job Title, let's make sure it's bold and dark
# Currently it's `mb-4 text-xl font-bold leading-tight text-gray-900 sm:text-[22px]`
# Let's make it slightly bolder (font-extrabold or keep font-bold but ensure it's gray-900)
# TopCV job titles are usually very crisp.
content = content.replace(
    'mb-4 text-xl font-bold leading-tight text-gray-900 sm:text-[22px]',
    'mb-4 text-2xl font-bold leading-snug text-gray-900'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Darkened fonts for better readability!")
