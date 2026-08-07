import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { QRCodeCanvas } from 'qrcode.react'
import { AlertCircle, ArrowRight, CheckCircle, Loader2, Wallet, X, ShieldCheck, CreditCard, Sparkles, Receipt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentApi, type PayOSPaymentResponse } from '@/api/paymentApi'
import { formatCurrency, formatFiatCurrency } from '@/utils/formatters'

const MXC_TO_VND_RATE = 1000
const MIN_PAYOS_VND_AMOUNT = 10000
const AUTO_PAYMENT_CHECK_INTERVAL_MS = 4000
const AUTO_PAYMENT_CHECK_MAX_ATTEMPTS = 15

type PaymentCheckMode = 'idle' | 'auto' | 'manual'

interface JobFundingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  targetFundingMxc: number
  currentReservedMxc?: number
  availableBalanceMxc?: number
  getLatestAvailableBalance: () => Promise<number>
  demoTopUpEnabled?: boolean
  onDemoTopUp?: (amountMxc: number) => Promise<void>
}

export default function JobFundingModal({
  isOpen,
  onClose,
  onConfirm,
  targetFundingMxc,
  currentReservedMxc = 0,
  availableBalanceMxc = 0,
  getLatestAvailableBalance,
  demoTopUpEnabled = false,
  onDemoTopUp,
}: JobFundingModalProps) {
  const [payment, setPayment] = useState<PayOSPaymentResponse | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [demoTopUpLoading, setDemoTopUpLoading] = useState(false)
  const [demoTopUpSuccess, setDemoTopUpSuccess] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paymentCheckMode, setPaymentCheckMode] = useState<PaymentCheckMode>('idle')
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentCheckAttempts, setPaymentCheckAttempts] = useState(0)
  const [autoCheckPaused, setAutoCheckPaused] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
  const [error, setError] = useState('')
  const autoQrRequestKeyRef = useRef('')
  const checkingPaymentRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setPayment(null)
    setLoadingQr(false)
    setDemoTopUpLoading(false)
    setDemoTopUpSuccess(false)
    setConfirming(false)
    setPaymentCheckMode('idle')
    setPaymentConfirmed(false)
    setPaymentCheckAttempts(0)
    setAutoCheckPaused(false)
    setLastCheckedAt(null)
    setError('')
    autoQrRequestKeyRef.current = ''
    checkingPaymentRef.current = false
  }, [isOpen, targetFundingMxc, currentReservedMxc])

  const currentReserved = Math.max(0, currentReservedMxc)
  const targetFunding = Math.max(0, targetFundingMxc)
  const additionalFundingNeeded = Math.max(targetFunding - currentReserved, 0)
  const refundAmount = Math.max(currentReserved - targetFunding, 0)
  const payFromWalletAmount = Math.min(availableBalanceMxc, additionalFundingNeeded)
  const missingAmountMxc = Math.max(additionalFundingNeeded - availableBalanceMxc, 0)
  const missingAmountVnd = Math.max(0, Math.ceil(missingAmountMxc * MXC_TO_VND_RATE))
  const payosAmountVnd = Math.max(missingAmountVnd, MIN_PAYOS_VND_AMOUNT)
  const requiresMinimumTopUp = missingAmountMxc > 0 && payosAmountVnd > missingAmountVnd

  const summaryText = useMemo(() => {
    if (targetFunding <= 0) {
      return 'Công việc này không cần ngân sách cấp vốn.'
    }
    if (paymentConfirmed && missingAmountMxc <= 0) {
      return `${formatCurrency(payFromWalletAmount || additionalFundingNeeded)} từ số dư ví đã xác nhận của bạn sẽ bị tạm giữ khi công việc này được đăng. Nếu đăng thất bại, MXC sẽ vẫn ở trong ví của bạn.`
    }
    if (additionalFundingNeeded <= 0 && refundAmount <= 0) {
      return 'Công việc này đã được cấp đủ vốn. Bạn có thể đăng ngay lập tức.'
    }
    if (refundAmount > 0) {
      return `${formatCurrency(refundAmount)} sẽ được hoàn lại vào ví của bạn sau khi đăng vì ngân sách mới thấp hơn số tiền đã tạm giữ.`
    }
    if (missingAmountMxc > 0) {
      return `Bạn cần thêm ${formatCurrency(missingAmountMxc)} để đăng công việc này với ngân sách được bảo vệ.`
    }
    return `${formatCurrency(payFromWalletAmount)} sẽ được trừ từ số dư ví hiện tại của bạn khi bạn đăng công việc này.`
  }, [additionalFundingNeeded, missingAmountMxc, paymentConfirmed, payFromWalletAmount, refundAmount, targetFunding])

  const createTopUpQr = useCallback(async () => {
    if (missingAmountMxc <= 0 || missingAmountVnd <= 0) {
      return
    }

    try {
      setLoadingQr(true)
      setError('')
      setDemoTopUpSuccess(false)
      const response = await paymentApi.createPayOSPayment({
        amount: payosAmountVnd.toString(),
        currency: 'VND',
        orderInfo: `Job funding top-up - missing ${formatCurrency(missingAmountMxc)}`,
      })

      if (response.code === '00' && (response.qrCode || response.checkoutUrl)) {
        setPayment(response)
        setPaymentCheckAttempts(0)
        setAutoCheckPaused(false)
        setLastCheckedAt(null)
        return
      }

      setError(response.message || 'Không thể tạo liên kết thanh toán PayOS.')
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể tạo liên kết thanh toán PayOS.')
    } finally {
      setLoadingQr(false)
    }
  }, [missingAmountMxc, missingAmountVnd, payosAmountVnd])

  useEffect(() => {
    if (!isOpen || missingAmountMxc <= 0 || payment || loadingQr) {
      return
    }

    const requestKey = `${missingAmountMxc}:${payosAmountVnd}`
    if (autoQrRequestKeyRef.current === requestKey) {
      return
    }

    autoQrRequestKeyRef.current = requestKey
    void createTopUpQr()
  }, [createTopUpQr, isOpen, loadingQr, missingAmountMxc, payment, payosAmountVnd])

  const runDemoTopUp = async () => {
    if (!demoTopUpEnabled || !onDemoTopUp || missingAmountMxc <= 0) {
      return
    }

    try {
      setDemoTopUpLoading(true)
      setError('')
      setDemoTopUpSuccess(false)
      await onDemoTopUp(missingAmountMxc)
      await getLatestAvailableBalance()
      setDemoTopUpSuccess(true)
    } catch (demoError: any) {
      setError(demoError?.response?.data?.message || demoError?.message || 'Không thể chạy nạp tiền demo.')
    } finally {
      setDemoTopUpLoading(false)
    }
  }

  const checkingPayment = paymentCheckMode !== 'idle'
  const manuallyCheckingPayment = paymentCheckMode === 'manual'
  const autoCheckingPayment = paymentCheckMode === 'auto'

  const checkPaymentStatus = useCallback(async (
    showPendingMessage = false,
    mode: Exclude<PaymentCheckMode, 'idle'> = 'manual'
  ) => {
    if (!payment?.orderCode) {
      return false
    }

    if (checkingPaymentRef.current) {
      if (showPendingMessage) {
        setError('Xác minh thanh toán đang chạy. Vui lòng đợi trong giây lát.')
      }
      return false
    }

    try {
      checkingPaymentRef.current = true
      setPaymentCheckMode(mode)
      const response = await paymentApi.checkPayOSStatus(payment.orderCode)
      const isPaid = response.code === '00' && response.status === 'PAID' && !response.cancel
      setLastCheckedAt(Date.now())

      if (isPaid) {
        await getLatestAvailableBalance()
        setPaymentConfirmed(true)
        setAutoCheckPaused(true)
        setError('')
        return true
      }

      if (showPendingMessage) {
        setError(response.message || 'PayOS chưa xác nhận khoản thanh toán này. Vui lòng đợi vài giây và thử lại.')
      }
      return false
    } catch (statusError: any) {
      if (showPendingMessage) {
        setError(statusError?.response?.data?.message || 'Chưa thể xác minh khoản thanh toán PayOS này.')
      }
      return false
    } finally {
      checkingPaymentRef.current = false
      setPaymentCheckMode('idle')
    }
  }, [getLatestAvailableBalance, payment?.orderCode])

  useEffect(() => {
    if (!isOpen || !payment?.orderCode || paymentConfirmed || missingAmountMxc <= 0 || autoCheckPaused) {
      return
    }

    let attempts = 0
    let stopped = false

    const poll = () => {
      if (stopped) {
        return
      }
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      if (attempts >= AUTO_PAYMENT_CHECK_MAX_ATTEMPTS) {
        setAutoCheckPaused(true)
        return
      }
      attempts += 1
      setPaymentCheckAttempts(attempts)
      void checkPaymentStatus(false, 'auto')
    }

    poll()
    const timer = window.setInterval(poll, AUTO_PAYMENT_CHECK_INTERVAL_MS)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [autoCheckPaused, checkPaymentStatus, isOpen, missingAmountMxc, payment?.orderCode, paymentConfirmed])

  const lastCheckedLabel = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const paymentStatus = paymentConfirmed
    ? {
        label: 'Đã xác nhận thanh toán',
        detail: 'Tiền nạp đã được cộng vào ví của bạn. Bạn có thể đăng công việc ngay bây giờ.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      }
    : autoCheckPaused
      ? {
          label: 'Đang chờ xác nhận',
          detail: 'Tạm dừng kiểm tra tự động. Nếu bạn đã thanh toán, hãy sử dụng Kiểm tra trạng thái thanh toán.',
          className: 'border-amber-200 bg-amber-50 text-amber-900',
        }
      : autoCheckingPayment
        ? {
            label: 'Đang kiểm tra ngầm',
            detail: 'Vui lòng giữ cửa sổ này mở sau khi quét mã QR. Trạng thái thường được cập nhật trong vài giây.',
            className: 'border-sky-200 bg-sky-50 text-sky-900',
          }
        : paymentCheckAttempts > 0
          ? {
              label: 'Đang chờ thanh toán',
              detail: 'Chúng tôi đang kiểm tra PayOS trong khoảng 1 phút, sau đó bạn có thể kiểm tra thủ công.',
              className: 'border-slate-200 bg-slate-50 text-slate-700',
            }
          : {
              label: 'Sẵn sàng thanh toán',
              detail: 'Quét mã QR hoặc mở ứng dụng, màn hình này sẽ xác minh khoản thanh toán.',
              className: 'border-slate-200 bg-slate-50 text-slate-700',
            }

  const handleConfirm = async () => {
    try {
      setConfirming(true)
      setError('')
      setDemoTopUpSuccess(false)

      if (missingAmountMxc > 0) {
        if (!payment) {
          await createTopUpQr()
          return
        }

        const paid = paymentConfirmed || await checkPaymentStatus(true, 'manual')
        if (!paid) {
          return
        }

        const latestAvailable = await getLatestAvailableBalance()
        if (latestAvailable < additionalFundingNeeded) {
          setError(`Bạn vẫn cần ${formatCurrency(additionalFundingNeeded - latestAvailable)} trước khi đăng.`)
          return
        }
      }

      await onConfirm()
    } catch (confirmError: any) {
      setError(confirmError?.response?.data?.message || 'Không thể đăng công việc này.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !confirming && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md" 
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-[100] w-full max-w-3xl p-4 focus:outline-none"
              >
                <div className="overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] backdrop-blur-2xl ring-1 ring-slate-900/5">
                  <div className="px-6 py-5 sm:px-8 sm:py-7">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/50">
                          <Wallet className="h-7 w-7" />
                        </div>
                        <div>
                          <Dialog.Title className="text-2xl font-extrabold tracking-tight text-slate-900">
                            Nạp tiền công việc trước khi đăng
                          </Dialog.Title>
                          <Dialog.Description className="sr-only">
                            Xem lại chi tiết ngân sách và đảm bảo nguồn tiền để đăng công việc này.
                          </Dialog.Description>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Chỉ ngân sách công việc được bảo vệ bị tạm giữ bây giờ. Quỹ đảm bảo sẽ bắt đầu sau.
                          </p>
                        </div>
                      </div>
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          disabled={confirming}
                          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-50"
                        >
                          <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="mt-8 space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-slate-50 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ngân sách mục tiêu</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(targetFunding)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-slate-50 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đã tạm giữ</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(currentReserved)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-5 shadow-sm ring-1 ring-indigo-100 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-100 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Sử dụng từ ví</p>
                          <p className="mt-2 text-2xl font-black text-indigo-950">{formatCurrency(payFromWalletAmount)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-5 shadow-sm ring-1 ring-rose-100 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-100 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Nạp thêm</p>
                          <p className="mt-2 text-2xl font-black text-rose-950">{formatCurrency(missingAmountMxc)}</p>
                        </div>
                      </div>

                      {/* Summary Banner */}
                      <div className="flex items-start gap-4 rounded-2xl border border-emerald-100/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-5 shadow-sm">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-emerald-900">
                          {summaryText}
                        </p>
                      </div>

                      {demoTopUpSuccess && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
                          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          Tiền nạp Demo đã được thêm vào ví của bạn. Chọn đăng công việc lần nữa để hoàn tất.
                        </motion.div>
                      )}

                      {paymentConfirmed && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
                          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          Tiền nạp PayOS đã được cộng vào ví. Đăng công việc ngay bây giờ sẽ chuyển ngân sách công việc từ số dư ví sang khoản tạm giữ được bảo vệ.
                        </motion.div>
                      )}

                      {refundAmount > 0 && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900 shadow-sm">
                          <Receipt className="h-5 w-5 shrink-0 text-sky-500" />
                          <div>
                            Số tiền dư <span className="font-bold">{formatCurrency(refundAmount)}</span> sẽ được tự động hoàn lại vào ví sau khi đăng/cập nhật thành công.
                          </div>
                        </motion.div>
                      )}

                      {missingAmountMxc > 0 && (
                        <div className="overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white shadow-sm ring-1 ring-amber-100/50">
                          <div className="border-b border-amber-100/50 bg-amber-50/50 px-6 py-5">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-200/50">
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold text-amber-950">Số dư không đủ</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
                                  Bạn đang thiếu <span className="font-bold">{formatCurrency(missingAmountMxc)}</span> (tương đương <span className="font-bold">{formatFiatCurrency(missingAmountVnd, 'VND')}</span>).
                                  {requiresMinimumTopUp ? (
                                    <>
                                      {' '}PayOS yêu cầu nạp tối thiểu <span className="font-bold">{formatFiatCurrency(MIN_PAYOS_VND_AMOUNT, 'VND')}</span>, do đó mã QR được tạo với giá trị <span className="font-bold">{formatFiatCurrency(payosAmountVnd, 'VND')}</span>.
                                    </>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            {payment ? (
                              <div className="flex flex-col gap-6 sm:flex-row">
                                <div className="flex shrink-0 flex-col items-center justify-center">
                                  <div className="relative flex items-center justify-center overflow-hidden rounded-[24px] bg-white p-4 shadow-md ring-1 ring-slate-900/5">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                                    {payment.qrCode ? (
                                      <QRCodeCanvas value={payment.qrCode} size={180} includeMargin className="relative z-10 h-40 w-40 rounded-xl" />
                                    ) : (
                                      <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400">
                                        Mã QR không khả dụng
                                      </div>
                                    )}
                                  </div>
                                  {payment.checkoutUrl && (
                                    <a
                                      href={payment.checkoutUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      Mở trang thanh toán
                                    </a>
                                  )}
                                </div>
                                
                                <div className="flex min-w-0 flex-1 flex-col justify-center space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Số tiền</p>
                                      <p className="mt-1 text-lg font-black text-slate-900">{formatFiatCurrency(payment.amount ?? 0, 'VND')}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mã đơn hàng</p>
                                      <p className="mt-1 truncate text-base font-bold text-slate-900" title={payment.orderCode ? String(payment.orderCode) : undefined}>{payment.orderCode}</p>
                                    </div>
                                  </div>

                                  <div className={`relative overflow-hidden rounded-2xl border p-4 transition-colors duration-300 ${paymentStatus.className}`}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="relative z-10 flex-1 flex flex-col justify-between min-h-[96px]">
                                        <div>
                                          <div className="flex h-6 items-center gap-2">
                                            <p className="font-bold">{paymentStatus.label}</p>
                                            {autoCheckingPayment && <Loader2 className="h-4 w-4 animate-spin text-current opacity-70" />}
                                          </div>
                                          <p className="mt-1 text-sm leading-relaxed opacity-90 line-clamp-2" title={paymentStatus.detail}>
                                            {paymentStatus.detail}
                                          </p>
                                        </div>
                                        <div className="mt-2 h-4">
                                          <p className={`text-xs font-semibold transition-opacity duration-300 ${lastCheckedLabel ? 'opacity-70' : 'opacity-0'}`}>
                                            Cập nhật cuối: {lastCheckedLabel || '...'}
                                          </p>
                                        </div>
                                      </div>
                                      {!paymentConfirmed && (
                                        <div className="shrink-0 pt-1 sm:ml-4">
                                          <button
                                            type="button"
                                            disabled={checkingPayment || confirming}
                                            onClick={() => {
                                              setAutoCheckPaused(false)
                                              void checkPaymentStatus(true, 'manual')
                                            }}
                                            className="relative z-10 inline-flex h-10 w-full sm:w-[140px] items-center justify-center rounded-xl bg-white/60 px-4 text-sm font-bold shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            {manuallyCheckingPayment ? (
                                              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra</span>
                                            ) : 'Kiểm tra trạng thái'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 py-10 text-center">
                                <div className="rounded-full bg-amber-100 p-3 text-amber-600 mb-3">
                                  <Wallet className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-amber-900 mb-4 max-w-[250px]">
                                  Tạo mã QR PayOS để hoàn tất việc nạp tiền an toàn.
                                </p>
                                <button
                                  type="button"
                                  disabled={loadingQr || confirming}
                                  onClick={createTopUpQr}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-60"
                                >
                                  {loadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                  {loadingQr ? 'Đang tạo QR...' : 'Tạo mã QR PayOS'}
                                </button>
                              </div>
                            )}

                            {demoTopUpEnabled && onDemoTopUp && (
                              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    <Sparkles className="h-3.5 w-3.5" /> Demo Nội bộ
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">Mô phỏng khoản nạp tiền thành công trong môi trường phát triển.</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={demoTopUpLoading || confirming}
                                  onClick={runDemoTopUp}
                                  className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-60"
                                >
                                  {demoTopUpLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                  {demoTopUpLoading ? 'Đang thêm...' : 'Nạp tiền Demo'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 shadow-sm">
                          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                          {error}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-col-reverse items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6 sm:flex-row sm:px-8">
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={onClose}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-60 sm:w-auto"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={handleConfirm}
                      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-60 sm:w-auto"
                    >
                      {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 transition-transform group-hover:scale-110" />}
                      {manuallyCheckingPayment ? 'Đang kiểm tra...' : missingAmountMxc > 0 ? 'Tôi đã nạp tiền, đăng ngay' : 'Đăng với ngân sách được bảo vệ'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
