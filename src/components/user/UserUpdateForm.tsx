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
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.messages.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wider'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-100">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-white shadow-xl">
            {uploading ? (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : null}
            
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">
                {(watch('fullName') || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-gray-100 text-primary-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:bg-primary-50"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-gray-900">{watch('fullName')}</h3>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">{t('profile.fields.profileIsPublic')}</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {t('profile.messages.updated')}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-widest"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('profile.actions.saving')}
          </>
        ) : (
          t('profile.actions.saveChanges')
        )}
      </button>
    </form>
  )
}
