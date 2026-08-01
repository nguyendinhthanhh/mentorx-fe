import { X, ShieldCheck, FileText } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="relative overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  Terms of Service & Privacy
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-6 text-sm text-slate-600">
              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using MentorX, you accept and agree to be bound by the terms and provision of this agreement. 
                    In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">2. Description of Service</h3>
                  <p>
                    MentorX provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, 
                    and personalized content. You also understand and agree that the service may include certain communications from MentorX.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">3. Escrow and Payments</h3>
                  <p>
                    All transactions made through the platform are secured via our escrow system. Funds are held securely until the 
                    agreed milestones or deliverables are met and approved by the Client. MXC is the official token used within the platform.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">4. Privacy Policy</h3>
                  <p>
                    Your registration data and certain other information about you is subject to our Privacy Policy. For more information, 
                    we never share your personal code or ideas outside of the platform without your explicit permission.
                  </p>
                </section>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
