import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { QRCodeCanvas } from 'qrcode.react'
import { AlertCircle, ArrowRight, CheckCircle, Loader2, Wallet, X } from 'lucide-react'
import { paymentApi, type PayOSPaymentResponse } from '@/api/paymentApi'
import { formatCurrency, formatFiatCurrency } from '@/utils/formatters'

const MXC_TO_VND_RATE = 1000
const MIN_PAYOS_VND_AMOUNT = 10000

interface JobFundingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  targetFundingMxc: number
  currentReservedMxc?: number
  availableBalanceMxc?: number
  getLatestAvailableBalance: () => Promise<number>
}

export default function JobFundingModal({
  isOpen,
  onClose,
  onConfirm,
  targetFundingMxc,
  currentReservedMxc = 0,
  availableBalanceMxc = 0,
  getLatestAvailableBalance,
}: JobFundingModalProps) {
  const [payment, setPayment] = useState<PayOSPaymentResponse | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setPayment(null)
    setLoadingQr(false)
    setConfirming(false)
    setError('')
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
      return 'This job does not need a funded budget.'
    }
    if (additionalFundingNeeded <= 0 && refundAmount <= 0) {
      return 'This job is already fully funded. You can publish it immediately.'
    }
    if (refundAmount > 0) {
      return `${formatCurrency(refundAmount)} MXC will return to your wallet after publishing because the new budget is lower than the amount already held.`
    }
    if (missingAmountMxc > 0) {
      return `You need ${formatCurrency(missingAmountMxc)} MXC more to publish this job with protected funding.`
    }
    return `${formatCurrency(payFromWalletAmount)} MXC will be taken from your current wallet balance when you publish this job.`
  }, [additionalFundingNeeded, missingAmountMxc, payFromWalletAmount, refundAmount, targetFunding])

  const createTopUpQr = async () => {
    if (missingAmountMxc <= 0 || missingAmountVnd <= 0) {
      return
    }

    try {
      setLoadingQr(true)
      setError('')
      const response = await paymentApi.createPayOSPayment({
        amount: payosAmountVnd.toString(),
        currency: 'VND',
        orderInfo: `Job funding top-up - missing ${formatCurrency(missingAmountMxc)} MXC`,
      })

      if (response.code === '00' && (response.qrCode || response.checkoutUrl)) {
        setPayment(response)
        return
      }

      setError(response.message || 'Could not create a PayOS payment link.')
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Could not create a PayOS payment link.')
    } finally {
      setLoadingQr(false)
    }
  }

  const handleConfirm = async () => {
    try {
      setConfirming(true)
      setError('')

      if (missingAmountMxc > 0) {
        if (!payment) {
          await createTopUpQr()
          return
        }

        const latestAvailable = await getLatestAvailableBalance()
        if (latestAvailable < additionalFundingNeeded) {
          setError(`You still need ${formatCurrency(additionalFundingNeeded - latestAvailable)} MXC before publishing.`)
          return
        }
      }

      await onConfirm()
    } catch (confirmError: any) {
      setError(confirmError?.response?.data?.message || 'Could not publish this job.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !confirming && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-none">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-slate-950">Fund job before publishing</Dialog.Title>
                  <p className="text-sm text-slate-500">Only the protected job budget is held now. Escrow still starts later, when you accept a mentor.</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={confirming}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Target budget hold</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">{formatCurrency(targetFunding)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Already held</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">{formatCurrency(currentReserved)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Use from wallet now</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(payFromWalletAmount)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Need extra top-up</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(missingAmountMxc)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                {summaryText}
              </div>

              {refundAmount > 0 && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                  The extra <span className="font-bold">{formatCurrency(refundAmount)}</span> MXC will be returned to your wallet automatically after this publish/update succeeds.
                </div>
              )}

              {missingAmountMxc > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-900">Need more balance before publishing</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Missing <span className="font-bold">{formatCurrency(missingAmountMxc)}</span>, equivalent to{' '}
                        <span className="font-bold">{formatFiatCurrency(missingAmountVnd, 'VND')}</span>.
                        {requiresMinimumTopUp ? (
                          <>
                            {' '}
                            PayOS requires at least <span className="font-bold">{formatFiatCurrency(MIN_PAYOS_VND_AMOUNT, 'VND')}</span>, so this QR will be created for{' '}
                            <span className="font-bold">{formatFiatCurrency(payosAmountVnd, 'VND')}</span>.
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {payment ? (
                    <div className="mt-4 grid gap-4 rounded-2xl border border-amber-100 bg-white p-4 sm:grid-cols-[160px_1fr]">
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        {payment.qrCode ? (
                          <QRCodeCanvas value={payment.qrCode} size={160} includeMargin className="h-36 w-36 rounded-xl" />
                        ) : (
                          <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                            QR unavailable
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Real payment</p>
                          <p className="mt-1 font-bold text-slate-950">{formatFiatCurrency(payment.amount ?? 0, 'VND')}</p>
                          <p className="mt-1 text-slate-600">Order code: {payment.orderCode}</p>
                        </div>
                        {payment.checkoutUrl && (
                          <a
                            href={payment.checkoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Open payment page
                          </a>
                        )}
                        {payment.paymentLinkId && (
                          <p className="break-all text-xs text-slate-500">Payment link: {payment.paymentLinkId}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-white/70 px-4 py-4 text-sm text-amber-900">
                      Select <span className="font-bold">Create PayOS QR</span> to top up without leaving this screen.
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              {missingAmountMxc > 0 && !payment && (
                <button
                  type="button"
                  disabled={loadingQr || confirming}
                  onClick={createTopUpQr}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-white px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                >
                  {loadingQr ? 'Creating QR...' : 'Create PayOS QR'}
                </button>
              )}
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {missingAmountMxc > 0 ? 'I topped up, publish now' : 'Publish with protected funding'}
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
