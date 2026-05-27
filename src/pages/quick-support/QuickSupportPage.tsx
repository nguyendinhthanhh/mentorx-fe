import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  UserCheck,
  Send,
  Loader2,
  ChevronRight,
  MessageSquare,
  Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quickSupportApi } from '@/api/quickSupportApi'
import { categoryApi } from '@/api/categoryApi'
import { useAuthStore } from '@/store/authStore'
import { QuickSupportStatus, QuickSupportResponse } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'

const STATUS_META: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  [QuickSupportStatus.PENDING]: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="w-4 h-4" />,
  },
  [QuickSupportStatus.MATCHED]: {
    label: 'Matched',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <UserCheck className="w-4 h-4" />,
  },
  [QuickSupportStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  [QuickSupportStatus.COMPLETED]: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  [QuickSupportStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <XCircle className="w-4 h-4" />,
  },
  [QuickSupportStatus.EXPIRED]: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <Timer className="w-4 h-4" />,
  },
}

function RequestCard({ request }: { request: QuickSupportResponse }) {
  const meta = STATUS_META[request.status] || STATUS_META[QuickSupportStatus.PENDING]
  return (
    <Link
      to={`/quick-support/${request.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {request.issueDescription}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {request.detailedDescription || 'No description'}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}>
          {meta.icon}
          <span>{meta.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
        <span>{request.categoryName}</span>
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Urgency: {request.urgencyLevel}/5
        </span>
        {request.mentorName && <span>Mentor: {request.mentorName}</span>}
        <span className="ml-auto">{formatRelativeTime(request.createdAt)}</span>
      </div>
    </Link>
  )
}

export default function QuickSupportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'my' | 'create' | 'available'>('my')

  const [form, setForm] = useState({
    issueDescription: '',
    detailedDescription: '',
    categoryId: 0,
    urgencyLevel: 3,
    estimatedDurationMinutes: 30,
    maxRateMxc: 0,
  })

  const { data: categories = [] } = useQuery('categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const { data: myRequests, isLoading: loadingMy } = useQuery(
    ['quick-support-my', user?.userId],
    () => quickSupportApi.getMyRequests(user!.userId, { page: 0, size: 20 }),
    { enabled: !!user?.userId && tab === 'my' }
  )

  const { data: available, isLoading: loadingAvailable } = useQuery(
    ['quick-support-available'],
    () => quickSupportApi.getAvailable({ page: 0, size: 20 }),
    { enabled: tab === 'available' }
  )

  const createMutation = useMutation(
    () =>
      quickSupportApi.create({
        clientId: user!.userId,
        categoryId: form.categoryId,
        issueDescription: form.issueDescription,
        detailedDescription: form.detailedDescription || undefined,
        urgencyLevel: form.urgencyLevel,
        estimatedDurationMinutes: form.estimatedDurationMinutes,
        maxRateMxc: form.maxRateMxc > 0 ? form.maxRateMxc : undefined,
      }),
    {
      onSuccess: (data) => {
        toast.success('Quick support request created!')
        queryClient.invalidateQueries(['quick-support'])
        setTab('my')
        navigate(`/quick-support/${data.id}`)
      },
      onError: () => { toast.error('Failed to create request') },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.issueDescription.trim()) {
      toast.error('Please describe your issue')
      return
    }
    if (!form.categoryId) {
      toast.error('Please select a category')
      return
    }
    createMutation.mutate()
  }

  const requests = tab === 'my'
    ? (myRequests?.content || [])
    : (tab === 'available' ? (available?.content || []) : [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Support</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setTab('my')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'my'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          My Requests
        </button>
        <button
          onClick={() => setTab('available')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'available'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'create'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          New Request
        </button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issue Description *
            </label>
            <textarea
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Briefly describe what you need help with..."
            />
            <span className="text-xs text-gray-400">{form.issueDescription.length}/500</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Detailed Description
            </label>
            <textarea
              value={form.detailedDescription}
              onChange={(e) => setForm({ ...form, detailedDescription: e.target.value })}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide more details about your issue..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Select category...</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.labelEn || cat.labelVi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Urgency Level
              </label>
              <select
                value={form.urgencyLevel}
                onChange={(e) => setForm({ ...form, urgencyLevel: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} - {v === 1 ? 'Low' : v === 3 ? 'Medium' : v === 5 ? 'Urgent' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Est. Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={form.estimatedDurationMinutes}
                onChange={(e) => setForm({ ...form, estimatedDurationMinutes: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Rate (MXC/hr)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.maxRateMxc}
                onChange={(e) => setForm({ ...form, maxRateMxc: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0 = negotiable"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Post Quick Request
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {(loadingMy || loadingAvailable) && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {!loadingMy && !loadingAvailable && requests.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No requests found</p>
              {tab === 'my' && (
                <button
                  onClick={() => setTab('create')}
                  className="mt-3 text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Create your first request
                </button>
              )}
            </div>
          )}

          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}
