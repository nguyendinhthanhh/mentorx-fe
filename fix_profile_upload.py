import sys

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: handleImageUpload
old_upload = "const response = await fileApi.upload(file, { subDirectory: fieldName === 'avatarUrl' ? FILE_UPLOAD_DIRS.PUBLIC_AVATAR : FILE_UPLOAD_DIRS.PUBLIC_COVER })"
new_upload = "const response = await fileApi.uploadCourseMedia(file, fieldName === 'avatarUrl' ? 'mentorx/avatars' : 'mentorx/covers')"
if old_upload in content:
    content = content.replace(old_upload, new_upload)
else:
    print("Warning: old_upload not found")

# Fix 2: payload coverUrl
old_payload = """        certificateUrl: data.certificateUrl || undefined,
        mentorAgreementAccepted: data.mentorAgreementAccepted,"""
new_payload = """        certificateUrl: data.certificateUrl || undefined,
        coverUrl: data.coverUrl || undefined,
        mentorAgreementAccepted: data.mentorAgreementAccepted,"""
if old_payload in content:
    content = content.replace(old_payload, new_payload)
else:
    print("Warning: old_payload not found")

# Fix 3: userApi call
old_submit = """      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }

      await refreshUser()"""
new_submit = """      if (isEdit) {
        await mentorApi.updateMentorProfile(userId, payload)
      } else {
        await mentorApi.createMentorProfile(userId, payload)
      }

      if (data.avatarUrl) {
        await userApi.updateUser(userId, { avatarUrl: data.avatarUrl })
      }

      await refreshUser()"""
if old_submit in content:
    content = content.replace(old_submit, new_submit)
else:
    print("Warning: old_submit not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed MentorProfileForm.tsx")
