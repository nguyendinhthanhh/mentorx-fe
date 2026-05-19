import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Plus, Edit2, Trash2, Check, X, Package, Loader2, DollarSign, Clock } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { PackageType } from '@/types'

interface Props {
  userId: string
}

interface PackageForm {
  title: string
  description: string
  packageType: PackageType
  durationHours: number
  priceMxc: number
  features: string[]
  isActive: boolean
  displayOrder: number
}

const PACKAGE_TYPES = [
  { value: PackageType.SINGLE_SESSION, label: 'Buổi mentoring đơn', duration: 1 },
  { value: PackageType.PACKAGE_DEAL, label: 'Gói nhiều buổi', duration: 2 },
  { value: PackageType.SUBSCRIPTION, label: 'Mentoring định kỳ', duration: 4 },
]

export default function MentorPackagesManager({ userId }: Props) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PackageForm>(getEmptyForm())

  const { data: packages = [], isLoading } = useQuery(
    ['mentor-packages', userId],
    () => mentorApi.getAllMentorPackages(userId)
  )

  const createMutation = useMutation(
    (data: PackageForm) => mentorApi.createMentorPackage(userId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-packages', userId])
        setIsCreating(false)
        setFormData(getEmptyForm())
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: PackageForm }) => 
      mentorApi.updateMentorPackage(userId, id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-packages', userId])
        setEditingId(null)
        setFormData(getEmptyForm())
      }
    }
  )

  const deleteMutation = useMutation(
    (id: string) => mentorApi.deleteMentorPackage(userId, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-packages', userId])
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (pkg: any) => {
    setEditingId(pkg.id)
    setFormData({
      title: pkg.title,
      description: pkg.description,
      packageType: pkg.packageType,
      durationHours: pkg.durationHours,
      priceMxc: pkg.priceMxc,
      features: pkg.features || [],
      isActive: pkg.isActive,
      displayOrder: pkg.displayOrder || 0
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData(getEmptyForm())
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

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
            <Package className="w-6 h-6 text-primary-600" />
            Gói Mentoring 1-1
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tạo các gói dịch vụ mentoring với giá và thời lượng khác nhau
          </p>
        </div>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Tạo Gói Mới
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 border-2 border-primary-200 space-y-4">
          <h3 className="font-black text-gray-900">
            {editingId ? 'Chỉnh Sửa Gói' : 'Tạo Gói Mới'}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Loại Gói
              </label>
              <select
                value={formData.packageType}
                onChange={(e) => {
                  const selectedType = PACKAGE_TYPES.find(t => t.value === e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    packageType: e.target.value as PackageType,
                    durationHours: selectedType?.duration || 1
                  }))
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Chọn loại gói</option>
                {PACKAGE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên Gói
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Career Debug Session"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Thời Lượng (giờ)
              </label>
              <input
                type="number"
                value={formData.durationHours}
                onChange={(e) => setFormData(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                min="0.5"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Giá (MXC)
              </label>
              <input
                type="number"
                value={formData.priceMxc}
                onChange={(e) => setFormData(prev => ({ ...prev, priceMxc: Number(e.target.value) }))}
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              placeholder="Mô tả chi tiết về gói dịch vụ..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                Tính Năng Bao Gồm
              </label>
              <button
                type="button"
                onClick={addFeature}
                className="text-sm text-primary-600 font-bold hover:text-primary-700"
              >
                + Thêm tính năng
              </button>
            </div>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="VD: 1 buổi 1-1 video call"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Hiển thị gói này trên profile công khai
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50"
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {editingId ? 'Cập Nhật' : 'Tạo Gói'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Packages List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg: any) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onEdit={() => handleEdit(pkg)}
            onDelete={() => {
              if (confirm('Bạn có chắc muốn xóa gói này?')) {
                deleteMutation.mutate(pkg.id)
              }
            }}
            isDeleting={deleteMutation.isLoading}
          />
        ))}
      </div>

      {packages.length === 0 && !isCreating && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Chưa có gói nào</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tạo gói mentoring đầu tiên để bắt đầu nhận booking
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Tạo Gói Đầu Tiên
          </button>
        </div>
      )}
    </div>
  )
}

function PackageCard({ package: pkg, onEdit, onDelete, isDeleting }: any) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-black text-gray-900">{pkg.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {pkg.durationHours}h • {pkg.packageType}
          </p>
        </div>
        {!pkg.isActive && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
            Ẩn
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {pkg.description}
      </p>

      <div className="text-2xl font-black text-primary-600 mb-4">
        {Math.round(pkg.priceMxc)} MXC
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <ul className="space-y-1 mb-4">
          {pkg.features.slice(0, 3).map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50"
        >
          <Edit2 className="w-4 h-4" />
          Sửa
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Xóa
        </button>
      </div>
    </div>
  )
}

function getEmptyForm(): PackageForm {
  return {
    title: '',
    description: '',
    packageType: '' as PackageType,
    durationHours: 1,
    priceMxc: 0,
    features: [],
    isActive: true,
    displayOrder: 0
  }
}
