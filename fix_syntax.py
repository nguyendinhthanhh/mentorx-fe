import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("}   Eye,\n}", "}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed syntax error")
