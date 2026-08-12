import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userApi } from '@/api/userApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'
import { useI18n } from '@/i18n/I18nProvider'
import { useAuthStore } from '@/store/authStore'
import { SupportedLanguage, UserUpdateRequest } from '@/types'
import { useState, useRef } from 'react'
import { Loader2, CheckCircle, Camera, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
type ProfileFormData = {
  fullName: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  phone?: string
  countryCode?: string
  preferredLanguage?: string
  profileIsPublic?: boolean
}

interface Props {
  userId: string
  initialData: {
    fullName?: string
    displayName?: string
    avatarUrl?: string
    bio?: string
    phone?: string
    countryCode?: string
    preferredLanguage?: string
    profileIsPublic?: boolean
  }
}

export default function UserUpdateForm({ userId, initialData }: Props) {
  const { t } = useI18n()
  const { setUser, user } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileSchema = z.object({
    fullName: z.string().min(2, t('profile.validation.nameMin')).max(100),
    displayName: z.string().max(50).optional().or(z.literal('')),
    avatarUrl: z.string().optional().or(z.literal('')),
    bio: z.string().max(500).optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    countryCode: z.string().max(5).optional().or(z.literal('')),
    preferredLanguage: z.string().optional(),
    profileIsPublic: z.boolean().optional(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName || '',
      displayName: initialData.displayName || '',
      avatarUrl: initialData.avatarUrl || '',
      bio: initialData.bio || '',
      phone: initialData.phone || '',
      countryCode: initialData.countryCode || '',
      preferredLanguage: initialData.preferredLanguage || 'en',
      profileIsPublic: initialData.profileIsPublic ?? true,
    },
  })

  const avatarUrl = watch('avatarUrl')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_AVATAR })
      setValue('avatarUrl', response.fileUrl)
    } catch (err: any) {
      setError(t('profile.messages.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      const updated = await userApi.updateUser(userId, {
        ...data,
        displayName: data.displayName || undefined,
        avatarUrl: data.avatarUrl || undefined,
        bio: data.bio || undefined,
        phone: data.phone || undefined,
        countryCode: data.countryCode || undefined,
        preferredLanguage: data.preferredLanguage as SupportedLanguage | undefined,
      } as UserUpdateRequest)
      
      // Update auth store with new user data
      if (user) {
        setUser({ ...user, ...updated })
      }
      setSuccess(true)
      toast.success('Đã lưu thông tin hồ sơ!', { duration: 3000 })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-[14px] border-0 bg-slate-50  py-3 px-4 text-slate-900 dark:text-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-inset ring-slate-200/60 transition-all placeholder:text-slate-400 focus:bg-white dark:bg-slate-950 focus:ring-2 focus:ring-inset focus:ring-[#059669] hover:bg-slate-50 dark:bg-slate-900/50 hover:ring-slate-300 sm:text-sm sm:leading-6 dark:bg-slate-900/50 dark:text-white dark:ring-slate-800 dark:focus:bg-slate-900'
  const labelClass = 'mb-1.5 block text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide dark:text-slate-300'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-8 border-b border-slate-100 dark:border-slate-800/60 dark:border-slate-800/60">
        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#059669] to-[#10B981] p-[3px] shadow-xl transition-transform duration-300 group-hover:scale-105">
            <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-white bg-white dark:bg-slate-950 dark:border-slate-900 dark:bg-slate-900">
              {uploading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              ) : (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              )}
              
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">
                    {(watch('fullName') || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{watch('fullName')}</h3>
          <p className="text-xs text-gray-500 font-medium">{t('profile.avatarHint')}</p>
          {avatarUrl && (
            <button 
              type="button" 
              onClick={() => setValue('avatarUrl', '')}
              className="text-xs text-red-500 font-bold mt-1 hover:underline flex items-center gap-1 justify-center mx-auto"
            >
              <Trash2 className="w-3 h-3" /> {t('profile.actions.removePhoto')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t('profile.fields.fullName')}</label>
          <input {...register('fullName')} className={inputClass} placeholder={t('profile.placeholders.fullName')} />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{t('profile.fields.displayName')}</label>
          <input {...register('displayName')} className={inputClass} placeholder={t('profile.placeholders.displayName')} />
          {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>{t('profile.fields.bio')}</label>
        <textarea
          {...register('bio')}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder={t('profile.placeholders.bio')}
          maxLength={500}
        />
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-gray-400 font-bold">{watch('bio')?.length || 0}/500</span>
        </div>
        {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t('profile.fields.phone')}</label>
          <input {...register('phone')} className={inputClass} placeholder={t('profile.placeholders.phone')} />
        </div>
        <div>
          <label className={labelClass}>{t('profile.fields.countryCode')}</label>
          <input {...register('countryCode')} className={inputClass} placeholder={t('profile.placeholders.countryCode')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t('profile.fields.preferredLanguage')}</label>
          <select {...register('preferredLanguage')} className={inputClass}>
            <option value={SupportedLanguage.EN}>English</option>
            <option value={SupportedLanguage.VI}>Tiếng Việt</option>
          </select>
        </div>
        <div className="flex items-center pt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                {...register('profileIsPublic')}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 dark:border-slate-700 after:bg-white dark:bg-slate-950 after:transition-all after:content-[''] peer-checked:bg-[#059669] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#059669]/20 dark:border-slate-600 dark:bg-slate-700"></div>
            </div>
            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300 transition-colors group-hover:text-[#059669] dark:text-slate-300">{t('profile.fields.profileIsPublic')}</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700 shadow-sm backdrop-blur-sm dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#059669]/20 bg-[#059669]/10 px-4 py-3 text-sm font-medium text-[#059669] shadow-sm backdrop-blur-sm dark:border-[#059669]/30 dark:bg-[#059669]/20 dark:text-[#10B981]">
          <CheckCircle className="h-4 w-4" />
          {t('profile.messages.updated')}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#059669] to-[#10B981] py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(5,150,105,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('profile.actions.saving')}
          </>
        ) : (
          t('profile.actions.saveChanges')
        )}
      </button>
    </form>
  )
}
