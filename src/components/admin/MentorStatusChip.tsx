import { VerificationStatus } from '@/types'
import { getStatusLabel, statusTone } from '@/pages/admin/mentorVerification.helpers'

export default function MentorStatusChip({ status }: { status?: VerificationStatus | null }) {
  const normalized = status ?? VerificationStatus.NOT_SUBMITTED
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusTone[normalized]}`}>
      {getStatusLabel(normalized)}
    </span>
  )
}
