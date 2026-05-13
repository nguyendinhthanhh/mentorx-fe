import { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Lock,
  FileCheck2,
  Clock,
} from 'lucide-react'
import { kycApi, KycStatusResponse } from '@/api/kycApi'
import { toast } from 'react-hot-toast'
import KycStepWizard from '@/components/kyc/KycStepWizard'
import { MentorStatus } from '@/types'

interface EkycVerificationProps {
  onSuccess?: (data: KycStatusResponse) => void
}

export default function EkycVerification({ onSuccess }: EkycVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KycStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleKycComplete = async ({ front, back, video }: { front: File; back: File; video: File }) => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('cccdFront', front)
      formData.append('cccdBack', back)
      formData.append('livenessVideo', video)

      const data = await kycApi.submitKyc(formData)
      setResult(data)
      toast.success('Đã gửi hồ sơ định danh.')
      if (onSuccess) onSuccess(data)
    } catch (err: unknown) {
      console.error('eKYC error:', err)

      let errorMsg = 'Xác thực thất bại. Vui lòng thử lại.'
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ECONNABORTED') {
        errorMsg =
          'Xử lý định danh mất quá nhiều thời gian (video/OCR). Vui lòng thử lại; nếu vẫn lỗi, hãy thử video ngắn hơn hoặc liên hệ hỗ trợ.'
      } else if (err && typeof err === 'object' && 'message' in err) {
        const m = String((err as { message?: string }).message || '')
        if (/timeout/i.test(m)) {
          errorMsg =
            'Hết thời gian chờ máy chủ. Quá trình xử lý video có thể lâu — vui lòng thử lại (hoặc dùng video ngắn hơn, mạng ổn định).'
        }
      }
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string; error?: string } } }
        const d = ax.response?.data
        errorMsg = d?.message || d?.error || errorMsg
      } else if (err instanceof Error && err.message) {
        errorMsg = err.message
      }

      setError(errorMsg)
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const submitted = result.mentorStatus === MentorStatus.KYC_SUBMITTED
    const verified = result.mentorStatus === MentorStatus.KYC_VERIFIED
    const livenessLabel =
      result.livenessResult === 'LIVE' || result.livenessResult === 'PROBABLE'
        ? 'Hợp lệ'
        : result.livenessResult === 'FAKE'
          ? 'Không hợp lệ'
          : result.livenessResult || '—'

    return (
      <div className="mx-auto max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div
            className={`px-8 py-10 text-center text-white ${
              verified ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              {verified ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <FileCheck2 className="h-8 w-8" />
              )}
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              {verified ? 'Định danh đã được xác nhận' : 'Đã gửi hồ sơ định danh'}
            </h2>
            <p className="mt-2 text-sm text-white/85">
              {verified
                ? 'Tài khoản mentor của bạn đã được xác minh.'
                : submitted
                  ? 'Hồ sơ đang chờ kiểm tra. Bạn sẽ nhận thông báo khi có kết quả.'
                  : 'Chúng tôi đã lưu kết quả xử lý tự động.'}
            </p>
          </div>

          <div className="space-y-6 p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Họ và tên (OCR)" value={result.legalName || '—'} />
              <InfoTile label="Ngày sinh" value={result.dateOfBirth || '—'} />
              <InfoTile label="Video (liveness)" value={livenessLabel} />
              <InfoTile
                label="So khớp khuôn mặt"
                value={
                  result.faceMatchingSimilarity != null
                    ? `${(result.faceMatchingSimilarity * 100).toFixed(1)}%`
                    : '—'
                }
              />
            </div>

            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p>
                Dữ liệu được mã hóa khi truyền. Ảnh giấy tờ chỉ dùng cho mục đích tuân thủ và chống gian lận; không
                hiển thị công khai trên hồ sơ.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full rounded-xl border border-slate-200 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {!isOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col items-center text-center sm:block sm:text-left">
            <div className="mx-auto mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 sm:mx-0 sm:mb-0 sm:inline-flex sm:mr-5 sm:align-middle">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="sm:inline-block sm:max-w-none sm:align-middle">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Xác minh danh tính (eKYC)
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Tải ảnh CCCD hai mặt và quay video ngắn bằng camera thiết bị. Hệ thống đối chiếu khuôn mặt và kiểm tra
                video có chuyển động thật.
              </p>
              <ul className="mt-4 space-y-2 text-left text-xs text-slate-500 dark:text-slate-400">
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  Khoảng 2–3 phút; chuẩn bị CCCD và chỗ có ánh sáng tốt.
                </li>
                <li className="flex gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  Chỉ bạn được quyền hoàn tất bước này trên tài khoản đã đăng nhập.
                </li>
              </ul>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-8 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto sm:px-8"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-dialog-title"
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Bước bảo mật</p>
                <h2 id="kyc-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Xác minh danh tính
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setError(null)
                }}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="relative">
                    <div className="h-14 w-14 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Đang xử lý</p>
                    <p className="mt-1 text-xs text-slate-500">So khớp khuôn mặt và phân tích video, vui lòng đợi…</p>
                  </div>
                </div>
              ) : (
                <KycStepWizard onComplete={handleKycComplete} />
              )}

              {error && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div>
                      <p className="text-sm font-medium text-rose-900 dark:text-rose-100">Không thể hoàn tất</p>
                      <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">{error}</p>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="mt-3 text-sm font-medium text-rose-700 underline dark:text-rose-300"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
