import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the bad handleImageUpload block completely
start = content.find('const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>')
if start != -1:
    end = content.find('return (', start)
    content = content[:start] + content[end:]

# 2. Define the correct handleImageUpload
correct_upload = """
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'avatarUrl' | 'coverUrl') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!allowedMimeTypes.has(file.type)) {
      setError('Invalid file type for ' + fieldName)
      return
    }

    try {
      setUploading((prev) => ({ ...prev, [fieldName]: true }))
      setError('')
      const response = await fileApi.upload(file, { subDirectory: fieldName === 'avatarUrl' ? FILE_UPLOAD_DIRS.PUBLIC_AVATAR : FILE_UPLOAD_DIRS.PUBLIC_COVER })
      setValue(fieldName, response.fileUrl, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Failed to upload image.'))
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }))
    }
  }

"""

# 3. Insert correct handleImageUpload right before `<form onSubmit={handleSubmit(onSubmit)}`
form_index = content.find('<form onSubmit={handleSubmit(onSubmit)}')
if form_index != -1:
    content = content[:form_index] + correct_upload + content[form_index:]

# 4. Also fix the wrong fileApi calls inside Visual Branding section
content = content.replace("uploading['coverUrl']", "uploading.coverUrl")
content = content.replace("uploading['avatarUrl']", "uploading.avatarUrl")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed handleImageUpload")
