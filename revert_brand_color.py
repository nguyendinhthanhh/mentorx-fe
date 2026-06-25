import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Reverse the replacements made in change_brand_color.py
content = content.replace('#00b14f', '#4f46e5')
content = content.replace('hover:bg-[#009643]', 'hover:bg-indigo-700')
content = content.replace('bg-[#00b14f]', 'bg-indigo-600')
content = content.replace('text-[#00b14f]', 'text-indigo-600')
content = content.replace('border-[#00b14f]', 'border-indigo-500')
content = content.replace('bg-emerald-50', 'bg-indigo-50')
content = content.replace('bg-emerald-100', 'bg-indigo-100')
content = content.replace('border-emerald-100', 'border-indigo-100')
content = content.replace('border-emerald-200', 'border-indigo-200')
content = content.replace('text-[#009643]', 'text-indigo-700')
content = content.replace('text-[#007b36]', 'text-indigo-800')
content = content.replace('hover:text-[#00b14f]', 'hover:text-indigo-600')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Reverted brand color back to homepage's Indigo (#4f46e5)!")
