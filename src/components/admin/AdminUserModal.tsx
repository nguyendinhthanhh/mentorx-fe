import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { UserResponse, UserCreateRequest, UserUpdateRequest, SupportedLanguage } from '@/types'
import { userApi } from '@/api/userApi'
import { useMutation, useQueryClient } from 'react-query'

const userSchema = z.object({
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  displayName: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  countryCode: z.string().max(5).optional().or(z.literal('')),
  preferredLanguage: z.nativeEnum(SupportedLanguage).optional(),
  profileIsPublic: z.boolean().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface AdminUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserResponse | null // null means create mode
}

export default function AdminUserModal({ isOpen, onClose, user }: AdminUserModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      displayName: '',
      bio: '',
      phone: '',
      countryCode: '',
      preferredLanguage: SupportedLanguage.EN,
      profileIsPublic: true,
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        fullName: user.fullName,
        displayName: user.displayName || '',
        bio: user.bio || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '',
        preferredLanguage: user.preferredLanguage || SupportedLanguage.EN,
        profileIsPublic: user.profileIsPublic ?? true,
      })
    } else {
      reset({
        email: '',
        password: '',
        fullName: '',
        displayName: '',
        bio: '',
        phone: '',
        countryCode: '',
        preferredLanguage: SupportedLanguage.EN,
        profileIsPublic: true,
      })
    }
    setError('')
  }, [user, reset, isOpen])

  const mutation = useMutation(
    async (data: UserFormData) => {
      if (user) {
        const updateData: UserUpdateRequest = {
          fullName: data.fullName,
          displayName: data.displayName || undefined,
          bio: data.bio || undefined,
          phone: data.phone || undefined,
          countryCode: data.countryCode || undefined,
          preferredLanguage: data.preferredLanguage,
          profileIsPublic: data.profileIsPublic,
        }
        return userApi.updateUser(user.userId, updateData)
      } else {
        if (!data.email || !data.password) {
          throw new Error('Email and password are required for creating a user.')
        }
        const createData: UserCreateRequest = {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          displayName: data.displayName || undefined,
          bio: data.bio || undefined,
          phone: data.phone || undefined,
          countryCode: data.countryCode || undefined,
          preferredLanguage: data.preferredLanguage,
        }
        return userApi.createUser(createData)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users')
        onClose()
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || err.message || 'An error occurred.')
      },
    }
  )

  if (!isOpen) return null

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data)
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium text-gray-900 dark:text-white"
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {!user && (
              <>
                <div className="space-y-1">
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" {...register('email')} className={inputClass} placeholder="john@example.com" />
                  {errors.email && <p className="text-xs font-bold text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Password *</label>
                  <input type="password" {...register('password')} className={inputClass} placeholder="••••••••" />
                  {errors.password && <p className="text-xs font-bold text-red-500 mt-1">{errors.password.message}</p>}
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className={labelClass}>Full Name *</label>
              <input type="text" {...register('fullName')} className={inputClass} placeholder="John Doe" />
              {errors.fullName && <p className="text-xs font-bold text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Display Name</label>
              <input type="text" {...register('displayName')} className={inputClass} placeholder="johndoe" />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass}>Bio</label>
              <textarea {...register('bio')} rows={3} className={inputClass} placeholder="Tell us about this user..." />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Phone Number</label>
              <input type="text" {...register('phone')} className={inputClass} placeholder="123456789" />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Country Code</label>
              <input type="text" {...register('countryCode')} className={inputClass} placeholder="VN" />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Preferred Language</label>
              <select {...register('preferredLanguage')} className={inputClass}>
                {Object.values(SupportedLanguage).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {user && (
              <div className="space-y-1 flex items-center h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      {...register('profileIsPublic')} 
                      className="peer w-6 h-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-primary-600 bg-gray-50 dark:bg-gray-800 focus:ring-primary-500/20 focus:ring-offset-0 transition-all checked:border-primary-600 dark:checked:border-primary-500 cursor-pointer appearance-none" 
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none transition-opacity">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Public Profile
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-8 py-3 rounded-2xl font-bold text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
