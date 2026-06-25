import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\components\mentor\MentorProfileForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We'll create a UI snippet for Avatar and Cover Photo
# using the existing values `watch('avatarUrl')` and `watch('coverUrl')`
# and an `onFileChange` handler that calls `fileApi.uploadFile`.

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
      const response = await fileApi.uploadFile(file, FILE_UPLOAD_DIRS.USER_ASSET)
      setValue(fieldName, response.fileUrl, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Failed to upload image.'))
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }))
    }
  }
"""

# Insert upload helpers inside MentorProfileForm right before `return (`
content = content.replace("return (", upload_helpers + "\n  return (")

visual_branding_section = """
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Visual Branding</h2>
          <p className="text-sm text-slate-600">Make your profile stand out with a custom cover photo and professional avatar.</p>
        </div>

        <div className="relative mt-4">
          {/* Cover Photo Area */}
          <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center group transition-colors hover:border-indigo-400">
            {values.coverUrl ? (
              <img src={values.coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-slate-500">
                <UploadCloud className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Upload Cover Photo (16:9)</span>
              </div>
            )}
            
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'coverUrl')} disabled={uploading['coverUrl'] || isLocked} />
              {uploading['coverUrl'] && <Loader2 className="h-8 w-8 animate-spin text-white" />}
            </label>
          </div>

          {/* Avatar Area */}
          <div className="absolute -bottom-10 left-8 z-10">
            <div className="relative h-28 w-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden group">
              {values.avatarUrl ? (
                <img src={values.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-400">
                  <User className="h-12 w-12" />
                </div>
              )}
              
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all rounded-full">
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'avatarUrl')} disabled={uploading['avatarUrl'] || isLocked} />
                {uploading['avatarUrl'] ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-14 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Recommended: Cover (1600x400px), Avatar (400x400px). JPG, PNG, WEBP up to 10MB.
        </div>
      </section>
"""

# Insert the Visual Branding section inside the form
insert_point = r"<fieldset disabled=\{isLocked\} className=\"space-y-6 disabled:cursor-not-allowed disabled:opacity-70\">"
content = content.replace(insert_point, insert_point + "\n" + visual_branding_section)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Visual Branding section and upload logic")
