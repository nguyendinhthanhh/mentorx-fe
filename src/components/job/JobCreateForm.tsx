import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { jobApi } from '@/api/jobApi'
import { categoryApi } from '@/api/categoryApi'
import { fileApi } from '@/api/fileApi'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Upload, X, CheckCircle2, AlertCircle, Plus, FileText } from 'lucide-react'
import { BudgetType, JobType, CategoryResponse } from '@/types'

const jobSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải ít nhất 5 ký tự').max(200),
  description: z.string().min(20, 'Mô tả phải ít nhất 20 ký tự'),
  categoryId: z.coerce.number().min(1, 'Vui lòng chọn danh mục'),
  jobType: z.enum(['LONG_TERM_MENTORING', 'FREELANCE_PROJECT', 'QUICK_FIX']),
  budgetType: z.enum(['FIXED', 'HOURLY']),
  budgetMinMxc: z.coerce.number().min(0).optional(),
  budgetMaxMxc: z.coerce.number().min(0).optional(),
  hourlyRateMxc: z.coerce.number().min(0).optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  deadlineAt: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

export default function JobCreateForm({ clientId }: { clientId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [uploading, setUploading] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [fileName, setFileName] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: JobType.FREELANCE_PROJECT,
      budgetType: 'FIXED',
    },
  })

  const budgetType = watch('budgetType')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAllActive()
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const res = await fileApi.upload(file)
      setAttachmentUrl(res.fileUrl)
      setFileName(file.name)
    } catch (err) {
      setError('Tải file thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: JobFormData) => {
    try {
      setLoading(true)
      setError('')
      const job = await jobApi.create({
        ...data,
        clientId,
        attachmentUrl: attachmentUrl || undefined,
        attachments: attachmentUrl ? [attachmentUrl] : undefined,
        jobType: data.jobType as JobType,
        budgetType: data.budgetType as BudgetType,
        budgetMinMxc: data.budgetType === 'FIXED' ? data.budgetMinMxc : undefined,
        budgetMaxMxc: data.budgetType === 'FIXED' ? data.budgetMaxMxc : undefined,
        hourlyRateMxc: data.budgetType === 'HOURLY' ? data.hourlyRateMxc : undefined,
        deadlineAt: data.deadlineAt || undefined,
      })
      navigate(`/jobs/${job.jobId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo công việc. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium dark:bg-slate-900 dark:border-slate-800'
  const labelClass = 'block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-1">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Tiêu đề công việc</label>
          <input
            {...register('title')}
            className={inputClass}
            placeholder="Ví dụ: Cần mentor hướng dẫn xây dựng app React Native..."
          />
          {errors.title && <p className="text-[10px] font-bold text-rose-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.title.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Lĩnh vực chuyên môn</label>
          <div className="relative group">
            <select {...register('categoryId')} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="">Chọn danh mục phù hợp...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          {errors.categoryId && <p className="text-[10px] font-bold text-rose-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.categoryId.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Mô tả chi tiết yêu cầu</label>
        <textarea
          {...register('description')}
          rows={6}
          className={`${inputClass} resize-none`}
          placeholder="Mô tả kỹ về các yêu cầu, kỹ năng cần thiết và mục tiêu bạn muốn đạt được..."
        />
        {errors.description && <p className="text-[10px] font-bold text-rose-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
          <label className={labelClass}>Hình thức công việc</label>
          <select {...register('jobType')} className={inputClass}>
            <option value={JobType.FREELANCE_PROJECT}>Dự án tự do (Freelance)</option>
            <option value={JobType.LONG_TERM_MENTORING}>Đồng hành dài hạn (Mentoring)</option>
            <option value={JobType.QUICK_FIX}>Giải quyết vấn đề nhanh</option>
          </select>
        </div>

        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
          <label className={labelClass}>Hình thức thanh toán</label>
          <select {...register('budgetType')} className={inputClass}>
            <option value="FIXED">Ngân sách cố định</option>
            <option value="HOURLY">Tính theo giờ</option>
          </select>
        </div>
      </div>

      <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Ngân sách & Thời hạn</h3>
        </div>

        {budgetType === 'FIXED' ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ngân sách tối thiểu (MXC)</label>
              <input
                type="number"
                step="0.01"
                {...register('budgetMinMxc')}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Ngân sách tối đa (MXC)</label>
              <input
                type="number"
                step="0.01"
                {...register('budgetMaxMxc')}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Mức giá theo giờ (MXC)</label>
              <input
                type="number"
                step="0.01"
                {...register('hourlyRateMxc')}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Dự kiến số giờ</label>
              <input
                type="number"
                {...register('estimatedHours')}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className={labelClass}>Thời hạn hoàn thành (không bắt buộc)</label>
          <input
            type="datetime-local"
            {...register('deadlineAt')}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Tài liệu đính kèm (Hình ảnh, PDF, Tài liệu...)</label>
        {attachmentUrl ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-bold truncate max-w-[200px]">{fileName}</span>
            </div>
            <button 
              type="button"
              onClick={() => {setAttachmentUrl(''); setFileName('')}}
              className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative group cursor-pointer">
            <input
              type="file"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />
            <div className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all ${
              uploading 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-slate-50 border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-300 group-hover:shadow-xl group-hover:shadow-indigo-100/50'
            } dark:bg-slate-900 dark:border-slate-800`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải tệp lên...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all dark:bg-slate-800">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Nhấn để tải lên tài liệu</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Kéo và thả tệp vào đây</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-sm font-bold dark:bg-rose-950/10 dark:border-rose-900/20">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full relative group overflow-hidden bg-slate-950 text-white h-16 rounded-[2rem] font-black text-sm shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 disabled:bg-slate-300 disabled:cursor-not-allowed dark:bg-white dark:text-slate-950 dark:shadow-none"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {loading ? 'Đang tạo công việc...' : 'Đăng tuyển Mentor ngay'}
        </span>
      </button>
    </form>
  )
}
