import sys

file_path = r"d:\Mentor X\mentorx-fe\scripts\seedMentors.mjs"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("fullName: mentor.fullName,", "firstName: mentor.fullName.split(' ')[0],\n          lastName: mentor.fullName.split(' ')[1],")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed seedMentors.mjs")
