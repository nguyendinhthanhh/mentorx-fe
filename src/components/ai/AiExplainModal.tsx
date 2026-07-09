import { useEffect, useRef, useState } from 'react'
import { useMutation } from 'react-query'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'
import { aiApi, AiTaskType } from '@/api/aiApi'

interface AiExplainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskType: AiTaskType
  taskId: string
  taskTitle?: string
}

const INITIAL_QUESTION = 'Hãy phân tích tổng quan về công việc này, giải thích chi tiết yêu cầu và những điều cần lưu ý khi thực hiện.'

export function AiExplainModal({ open, onOpenChange, taskType, taskId, taskTitle }: AiExplainModalProps) {
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [initialError, setInitialError] = useState<string | null>(null)
  const hasAutoFired = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation(
    (q: string) => aiApi.explainTask({ taskType, taskId, question: q }),
    {
      onSuccess: (data) => {
        setAnswers((prev) => {
          if (prev.length === 0) {
            return [{ q: '', a: data.explanation }]
          }
          return prev
        })
        setQuestion('')
        setIsInitialLoading(false)
        setInitialError(null)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Không thể kết nối AI. Vui lòng thử lại sau.'
        if (answers.length === 0) {
          setInitialError(msg)
          setIsInitialLoading(false)
        }
      },
    }
  )

  const followUpMutation = useMutation(
    (q: string) => aiApi.explainTask({ taskType, taskId, question: q }),
    {
      onSuccess: (data, variables) => {
        setAnswers((prev) => [...prev, { q: variables, a: data.explanation }])
        setQuestion('')
      },
    }
  )

  // Auto-fire initial question when modal opens
  useEffect(() => {
    if (open && !hasAutoFired.current) {
      hasAutoFired.current = true
      setAnswers([])
      setInitialError(null)
      setIsInitialLoading(true)
      setQuestion('')
      mutation.mutate(INITIAL_QUESTION)
    }
  }, [open])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [answers, isInitialLoading])

  const handleSend = () => {
    const text = question.trim()
    if (!text || followUpMutation.isLoading) return
    followUpMutation.mutate(text)
  }

  const handleClose = () => {
    mutation.reset()
    followUpMutation.reset()
    setAnswers([])
    setQuestion('')
    setIsInitialLoading(false)
    setInitialError(null)
    hasAutoFired.current = false
    onOpenChange(false)
  }

  if (!open) return null

  const typeLabel =
    taskType === AiTaskType.JOB ? 'Job' : taskType === AiTaskType.PROPOSAL ? 'Proposal' : 'Contract'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">AI giải thích</h2>
              <p className="text-xs text-slate-500">
                {typeLabel}: {taskTitle ? taskTitle.slice(0, 60) : taskId.slice(0, 8)}
                {taskTitle && taskTitle.length > 60 ? '...' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Initial loading state */}
          {isInitialLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Đang phân tích công việc...</p>
              <p className="mt-1 text-xs text-slate-400">AI đang đọc yêu cầu và chuẩn bị giải thích</p>
            </div>
          )}

          {/* Initial error state */}
          {initialError && !isInitialLoading && answers.length === 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="text-sm font-medium text-rose-700">{initialError}</p>
            </div>
          )}

          {/* Chat answers */}
          {answers.map((item, i) => (
            <div key={i} className="mb-5 last:mb-0">
              {item.q && (
                <div className="mb-3 flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                    <p className="whitespace-pre-wrap break-words">{item.q}</p>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold uppercase tracking-widerr text-indigo-600">
                    {i === 0 ? 'Giải thích từ AI' : 'AI trả lời'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.a}</p>
              </div>
            </div>
          ))}

          {/* Follow-up loading */}
          {followUpMutation.isLoading && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-sm text-slate-500">AI đang trả lời...</span>
            </div>
          )}

          {/* Follow-up error */}
          {followUpMutation.isError && answers.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {(followUpMutation.error as any)?.response?.data?.message ||
               (followUpMutation.error as any)?.message ||
               'Không thể kết nối AI.'}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer / Input */}
        {answers.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex items-end gap-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Hỏi thêm về công việc này..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!question.trim() || followUpMutation.isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {followUpMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center">AI có thể mắc lỗi. Kiểm tra thông tin quan trọng.</p>
          </div>
        )}
      </div>
    </div>
  )
}
