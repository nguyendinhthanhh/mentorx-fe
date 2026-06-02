import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Briefcase, DollarSign, MessageCircle, Search, Star, Wallet } from 'lucide-react'
import { contractApi } from '@/api/contractApi'
import { courseApi } from '@/api/courseApi'
import { mentorApi } from '@/api/mentorApi'
import { proposalApi } from '@/api/proposalApi'
import { walletApi } from '@/api/walletApi'
import { useAuthStore } from '@/store/authStore'
import { ContractResponse, ContractStatus, CourseResponse, MentorProfileResponse, ProposalResponse, ProposalStatus } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { LoadingRows, MetricCard, PageShell, StateCard, StatusPill } from './shared/MentorHubUI'

export default function MentorDashboardPage() {
  const { user } = useAuthStore()
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadDashboard()
  }, [user?.userId])

  const loadDashboard = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [contractPage, proposalPage, coursePage, mentorProfile, balance] = await Promise.all([
        contractApi.getMine({ page: 0, size: 100 }),
        proposalApi.getByMentor(user.userId, { page: 0, size: 100 }),
        courseApi.getByInstructor(user.userId, { page: 0, size: 100 }),
        mentorApi.getMentorProfile(user.userId).catch(() => null),
        walletApi.getUserBalance(user.userId).catch(() => ({ available: 0 })),
      ])
      setContracts(contractPage.content || [])
      setProposals(proposalPage.content || [])
      setCourses(coursePage.content || [])
      setProfile(mentorProfile)
      setAvailableBalance(Number(balance.available || 0))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load MentorHub overview.')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const activeContracts = contracts.filter((contract) => [ContractStatus.ACTIVE, ContractStatus.UNDER_REVIEW, ContractStatus.IN_DISPUTE].includes(contract.status))
    const inEscrow = activeContracts.reduce((sum, contract) => sum + Number(contract.amountInEscrow || 0), 0)
    const awaitingProposals = proposals.filter((proposal) => [ProposalStatus.SUBMITTED, ProposalStatus.NEGOTIATING, ProposalStatus.OFFER_ACCEPTED].includes(proposal.status)).length
    const publishedCourses = courses.filter((course) => String(course.status) === 'PUBLISHED').length
    return {
      activeContracts: activeContracts.length,
      inEscrow,
      awaitingProposals,
      availableBalance,
      publishedCourses,
      averageRating: Number(profile?.averageRating || 0),
    }
  }, [availableBalance, contracts, courses, profile?.averageRating, proposals])

  const recentProposals = useMemo(
    () => [...proposals].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 5),
    [proposals]
  )

  if (loading) {
    return (
      <PageShell eyebrow="MentorHub" title="Overview" description="Loading your real mentor activity.">
        <LoadingRows rows={6} />
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell eyebrow="MentorHub" title="Overview" description="Your mentor activity could not be loaded.">
        <StateCard tone="error" title="Unable to load dashboard" message={error} action={<button onClick={loadDashboard} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Retry</button>} />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="MentorHub"
      title={`Welcome back, ${user?.displayName || user?.fullName || 'mentor'}`}
      description="A compact overview of contracts, proposals, courses, wallet balance, and reputation using backend data only."
      actions={
        <Link to="/mentor/profile-setup" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
          Improve profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active contracts" value={summary.activeContracts} helper="Active, review, or disputed work." icon={<Briefcase className="h-5 w-5" />} />
        <MetricCard label="In escrow" value={formatCurrency(summary.inEscrow)} helper="Locked, not released earnings." icon={<Wallet className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Available balance" value={formatCurrency(summary.availableBalance)} helper="Withdrawable after payout approval." icon={<DollarSign className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Average rating" value={`${summary.averageRating.toFixed(1)} / 5`} helper={`${profile?.totalReviews || 0} public reviews.`} icon={<Star className="h-5 w-5" />} tone="slate" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent proposals</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{summary.awaitingProposals} proposals or offers need attention.</p>
            </div>
            <Link to="/mentor/proposals" className="text-sm font-black text-indigo-600">View all</Link>
          </div>
          {recentProposals.length === 0 ? (
            <StateCard title="No proposals yet" message="Start from Find Jobs and submit proposals to clients that match your expertise." action={<Link to="/mentor/jobs" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white"><Search className="h-4 w-4" /> Find jobs</Link>} />
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recentProposals.map((proposal) => (
                <Link key={proposal.id} to={`/mentor/proposals?proposalId=${proposal.id}`} className="flex flex-col gap-3 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{proposal.jobTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatRelativeTime(proposal.updatedAt || proposal.createdAt)} - {formatCurrency(proposal.proposedAmount || proposal.proposedHourlyRate || 0)}</p>
                  </div>
                  <StatusPill label={formatProposalStatus(proposal.status)} tone={proposal.status === ProposalStatus.ACCEPTED ? 'emerald' : proposal.status === ProposalStatus.REJECTED ? 'rose' : 'indigo'} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Quick actions</h2>
            <div className="mt-4 grid gap-3">
              <QuickLink to="/mentor/jobs" icon={<Search className="h-4 w-4" />} label="Find jobs" />
              <QuickLink to="/mentor/contracts" icon={<Briefcase className="h-4 w-4" />} label="View contracts" />
              <QuickLink to="/mentor/courses" icon={<BookOpen className="h-4 w-4" />} label={`My courses (${summary.publishedCourses} published)`} />
              <QuickLink to="/mentor/messages" icon={<MessageCircle className="h-4 w-4" />} label="Open messages" />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Schedule</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">No booking/session API is available, so this overview does not show fake meetings.</p>
            <Link to="/mentor/schedule" className="mt-4 inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              Manage availability
            </Link>
          </section>
        </aside>
      </div>
    </PageShell>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

function formatProposalStatus(status: string) {
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    NEGOTIATING: 'Negotiating',
    OFFER_ACCEPTED: 'Offer agreed',
    ACCEPTED: 'Contract active',
    REJECTED: 'Rejected',
    AUTO_CLOSED: 'Closed',
    CONTRACT_CANCELLED: 'Contract cancelled',
    WITHDRAWN: 'Withdrawn',
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}
