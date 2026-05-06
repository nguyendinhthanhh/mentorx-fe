import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { UserUpdateRequest } from '@/types'
import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  displayName: z.string().max(50).optional().or(z.literal('')),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  countryCode: z.string().max(5).optional().or(z.literal('')),
  preferredLanguage: z.string().optional(),
  profileIsPublic: z.boolean().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

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
  const { setUser, user } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
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
      } as UserUpdateRequest)
      
      // Update auth store with new user data
      if (user) {
        setUser({ ...user, ...updated })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Avatar Preview */}
      <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {initialData.avatarUrl ? (
            <img src={initialData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-2xl font-bold">
              {(initialData.fullName || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{initialData.fullName}</p>
          <p className="text-sm text-gray-500">Update your personal information below</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input {...register('fullName')} className={inputClass} placeholder="John Doe" />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Display Name</label>
          <input {...register('displayName')} className={inputClass} placeholder="johndoe" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          className={inputClass}
          placeholder="Tell us about yourself..."
        />
        {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Avatar URL</label>
        <input {...register('avatarUrl')} className={inputClass} placeholder="https://example.com/avatar.jpg" />
        {errors.avatarUrl && <p className="text-xs text-red-500 mt-1">{errors.avatarUrl.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register('phone')} className={inputClass} placeholder="+84 123 456 789" />
        </div>
        <div>
          <label className={labelClass}>Country Code</label>
          <input {...register('countryCode')} className={inputClass} placeholder="VN" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Preferred Language</label>
          <select {...register('preferredLanguage')} className={inputClass}>
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('profileIsPublic')}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Public profile</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4" />
          Profile updated successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </form>
  )
}
