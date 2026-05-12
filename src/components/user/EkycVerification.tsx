import { useState } from 'react'
import { ShieldCheck, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react'
import { kycApi, KycStatusResponse } from '@/api/kycApi'
import { toast } from 'react-hot-toast'
import KycStepWizard from '@/components/kyc/KycStepWizard'

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
      toast.success('Xác thực danh tính thành công!')
      if (onSuccess) onSuccess(data)
    } catch (err: any) {
      console.error('eKYC error:', err)
      
      // Extract error message from response
      let errorMsg = 'Xác thực thất bại. Vui lòng thử lại.'
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl animate-in zoom-in-95 duration-500">
        <div className="overflow-hidden rounded-[3rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-100/50 dark:border-emerald-900/30 dark:bg-slate-950 dark:shadow-none">
          <div className="bg-emerald-600 p-12 text-center text-white">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/20 backdrop-blur-md">
              <ShieldCheck className="h-12 w-12" />
            </div>
            <h2 className="mt-8 text-4xl font-black">Xác thực hoàn tất</h2>
            <p className="mt-3 text-lg font-medium text-emerald-100">Hồ sơ của bạn đã được hệ thống AI phê duyệt tự động.</p>
          </div>
          
          <div className="p-12">
            <div className="grid grid-cols-2 gap-6">
              <InfoTile label="Họ và tên" value={result.legalName || '---'} />
              <InfoTile label="Ngày sinh" value={result.dateOfBirth || '---'} />
              <InfoTile label="Kết quả Liveness" value={result.livenessResult === 'PROBABLE' ? 'Hợp lệ' : result.livenessResult || '---'} />
              <InfoTile label="Độ tương đồng" value={result.faceMatchingSimilarity ? `${(result.faceMatchingSimilarity * 100).toFixed(1)}%` : '---'} />
            </div>

            <div className="mt-10 flex items-center gap-6 rounded-[2rem] bg-slate-50 p-6 dark:bg-slate-900">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Trạng thái định danh</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">Đã xác minh chính chủ</p>
              </div>
            </div>

            <button 
              onClick={() => setResult(null)}
              className="mt-10 w-full rounded-3xl border-2 border-slate-200 py-5 text-base font-black text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              Thực hiện xác thực lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {!isOpen ? (
        <div className="flex flex-col items-center justify-center space-y-8 rounded-[3rem] border-2 border-dashed border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Bắt đầu xác thực danh tính</h2>
            <p className="mt-3 max-w-md text-base font-medium text-slate-500">Chúng tôi cần bạn cung cấp ảnh CCCD và thực hiện quay video khuôn mặt ngắn để đảm bảo tính chính chủ.</p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-3xl bg-indigo-600 px-12 py-5 text-lg font-black text-white shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 dark:shadow-none"
          >
            Bắt đầu ngay
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-950">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Xác thực danh tính
                </h2>
                <p className="mt-3 text-base font-medium text-slate-500">
                  Hoàn thành quy trình 3 bước an toàn được bảo mật bởi AI.
                </p>
              </div>

              <div className="mx-auto max-w-3xl">
                {loading ? (
                  <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                      <div className="h-24 w-24 animate-spin rounded-full border-b-4 border-indigo-600" />
                      <ShieldCheck className="absolute inset-0 m-auto h-10 w-10 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Đang xử lý dữ liệu AI</h3>
                      <p className="mt-2 text-base font-medium text-slate-500">Hệ thống đang đối soát khuôn mặt với giấy tờ, vui lòng đợi...</p>
                    </div>
                  </div>
                ) : (
                  <KycStepWizard onComplete={handleKycComplete} />
                )}
                
                {error && (
                  <div className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                        <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-black text-rose-900 dark:text-rose-100">
                          Xác thực thất bại
                        </h4>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-rose-700 dark:text-rose-300">
                          {error}
                        </p>
                        <button
                          onClick={() => setError(null)}
                          className="mt-4 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700"
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
        </div>
      )}
    </div>
  )
}




function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
