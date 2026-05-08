import { useState, useRef } from 'react'
import { Camera, Sparkles, Loader2, X } from 'lucide-react'
import { SupportedLanguage } from '@/types'
import { fileApi } from '@/api/fileApi'

interface ProfileData {
  displayName: string
  avatarUrl: string
  bio: string
  linkedinUrl: string
  githubUrl: string
  countryCode: string
  preferredLanguage: SupportedLanguage
}

interface Props {
  profileData: ProfileData
  setProfileData: (v: ProfileData) => void
  userName: string
}

export default function StepProfile({ profileData, setProfileData, userName }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const response = await fileApi.upload(file)
      update('avatarUrl', response.fileUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = () => {
    update('avatarUrl', '')
  }

  return (
    <div className="onb-fade-in-up space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 6 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Final Touches ✨</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">Complete your public profile</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mx-auto md:mx-0 onb-fade-in-scale">
          <div className="relative group">
            <div className="w-28 h-28 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-xl transition-transform duration-300 group-hover:scale-105 flex items-center justify-center relative">
              {isUploading ? (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : null}
              
              <img
                src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${profileData.displayName || userName}&size=256&background=random&bold=true`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />

              {profileData.avatarUrl && (
                <button 
                  onClick={removeAvatar}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1.5 -right-1.5 w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center uppercase font-bold tracking-tighter">Click to upload</p>
        </div>

        {/* Form */}
        <div className="flex-1 w-full space-y-5">
          <div className="onb-fade-in-up onb-stagger-1">
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all outline-none text-gray-900 dark:text-white font-bold text-sm"
              placeholder="e.g. Alex.Dev"
              value={profileData.displayName}
              onChange={e => update('displayName', e.target.value)}
            />
          </div>

          <div className="onb-fade-in-up onb-stagger-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Bio</label>
              <span className={`text-xs font-bold ${profileData.bio.length > 140 ? 'text-amber-500' : 'text-gray-400'}`}>
                {profileData.bio.length}/160
              </span>
            </div>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all outline-none text-gray-900 dark:text-white resize-none text-sm"
              placeholder="Tell us about yourself in a few words..."
              rows={3}
              maxLength={160}
              value={profileData.bio}
              onChange={e => update('bio', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 onb-fade-in-up onb-stagger-3">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                LinkedIn <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔗</span>
                <input
                  type="url"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm"
                  placeholder="linkedin.com/in/..."
                  value={profileData.linkedinUrl}
                  onChange={e => update('linkedinUrl', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                GitHub <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">💻</span>
                <input
                  type="url"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm"
                  placeholder="github.com/..."
                  value={profileData.githubUrl}
                  onChange={e => update('githubUrl', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
