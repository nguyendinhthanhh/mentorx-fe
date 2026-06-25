import re
import sys

# 1. Update JobDetailPage.tsx
file_path_detail = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path_detail, "r", encoding="utf-8") as f:
    content_detail = f.read()

# Replace Top Header label
content_detail = content_detail.replace('Hạn nhận đề xuất:', 'Cần hoàn thành trước:')

# Replace Sidebar label
content_detail = content_detail.replace('Hạn nhận đề xuất</p>', 'Thời hạn hoàn thành</p>')

with open(file_path_detail, "w", encoding="utf-8") as f:
    f.write(content_detail)

# 2. Update JobListPage.tsx
file_path_list = r"d:\Mentor X\mentorx-fe\src\pages\job\JobListPage.tsx"

with open(file_path_list, "r", encoding="utf-8") as f:
    content_list = f.read()

content_list = content_list.replace('Hạn:', 'Hoàn thành trước:')

with open(file_path_list, "w", encoding="utf-8") as f:
    f.write(content_list)

print("Updated deadline labels!")
