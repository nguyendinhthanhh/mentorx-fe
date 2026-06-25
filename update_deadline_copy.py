import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace in Top Header
content = content.replace(
    'Hạn nộp hồ sơ:',
    'Hạn nhận đề xuất:'
)

# Replace in Sidebar
content = content.replace(
    '<p className="text-[13px] font-medium text-gray-600">Hạn nộp</p>',
    '<p className="text-[13px] font-medium text-gray-600">Hạn nhận đề xuất</p>'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated deadline copy!")
