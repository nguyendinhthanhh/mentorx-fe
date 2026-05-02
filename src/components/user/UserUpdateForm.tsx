import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserUpdateRequest, SupportedLanguage } from '@/types'
import { userApi } from '@/api/userApi'
import { useState } from 'react'

const userUpdateSchema = z.object({
  fullName: z.string().max(150, 'Full name must not exceed 150 characters').optional(),
  displayName: z.string().max(100, 'Display name must not exceed 100 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  phone: z.string().max(30, 'Phone must not exceed 30 characters').optional(),
  countryCode: z.string().length(2, 'Country code must be 2 characters').optional(),
  preferredLanguage: z.nativeEnum(SupportedLanguage).optional(),
  profileIsPublic: z.boolean().optional(),
})

interface UserUpdateFormProps {
  userId: string
  initialData?: Partial<UserUpdateRequest>
  onSuccess?: () => void
}

export default function UserUpdateForm({ userId, initialData, onSuccess }: UserUpdateFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserUpdateRequest>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: UserUpdateRequest) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await userApi.updateUser(userId, data)
      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="label">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          {...register('fullName')}
          className="input"
          placeholder="John Doe"
        />
        {errors.fullName && <p className="error-message">{errors.fullName.message}</p>}
      </div>

      <div>
        <label htmlFor="displayName" className="label">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          {...register('displayName')}
          className="input"
          placeholder="johndoe"
        />
        {errors.displayName && <p className="error-message">{errors.displayName.message}</p>}
      </div>

      <div>
        <label htmlFor="avatarUrl" className="label">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          type="url"
          {...register('avatarUrl')}
          className="input"
          placeholder="https://example.com/avatar.jpg"
        />
        {errors.avatarUrl && <p className="error-message">{errors.avatarUrl.message}</p>}
      </div>

      <div>
        <label htmlFor="bio" className="label">
          Bio
        </label>
        <textarea
          id="bio"
          {...register('bio')}
          className="input"
          rows={4}
          placeholder="Tell us about yourself..."
        />
        {errors.bio && <p className="error-message">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="input"
            placeholder="+1234567890"
          />
          {errors.phone && <p className="error-message">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="countryCode" className="label">
            Country Code
          </label>
          <input
            id="countryCode"
            type="text"
            {...register('countryCode')}
            className="input"
            placeholder="US"
            maxLength={2}
          />
          {errors.countryCode && <p className="error-message">{errors.countryCode.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="preferredLanguage" className="label">
          Preferred Language
        </label>
        <select id="preferredLanguage" {...register('preferredLanguage')} className="input">
          <option value="">Select language</option>
          {Object.values(SupportedLanguage).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        {errors.preferredLanguage && <p className="error-message">{errors.preferredLanguage.message}</p>}
      </div>

      <div className="flex items-center">
        <input
          id="profileIsPublic"
          type="checkbox"
          {...register('profileIsPublic')}
          className="mr-2"
        />
        <label htmlFor="profileIsPublic" className="text-sm text-gray-700">
          Make profile public
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  )
}
