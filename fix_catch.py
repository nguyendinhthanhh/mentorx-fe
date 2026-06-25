import sys

file_path = r"d:\Mentor X\mentorx-fe\scripts\seedMentors.mjs"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("err.response && err.response.status === 400 && err.response.data?.message?.includes('already exists')", "err.response && err.response.data?.message?.includes('already exists')")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed catch block")
