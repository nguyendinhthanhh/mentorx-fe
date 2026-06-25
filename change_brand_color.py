import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace all hardcoded #4f46e5 (Indigo 600) with #00b14f (TopCV Green)
content = content.replace('#4f46e5', '#00b14f')

# Replace hover colors for the apply button
# It was hover:bg-indigo-700
content = content.replace('hover:bg-indigo-700', 'hover:bg-[#009643]')
content = content.replace('bg-indigo-600', 'bg-[#00b14f]')
content = content.replace('text-indigo-600', 'text-[#00b14f]')
content = content.replace('border-indigo-500', 'border-[#00b14f]')

# Replace background tints
content = content.replace('bg-indigo-50', 'bg-emerald-50')
content = content.replace('bg-indigo-100', 'bg-emerald-100')
content = content.replace('border-indigo-100', 'border-emerald-100')
content = content.replace('border-indigo-200', 'border-emerald-200')
content = content.replace('text-indigo-700', 'text-[#009643]')
content = content.replace('text-indigo-800', 'text-[#007b36]')
content = content.replace('text-indigo-500', 'text-[#00b14f]')
content = content.replace('hover:text-indigo-600', 'hover:text-[#00b14f]')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changed brand color to TopCV green!")
