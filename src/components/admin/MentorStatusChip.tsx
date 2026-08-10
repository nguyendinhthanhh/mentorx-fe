import { VerificationStatus } from '@/types'
import { TranslationKey } from '@/i18n/translations'
import { getStatusLabel, statusTone } from '@/pages/admin/mentorVerification.helpers'
import { useI18n } from '@/i18n/I18nProvider'

export default function MentorStatusChip({ status }: { status?: VerificationStatus | null }) {
  const { t } = useI18n()
  const normalized = status ?? VerificationStatus.NOT_SUBMITTED
  
  const statusKeyMap: Record<VerificationStatus, string> = {
    [VerificationStatus.PENDING]: 'pending',
    [VerificationStatus.APPROVED]: 'approved',
    [VerificationStatus.REJECTED]: 'rejected',
    [VerificationStatus.NEEDS_MORE_INFO]: 'needsMoreInfo',
    [VerificationStatus.NOT_SUBMITTED]: 'notSubmitted',
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusTone[normalized]}`}>
      {t(`admin.mentorVerif.status.${statusKeyMap[normalized]}` as TranslationKey)}
    </span>
  )
}
