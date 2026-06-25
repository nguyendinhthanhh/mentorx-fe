import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Current grid definition:
# <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
# Let's change it to 420px for the right column.

content = content.replace(
    'className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"',
    'className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Adjusted column widths!")
