import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  FileBadge2,
  Loader2,
  Lock,
  ScanFace,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { kycApi, KycStatusResponse } from '@/api/kycApi'
import KycStepWizard from '@/components/kyc/KycStepWizard'
import { IdentityDocumentType, VerificationStatus } from '@/types'

interface EkycVerificationProps {
  onSuccess?: (data: KycStatusResponse) => void
}

const DOCUMENT_OPTIONS: Record<string, IdentityDocumentType[]> = {
  VN: [IdentityDocumentType.CCCD, IdentityDocumentType.CMND, IdentityDocumentType.PASSPORT],
  DEFAULT: [IdentityDocumentType.PASSPORT, IdentityDocumentType.NATIONAL_ID, IdentityDocumentType.DRIVER_LICENSE],
}

export default function EkycVerification({ onSuccess }: EkycVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [country, setCountry] = useState('VN')
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(IdentityDocumentType.CCCD)
  const [documentNumber, setDocumentNumber] = useState('')

  const { data: status, refetch, isLoading } = useQuery(['kyc-status'], () => kycApi.getKycStatus(), {
    retry: false,
  })

  const documentOptions = useMemo(
    () => (country === 'VN' ? DOCUMENT_OPTIONS.VN : DOCUMENT_OPTIONS.DEFAULT),
    [country]
  )

  const activeStatus = status?.identityStatus ?? VerificationStatus.NOT_SUBMITTED
  const requiresBackImage = documentType !== IdentityDocumentType.PASSPORT
  const badgeCopy = status?.identityRequired ? 'Required before withdrawal' : 'Optional now'

  const handleKycComplete = async ({
    front,
    back,
    video,
  }: {
    front: File
    back?: File
    video: File
  }) => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('cccdFront', front)
      if (back) formData.append('cccdBack', back)
      formData.append('livenessVideo', video)
      formData.append('country', country)
      formData.append('documentType', documentType)
      if (documentNumber.trim()) formData.append('documentNumber', documentNumber.trim())

      const data = await kycApi.submitKyc(formData)
      await refetch()
      setIsOpen(false)
      toast.success('Identity verification was submitted.')
      onSuccess?.(data)
    } catch (err: unknown) {
      let message = 'Identity verification failed. Please try again.'
      if (err instanceof Error && err.message) message = err.message
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Identity verification
                </span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Verify identity for trust and payout
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              We only request identity verification when it is needed for trust, payouts, fraud prevention,
              or compliance. You can apply as a mentor without uploading identity documents first.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Current policy</p>
            <p className="mt-1">{badgeCopy}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading verification status...
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Current status</p>
                  <div className="mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold">
                    {getIdentityStatusLabel(activeStatus, !!status?.identityRequired)}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {status?.documentType && <p>Document type: {formatDocumentType(status.documentType)}</p>}
                  {status?.documentNumberMasked && <p className="mt-1">Reference: {status.documentNumberMasked}</p>}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoBlock
                  icon={<FileBadge2 className="h-4 w-4" />}
                  title="Trusted badge"
                  text="Approved identity can be used later to support a Verified Mentor badge."
                />
                <InfoBlock
                  icon={<Lock className="h-4 w-4" />}
                  title="Withdrawal policy"
                  text="When payout or compliance policy requires it, identity must be approved before withdrawal."
                />
              </div>

              {status?.rejectionReason && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <p className="font-semibold">Review note</p>
                  <p className="mt-1 leading-6">{status.rejectionReason}</p>
                </div>
              )}

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(event) => {
                        const nextCountry = event.target.value
                        setCountry(nextCountry)
                        const nextOptions = nextCountry === 'VN' ? DOCUMENT_OPTIONS.VN : DOCUMENT_OPTIONS.DEFAULT
                        setDocumentType(nextOptions[0])
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="SG">Singapore</option>
                      <option value="JP">Japan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Document type
                    </label>
                    <select
                      value={documentType}
                      onChange={(event) => setDocumentType(event.target.value as IdentityDocumentType)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      {documentOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatDocumentType(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Document number
                  </label>
                  <input
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    placeholder="Used for masked reference and manual review if needed"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1.5">Video liveness check required</span>
                  <span className="rounded-full bg-white px-3 py-1.5">
                    {requiresBackImage ? 'Front and back images required' : 'Single document image supported'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setIsOpen(true)
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Start identity verification
                </button>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <InfoRailCard
            icon={<BadgeCheck className="h-4 w-4" />}
            title="Not required for Mentor Mode"
            body="Professional profile and expertise approval unlock Mentor Mode. Identity is a separate trust and payout step."
          />
          <InfoRailCard
            icon={<ScanFace className="h-4 w-4" />}
            title="Country-aware documents"
            body="Vietnam mentors can use CCCD, CMND, or Passport. International mentors can use Passport, National ID, or Driver License when supported."
          />
          <InfoRailCard
            icon={<Clock3 className="h-4 w-4" />}
            title="Manual review may apply"
            body="Higher-risk cases, large payouts, or repeated reports can trigger additional review even after an automatic pass."
          />
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Secure verification
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  {formatDocumentType(documentType)} verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-900">Processing verification</p>
                    <p className="mt-1 text-xs text-slate-500">
                      We are validating the document, liveness, and face match results.
                    </p>
                  </div>
                </div>
              ) : (
                <KycStepWizard
                  onComplete={handleKycComplete}
                  documentLabel={formatDocumentType(documentType)}
                  requiresBackImage={requiresBackImage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBlock({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-900">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

function InfoRailCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-slate-900">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <h3 className="text-sm font-black">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  )
}

function formatDocumentType(type: IdentityDocumentType) {
  switch (type) {
    case IdentityDocumentType.CCCD:
      return 'CCCD'
    case IdentityDocumentType.CMND:
      return 'CMND'
    case IdentityDocumentType.PASSPORT:
      return 'Passport'
    case IdentityDocumentType.NATIONAL_ID:
      return 'National ID'
    case IdentityDocumentType.DRIVER_LICENSE:
      return 'Driver License'
    default:
      return type
  }
}

function getIdentityStatusLabel(status: VerificationStatus, required: boolean) {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'Pending review'
    case VerificationStatus.APPROVED:
      return 'Approved'
    case VerificationStatus.REJECTED:
      return 'Rejected'
    case VerificationStatus.NEEDS_MORE_INFO:
      return 'Needs more info'
    default:
      return required ? 'Required before withdrawal' : 'Optional'
  }
}
