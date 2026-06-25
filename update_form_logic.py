import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add coverUrl and avatarUrl to schema
schema_pattern = r"(cvUrl: z\.string\(\)\.optional\(\),)"
content = re.sub(schema_pattern, r"avatarUrl: z.string().optional(),\n    coverUrl: z.string().optional(),\n    \1", content)

# 2. Add defaultValues
defaults_pattern = r"(cvUrl: initialData\?\.cvUrl \|\| '',)"
content = re.sub(defaults_pattern, r"avatarUrl: initialData?.user?.avatarUrl || '',\n      coverUrl: initialData?.coverUrl || '',\n      \1", content)

# 3. Add userApi import if not present
if "import { userApi }" not in content:
    content = content.replace("import { mentorApi }", "import { mentorApi }\nimport { userApi }")

# 4. Update onSubmit logic
submit_pattern = r"(const mappedLocation =.*?)(await onSaved\(\{.*?\}\))"
# We need to insert userApi call before onSaved
new_submit_logic = r"""\1
      if (data.avatarUrl !== initialData?.user?.avatarUrl) {
        try {
          await userApi.updateUser(userId, { avatarUrl: data.avatarUrl })
          await refreshUser()
        } catch (e) {
          console.error('Failed to update avatar', e)
        }
      }

      \2"""
content = re.sub(submit_pattern, new_submit_logic, content, flags=re.DOTALL)

# Also we need to make sure coverUrl is mapped in onSaved
# The mapped payload looks like:
# await onSaved({
#   headline: data.headline,
#   ...
#   cvUrl: data.cvUrl,

# find where cvUrl is mapped and add coverUrl
mapping_pattern = r"(cvUrl: data\.cvUrl,)"
content = re.sub(mapping_pattern, r"coverUrl: data.coverUrl,\n        \1", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated MentorProfileForm.tsx schema and submit logic")
