import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { jobApi } from '@/api/jobApi'
import { systemApi } from '@/api/systemApi'
import { 
  JobResponse, 
  JobStatus, 
  JobType, 
  BudgetType,
  JobCreateRequest,
  JobUpdateRequest
} from '@/types'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface JobModalProps {
  job?: JobResponse | null
  isOpen: boolean
  onClose: () => void
}

export default function JobModal({ job, isOpen, onClose }: JobModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!job
  const [serverError, setServerError] = useState('')

  const { data: categories } = useQuery('categories', systemApi.getCategories)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<any>({
    defaultValues: job ? {
      ...job,
      deadlineAt: job.deadlineAt ? new Date(job.deadlineAt).toISOString().split('T')[0] : ''
    } : {
      jobType: JobType.FREELANCE_PROJECT,
      budgetType: BudgetType.FIXED,
      status: JobStatus.OPEN
    }
  })

  const budgetType = watch('budgetType')

  useEffect(() => {
    if (job) {
      reset({
        ...job,
        deadlineAt: job.deadlineAt ? new Date(job.deadlineAt).toISOString().split('T')[0] : ''
      })
    } else {
      reset({
        jobType: JobType.FREELANCE_PROJECT,
        budgetType: BudgetType.FIXED,
        status: JobStatus.OPEN
      })
    }
  }, [job, reset])

  const mutation = useMutation(
    (data: any) => {
      if (isEdit) {
        return jobApi.update(job.jobId, data as JobUpdateRequest)
      } else {
        return jobApi.create(data as JobCreateRequest)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-jobs')
        onClose()
      },
      onError: (err: any) => {
        setServerError(err.response?.data?.message || 'Something went wrong')
      }
    }
  )

  if (!isOpen) return null

  return createPortal((
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-slate-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:max-h-[90dvh] sm:rounded-[2.5rem]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-50 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/30 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 dark:text-white tracking-tight">
              Edit Job Content
            </h2>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
              Job ID: {job?.jobId}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <form id="job-form" onSubmit={handleSubmit((data: any) => mutation.mutate(data))} className="space-y-6">
            {serverError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {serverError}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Job Title</label>
                <input 
                  {...register('title', { required: true })}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium"
                  placeholder="e.g. Senior Java Developer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Description</label>
                <textarea 
                  {...register('description', { required: true })}
                  rows={4}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium resize-none"
                  placeholder="Detailed job description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Category</label>
                <select 
                  {...register('categoryId')}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                >
                  <option value="">Select Category</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Job Type</label>
                <select 
                  {...register('jobType')}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                >
                  {Object.values(JobType).map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Budget Type</label>
                <select 
                  {...register('budgetType')}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                >
                  {Object.values(BudgetType).map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Deadline</label>
                <input 
                  type="date"
                  {...register('deadlineAt')}
                  className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Budget Details */}
            <div className="space-y-6 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-gray-900/50 p-4 dark:border-gray-800 dark:bg-gray-800/50 sm:rounded-[2rem] sm:p-6">
              {budgetType === BudgetType.FIXED ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Min Budget (MXC)</label>
                    <input 
                      type="number"
                      {...register('budgetMinMxc', { valueAsNumber: true })}
                      className="w-full px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-950 dark:bg-gray-900 border border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Max Budget (MXC)</label>
                    <input 
                      type="number"
                      {...register('budgetMaxMxc', { valueAsNumber: true })}
                      className="w-full px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-950 dark:bg-gray-900 border border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Hourly Rate (MXC)</label>
                    <input 
                      type="number"
                      {...register('hourlyRateMxc', { valueAsNumber: true })}
                      className="w-full px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-950 dark:bg-gray-900 border border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Est. Hours</label>
                    <input 
                      type="number"
                      {...register('estimatedHours', { valueAsNumber: true })}
                      className="w-full px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-950 dark:bg-gray-900 border border-transparent focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {isEdit && (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Status</label>
                  <select 
                    {...register('status')}
                    className="w-full px-6 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 dark:bg-gray-800 border border-transparent focus:bg-white dark:bg-slate-950 dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-bold"
                  >
                    {Object.values(JobStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6 px-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      {...register('isFeatured')}
                      className="w-6 h-6 rounded-lg border-gray-200 dark:border-gray-800 text-primary-600 focus:ring-primary-500/20 transition-all"
                    />
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-white transition-colors">Featured Job</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-50 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/30 min-[420px]:flex-row min-[420px]:justify-end sm:px-8 sm:py-6">
          <button 
            onClick={onClose}
            className="px-8 py-3.5 rounded-2xl text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:text-gray-100 dark:hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="job-form"
            disabled={mutation.isLoading}
            className="px-8 py-3.5 rounded-2xl bg-primary-600 text-white text-sm font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2"
          >
            {mutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  ), document.body)
}
