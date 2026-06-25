import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace("import { mentorApi } from '@/api/mentorApi'", "import { mentorApi } from '@/api/mentorApi'\nimport { userApi } from '@/api/userApi'")

# 2. Schema
content = content.replace("cvUrl: z.string().optional(),", "avatarUrl: z.string().optional(),\n    coverUrl: z.string().optional(),\n    cvUrl: z.string().optional(),")

# 3. Default Values
content = content.replace("cvUrl: initialData?.cvUrl || '',", "avatarUrl: user?.avatarUrl || '',\n      coverUrl: initialData?.coverUrl || '',\n      cvUrl: initialData?.cvUrl || '',")

# 4. AuthStore
content = content.replace("const { refreshUser } = useAuthStore()", "const { user, refreshUser } = useAuthStore()")

# 5. Handle Image Upload & UI
upload_helpers = """
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

content = content.replace("const { fields: proofLinkFields", upload_helpers + "const { fields: proofLinkFields")

visual_branding_section = """
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Visual Branding</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Make your profile stand out with a custom cover photo and professional avatar.</p>
        </div>

        <div className="relative mt-4">
          {/* Cover Photo Area */}
          <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center group transition-colors hover:border-indigo-400 dark:bg-slate-900 dark:border-slate-800">
            {values.coverUrl ? (
              <img src={values.coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-slate-500">
                <UploadCloud className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Upload Cover Photo (16:9)</span>
              </div>
            )}
            
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'coverUrl')} disabled={uploading.coverUrl || isLocked} />
              {uploading.coverUrl && <Loader2 className="h-8 w-8 animate-spin text-white" />}
            </label>
          </div>

          {/* Avatar Area */}
          <div className="absolute -bottom-10 left-8 z-10">
            <div className="relative h-28 w-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden group dark:border-slate-950 dark:bg-slate-900">
              {values.avatarUrl ? (
                <img src={values.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-400 dark:bg-indigo-900 dark:text-indigo-300">
                  <User className="h-12 w-12" />
                </div>
              )}
              
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all rounded-full">
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'avatarUrl')} disabled={uploading.avatarUrl || isLocked} />
                {uploading.avatarUrl ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-14 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Recommended: Cover (1600x400px), Avatar (400x400px). JPG, PNG, WEBP up to 10MB.
        </div>
      </section>
"""

insert_point = '<fieldset disabled={isLocked} className="space-y-6 disabled:cursor-not-allowed disabled:opacity-70">'
content = content.replace(insert_point, insert_point + "\n" + visual_branding_section)

# 6. Update onSubmit logic
submit_pattern = r"(const mappedLocation =.*?)(await onSaved\(\{.*?\}\))"
new_submit_logic = r"""\1
      if (data.avatarUrl && data.avatarUrl !== user?.avatarUrl) {
        try {
          await userApi.updateUser(userId, { avatarUrl: data.avatarUrl })
          await refreshUser()
        } catch (e) {
          console.error('Failed to update avatar', e)
        }
      }

      \2"""
content = re.sub(submit_pattern, new_submit_logic, content, flags=re.DOTALL)

mapping_pattern = r"(cvUrl: data\.cvUrl,)"
content = re.sub(mapping_pattern, r"coverUrl: data.coverUrl,\n        \1", content)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Safely updated MentorProfileForm")
