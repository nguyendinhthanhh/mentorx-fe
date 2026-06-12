import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Award, Plus, Star, Trophy, Upload, X, Loader2, CheckCircle2, Medal } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { FILE_UPLOAD_DIRS, fileApi } from '@/api/fileApi'

interface Props {
  userId: string
}

interface AchievementForm {
  badgeName: string
  description: string
  badgeType: string
  iconUrl: string
  isFeatured: boolean
}

const BADGE_TYPES = [
  { value: 'CERTIFICATION', label: 'Chứng Chỉ', icon: <Award className="w-4 h-4" /> },
  { value: 'AWARD', label: 'Giải Thưởng', icon: <Trophy className="w-4 h-4" /> },
  { value: 'ACHIEVEMENT', label: 'Thành Tựu', icon: <Star className="w-4 h-4" /> },
  { value: 'MILESTONE', label: 'Cột Mốc', icon: <Medal className="w-4 h-4" /> },
]

export default function MentorAchievementsManager({ userId }: Props) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<AchievementForm>(getEmptyForm())

  const { data: badges = [], isLoading } = useQuery(
    ['mentor-badges', userId],
    () => mentorApi.getMentorBadges(userId)
  )

  const createBadgeMutation = useMutation(
    (data: AchievementForm) => mentorApi.createBadge(userId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-badges', userId])
        setIsAdding(false)
        setFormData(getEmptyForm())
      }
    }
  )

  const deleteBadgeMutation = useMutation(
    (badgeId: string) => mentorApi.deleteBadge(userId, badgeId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-badges', userId])
      }
    }
  )

  const toggleFeaturedMutation = useMutation(
    ({ badgeId, isFeatured }: { badgeId: string; isFeatured: boolean }) =>
      mentorApi.updateBadge(userId, badgeId, { isFeatured }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-badges', userId])
      }
    }
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_MENTOR_ASSET })
      setFormData(prev => ({ ...prev, iconUrl: response.fileUrl }))
    } catch (error) {
      console.error('Upload failed', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBadgeMutation.mutate(formData)
  }

  const featuredBadges = badges.filter((b: any) => b.isFeatured)
  const otherBadges = badges.filter((b: any) => !b.isFeatured)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary-600" />
            Thành Tựu & Chứng Chỉ
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Thêm badges, awards, certificates để tăng độ tin cậy với học viên
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Thêm Thành Tựu
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 space-y-4">
          <h3 className="font-black text-gray-900">Thêm Thành Tựu Mới</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Loại
              </label>
              <select
                value={formData.badgeType}
                onChange={(e) => setFormData(prev => ({ ...prev, badgeType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Chọn loại</option>
                {BADGE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên Thành Tựu
              </label>
              <input
                type="text"
                value={formData.badgeName}
                onChange={(e) => setFormData(prev => ({ ...prev, badgeName: e.target.value }))}
                placeholder="VD: Google UX Certificate"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Mô Tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về thành tựu này..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Icon / Chứng Chỉ
            </label>
            <div className="flex gap-4">
              {formData.iconUrl ? (
                <div className="relative">
                  <img
                    src={formData.iconUrl}
                    alt="Badge icon"
                    className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, iconUrl: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                </label>
              )}
              <div className="flex-1 text-sm text-gray-600">
                <p className="font-bold mb-1">Upload icon hoặc ảnh chứng chỉ</p>
                <p>PNG, JPG (khuyến nghị 200x200px)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
              Hiển thị nổi bật trên profile
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createBadgeMutation.isLoading || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50"
            >
              {createBadgeMutation.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Thêm Thành Tựu
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setFormData(getEmptyForm())
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Featured Badges */}
      {featuredBadges.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Thành Tựu Nổi Bật
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredBadges.map((badge: any) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onToggleFeatured={() => toggleFeaturedMutation.mutate({
                  badgeId: badge.id,
                  isFeatured: !badge.isFeatured
                })}
                onDelete={() => {
                  if (confirm('Xóa thành tựu này?')) {
                    deleteBadgeMutation.mutate(badge.id)
                  }
                }}
                isDeleting={deleteBadgeMutation.isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Badges */}
      {otherBadges.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4">Thành Tựu Khác</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherBadges.map((badge: any) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                compact
                onToggleFeatured={() => toggleFeaturedMutation.mutate({
                  badgeId: badge.id,
                  isFeatured: !badge.isFeatured
                })}
                onDelete={() => {
                  if (confirm('Xóa thành tựu này?')) {
                    deleteBadgeMutation.mutate(badge.id)
                  }
                }}
                isDeleting={deleteBadgeMutation.isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Chưa có thành tựu nào</h3>
          <p className="text-sm text-gray-600 mb-4">
            Thêm chứng chỉ, giải thưởng để tăng độ tin cậy
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Thêm Thành Tựu Đầu Tiên
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="font-black text-purple-900 mb-3">💡 Tips về thành tựu</h3>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Thêm ít nhất 3-5 thành tựu để profile nổi bật</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Chứng chỉ từ tổ chức uy tín tăng độ tin cậy</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Featured badges hiển thị đầu tiên trên profile</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Upload ảnh chứng chỉ rõ ràng, dễ đọc</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function BadgeCard({ badge, compact, onToggleFeatured, onDelete, isDeleting }: any) {
  const typeIcon = BADGE_TYPES.find(t => t.value === badge.badgeType)?.icon || <Award className="w-4 h-4" />

  if (compact) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-3">
          {badge.iconUrl ? (
            <img
              src={badge.iconUrl}
              alt={badge.badgeName}
              className="w-12 h-12 object-cover rounded-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              {typeIcon}
            </div>
          )}
          <button
            onClick={onToggleFeatured}
            className={`p-1.5 rounded-lg transition-colors ${
              badge.isFeatured
                ? 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500'
            }`}
            title={badge.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
          >
            <Star className={`w-4 h-4 ${badge.isFeatured ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
          {badge.badgeName}
        </h4>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {badge.description}
        </p>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          Xóa
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4 mb-4">
        {badge.iconUrl ? (
          <img
            src={badge.iconUrl}
            alt={badge.badgeName}
            className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 border-2 border-white shadow-md">
            <Trophy className="w-8 h-8" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-black text-gray-900">{badge.badgeName}</h4>
              <p className="text-xs text-amber-700 font-bold mt-1">
                {BADGE_TYPES.find(t => t.value === badge.badgeType)?.label}
              </p>
            </div>
            <button
              onClick={onToggleFeatured}
              className={`p-2 rounded-lg transition-colors ${
                badge.isFeatured
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-white text-gray-400 hover:bg-amber-100 hover:text-amber-600'
              }`}
            >
              <Star className={`w-5 h-5 ${badge.isFeatured ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        {badge.description}
      </p>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="w-full py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
      >
        Xóa Thành Tựu
      </button>
    </div>
  )
}

function getEmptyForm(): AchievementForm {
  return {
    badgeName: '',
    description: '',
    badgeType: '',
    iconUrl: '',
    isFeatured: false
  }
}
