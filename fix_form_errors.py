import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: useAuthStore
content = content.replace(
    "const { refreshUser } = useAuthStore()",
    "const { user, refreshUser } = useAuthStore()"
)

# Fix 2: initialData?.user?.avatarUrl -> user?.avatarUrl
content = content.replace("initialData?.user?.avatarUrl", "user?.avatarUrl")

# Fix 3: uploadFile -> upload and FILE_UPLOAD_DIRS.USER_ASSET -> { subDirectory: fieldName === 'avatarUrl' ? FILE_UPLOAD_DIRS.PUBLIC_AVATAR : FILE_UPLOAD_DIRS.PUBLIC_COVER }
content = content.replace(
    "fileApi.uploadFile(file, FILE_UPLOAD_DIRS.USER_ASSET)",
    "fileApi.upload(file, { subDirectory: fieldName === 'avatarUrl' ? FILE_UPLOAD_DIRS.PUBLIC_AVATAR : FILE_UPLOAD_DIRS.PUBLIC_COVER })"
)

# Fix 4: any undefined vars
# "Cannot find name 'allowedMimeTypes'."
# "Cannot find name 'setError'."
# "Cannot find name 'setUploading'."
# The `upload_helpers` block was inserted OUTSIDE the component `MentorProfileForm` because I replaced `return (`!
# Wait! `return (` is inside `export default function MentorProfileForm`! Why would it be outside?
# Ah! I replaced the FIRST `return (` which might be inside `isUrlLike` or `parseUrl` or something?
# Let's check `MentorProfileForm.tsx`.
