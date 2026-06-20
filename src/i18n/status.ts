import { ComplaintStatus, ContractStatus, CourseStatus, JobStatus, ProposalStatus, VerificationStatus } from '@/types'

import { TranslationKey } from './translations'

export const complaintStatusKeys: Record<ComplaintStatus, TranslationKey> = {
  [ComplaintStatus.OPEN]: 'admin.complaints.status.open',
  [ComplaintStatus.AWAITING_RESPONSE]: 'admin.complaints.status.awaiting_response',
  [ComplaintStatus.INVESTIGATING]: 'admin.complaints.status.investigating',
  [ComplaintStatus.EVIDENCE_REVIEW]: 'admin.complaints.status.evidence_review',
  [ComplaintStatus.IN_MEDIATION]: 'admin.complaints.status.in_mediation',
  [ComplaintStatus.RESOLVED]: 'admin.complaints.status.resolved',
  [ComplaintStatus.CLOSED]: 'admin.complaints.status.closed',
  [ComplaintStatus.WITHDRAWN]: 'admin.complaints.status.withdrawn',
  [ComplaintStatus.EXPIRED]: 'admin.complaints.status.expired',
}

export type ComplaintPriorityBucket = 'low' | 'medium' | 'high' | 'urgent'

export const complaintPriorityKeys: Record<ComplaintPriorityBucket, TranslationKey> = {
  low: 'admin.complaints.priority.low',
  medium: 'admin.complaints.priority.medium',
  high: 'admin.complaints.priority.high',
  urgent: 'admin.complaints.priority.urgent',
}

export const jobStatusKeys: Record<JobStatus, TranslationKey> = {
  [JobStatus.DRAFT]: 'status.job.draft',
  [JobStatus.PENDING_APPROVAL]: 'status.job.pendingApproval',
  [JobStatus.OPEN]: 'status.job.open',
  [JobStatus.IN_PROGRESS]: 'status.job.inProgress',
  [JobStatus.COMPLETED]: 'status.job.completed',
  [JobStatus.CANCELLED]: 'status.job.cancelled',
  [JobStatus.CLOSED]: 'status.job.closed',
  [JobStatus.ON_HOLD]: 'status.job.onHold',
  [JobStatus.EXPIRED]: 'status.job.expired',
}

export const proposalStatusKeys: Partial<Record<ProposalStatus, TranslationKey>> = {
  [ProposalStatus.DRAFT]: 'status.proposal.draft',
  [ProposalStatus.SUBMITTED]: 'status.proposal.submitted',
  [ProposalStatus.NEGOTIATING]: 'status.proposal.negotiating',
  [ProposalStatus.OFFER_ACCEPTED]: 'status.proposal.offerAccepted',
  [ProposalStatus.ACCEPTED]: 'status.proposal.accepted',
  [ProposalStatus.REJECTED]: 'status.proposal.rejected',
  [ProposalStatus.AUTO_CLOSED]: 'status.proposal.autoClosed',
  [ProposalStatus.CONTRACT_CANCELLED]: 'status.proposal.contractCancelled',
  [ProposalStatus.WITHDRAWN]: 'status.proposal.withdrawn',
}

export const contractStatusKeys: Partial<Record<ContractStatus, TranslationKey>> = {
  [ContractStatus.ACTIVE]: 'status.contract.active',
  [ContractStatus.COMPLETED]: 'status.contract.completed',
  [ContractStatus.CANCELLED]: 'status.contract.cancelled',
  [ContractStatus.IN_DISPUTE]: 'status.contract.inDispute',
  [ContractStatus.PENDING_PAYMENT]: 'status.contract.pendingPayment',
  [ContractStatus.PAUSED]: 'status.contract.paused',
  [ContractStatus.UNDER_REVIEW]: 'status.contract.underReview',
}

export const courseStatusKeys: Partial<Record<CourseStatus, TranslationKey>> = {
  [CourseStatus.PUBLISHED]: 'status.course.published',
  [CourseStatus.ARCHIVED]: 'status.course.archived',
}

export const verificationStatusKeys: Partial<Record<VerificationStatus, TranslationKey>> = {
  [VerificationStatus.NOT_SUBMITTED]: 'status.payout.notSubmitted',
  [VerificationStatus.PENDING]: 'status.payout.pending',
  [VerificationStatus.APPROVED]: 'status.payout.approved',
  [VerificationStatus.REJECTED]: 'status.payout.rejected',
}
