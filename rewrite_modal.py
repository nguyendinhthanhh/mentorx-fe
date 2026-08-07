import os
import re

filepath = r"d:\Mentor X\mentorx-fe\src\components\payment\JobFundingModal.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { AlertCircle, ArrowRight, CheckCircle, Loader2, Wallet, X } from 'lucide-react'",
    "import { AlertCircle, ArrowRight, CheckCircle, Loader2, Wallet, X, ShieldCheck, CreditCard, Sparkles, Receipt } from 'lucide-react'\nimport { motion, AnimatePresence } from 'framer-motion'"
)

# Find return statement using regex to be safe
match = re.search(r'\s*return\s*\(\s*<Dialog\.Root', content)
if not match:
    print('Could not find return statement')
    exit(1)

return_start = match.start()

new_return = """  return (
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
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-[100] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-none"
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
                            Fund job before publishing
                          </Dialog.Title>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Only the protected job budget is held now. Escrow starts later.
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
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target budget</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(targetFunding)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-slate-50 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Already held</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(currentReserved)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-5 shadow-sm ring-1 ring-indigo-100 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-100 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Wallet usage</p>
                          <p className="mt-2 text-2xl font-black text-indigo-950">{formatCurrency(payFromWalletAmount)}</p>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-5 shadow-sm ring-1 ring-rose-100 transition-all hover:shadow-md">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-100 opacity-50 blur-xl"></div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Extra top-up</p>
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
                          Demo top-up added to your local wallet. Select publish again to finish the test.
                        </motion.div>
                      )}

                      {paymentConfirmed && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
                          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          PayOS top-up was credited to your wallet. Publishing now will move the job budget from wallet balance into the protected hold.
                        </motion.div>
                      )}

                      {refundAmount > 0 && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900 shadow-sm">
                          <Receipt className="h-5 w-5 shrink-0 text-sky-500" />
                          <div>
                            The extra <span className="font-bold">{formatCurrency(refundAmount)}</span> will be returned to your wallet automatically after this publish/update succeeds.
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
                                <p className="text-base font-bold text-amber-950">Insufficient balance</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
                                  You are missing <span className="font-bold">{formatCurrency(missingAmountMxc)}</span> (equivalent to <span className="font-bold">{formatFiatCurrency(missingAmountVnd, 'VND')}</span>).
                                  {requiresMinimumTopUp ? (
                                    <>
                                      {' '}PayOS requires at least <span className="font-bold">{formatFiatCurrency(MIN_PAYOS_VND_AMOUNT, 'VND')}</span>, so the QR is created for <span className="font-bold">{formatFiatCurrency(payosAmountVnd, 'VND')}</span>.
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
                                        QR unavailable
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
                                      Open payment page
                                    </a>
                                  )}
                                </div>
                                
                                <div className="flex min-w-0 flex-1 flex-col justify-center space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</p>
                                      <p className="mt-1 text-lg font-black text-slate-900">{formatFiatCurrency(payment.amount ?? 0, 'VND')}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Code</p>
                                      <p className="mt-1 truncate text-base font-bold text-slate-900" title={payment.orderCode}>{payment.orderCode}</p>
                                    </div>
                                  </div>

                                  <div className={`relative overflow-hidden rounded-2xl border p-4 ${paymentStatus.className}`}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="relative z-10">
                                        <p className="font-bold flex items-center gap-2">
                                          {paymentStatus.label}
                                          {autoCheckingPayment && <Loader2 className="h-3 w-3 animate-spin" />}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed opacity-90">{paymentStatus.detail}</p>
                                        {lastCheckedLabel && (
                                          <p className="mt-2 text-xs font-semibold opacity-70">Last checked: {lastCheckedLabel}</p>
                                        )}
                                      </div>
                                      {!paymentConfirmed && (
                                        <button
                                          type="button"
                                          disabled={checkingPayment || confirming}
                                          onClick={() => {
                                            setAutoCheckPaused(false)
                                            void checkPaymentStatus(true, 'manual')
                                          }}
                                          className="relative z-10 inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white/60 px-4 text-sm font-bold shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {manuallyCheckingPayment ? (
                                            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking...</span>
                                          ) : 'Check status'}
                                        </button>
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
                                  Generate a PayOS QR code to complete your top-up securely.
                                </p>
                                <button
                                  type="button"
                                  disabled={loadingQr || confirming}
                                  onClick={createTopUpQr}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-60"
                                >
                                  {loadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                  {loadingQr ? 'Creating QR...' : 'Create PayOS QR'}
                                </button>
                              </div>
                            )}

                            {demoTopUpEnabled && onDemoTopUp && (
                              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    <Sparkles className="h-3.5 w-3.5" /> Local Demo
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">Simulate a successful deposit in development mode.</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={demoTopUpLoading || confirming}
                                  onClick={runDemoTopUp}
                                  className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-60"
                                >
                                  {demoTopUpLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                  {demoTopUpLoading ? 'Adding...' : 'Demo top-up'}
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
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={handleConfirm}
                      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-60 sm:w-auto"
                    >
                      {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 transition-transform group-hover:scale-110" />}
                      {manuallyCheckingPayment ? 'Checking payment...' : missingAmountMxc > 0 ? 'I topped up, publish now' : 'Publish with protected funding'}
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
"""

content = content[:return_start] + new_return
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Success")
