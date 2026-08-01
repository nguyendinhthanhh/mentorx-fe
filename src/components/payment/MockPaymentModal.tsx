import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, Wallet, ShieldCheck, ArrowRight } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface MockPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  amountMxc?: number
}

export default function MockPaymentModal({ isOpen, onClose, onSuccess, amountMxc = 0 }: MockPaymentModalProps) {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE')

  // Reset status when modal opens
  useEffect(() => {
    if (isOpen) setStatus('IDLE')
  }, [isOpen])

  const handlePay = () => {
    setStatus('PROCESSING')
    setTimeout(() => {
      setStatus('SUCCESS')
      setTimeout(() => {
        onSuccess()
      }, 1000)
    }, 1500)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && status !== 'PROCESSING' && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="relative overflow-hidden rounded-[24px] bg-white shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  Fund Escrow
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button 
                  disabled={status !== 'IDLE'}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {status === 'SUCCESS' ? (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Successful</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Your funds are now secured in escrow. Posting your request...
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-6 rounded-2xl bg-slate-50 p-5 text-center border border-slate-100">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total to deposit</p>
                    <p className="text-4xl font-extrabold text-[#1b2252] tracking-tight">
                      {amountMxc || 0} <span className="text-xl text-slate-400">MXC</span>
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-emerald-500/30 hover:bg-emerald-50/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <img src="https://img.icons8.com/color/48/000000/metamask-logo.png" alt="MetaMask" className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">MetaMask Wallet</p>
                          <p className="text-xs text-slate-500">Balance: 1,250.00 MXC</p>
                        </div>
                      </div>
                      <div className="h-4 w-4 rounded-full border-[5px] border-emerald-500"></div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />
                    <p className="leading-relaxed">
                      This amount will be locked in an escrow smart contract. It will only be released to the mentor once you approve their work.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {status !== 'SUCCESS' && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button
                  disabled={status === 'PROCESSING'}
                  onClick={handlePay}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'PROCESSING' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing Transaction...
                    </>
                  ) : (
                    <>
                      Pay & Secure Funds
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
