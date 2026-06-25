import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Bell, CalendarDays, CreditCard, Eye, LockKeyhole, Save, ShieldCheck, UserCircle } from 'lucide-react'
import { bankAccountApi } from '@/api/bankAccountApi'
import { mentorApi } from '@/api/mentorApi'
import { notificationPreferenceApi, NotificationPreferenceResponse } from '@/api/notificationPreferenceApi'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { BankAccountResponse, MentorProfileRequest, MentorProfileResponse, PayoutMethod, UserUpdateRequest } from '@/types'
import { LoadingRows, PageShell, SelectInput, StateCard, StatusPill, TextInput } from './shared/MentorHubUI'

type TabKey = 'profile' | 'mentor' | 'payout' | 'availability' | 'notifications' | 'privacy' | 'account'

const tabs: Array<{ key: TabKey; label: string; icon: typeof UserCircle }> = [
  { key: 'profile', label: 'Profile', icon: UserCircle },
  { key: 'mentor', label: 'Mentor profile', icon: ShieldCheck },
  { key: 'payout', label: 'Payout', icon: CreditCard },
  { key: 'availability', label: 'Availability', icon: CalendarDays },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'privacy', label: 'Privacy & safety', icon: Eye },
  { key: 'account', label: 'Account', icon: LockKeyhole },
]

const blankMentorForm = {
  headline: '',
  professionalBio: '',
  primaryDomain: '',
  skills: '',
  currentTitle: '',
  currentCompany: '',
  yearsOfExperience: '',
  hourlyRateMxc: '',
  availability: '',
  languages: '',
  location: '',
  helpDescription: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  portfolioEvidenceUrl: '',
  videoIntroUrl: '',
  cvUrl: '',
  certificateUrl: '',
}

export default function MentorSettingsPage() {
  const { user, setUser, refreshUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [mentorProfile, setMentorProfile] = useState<MentorProfileResponse | null>(null)
  const [payoutAccount, setPayoutAccount] = useState<BankAccountResponse | null>(null)
  const [notifications, setNotifications] = useState<NotificationPreferenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    displayName: user?.displayName || '',
    avatarUrl: user?.avatarUrl || '',
    bio: user?.bio || '',
    countryCode: user?.countryCode || '',
  })
  const [mentorForm, setMentorForm] = useState(blankMentorForm)
  const [payoutForm, setPayoutForm] = useState({
    payoutMethod: PayoutMethod.LOCAL_BANK,
    payoutCountry: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    bankCode: '',
    branchName: '',
    notes: '',
  })
  const [privacyForm, setPrivacyForm] = useState({
    profileIsPublic: user?.profileIsPublic ?? true,
  })

  useEffect(() => {
    void loadSettings()
  }, [user?.userId])

  const loadSettings = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const [profile, payout, preference] = await Promise.all([
        mentorApi.getMentorProfile(user.userId),
        bankAccountApi.getDefault(user.userId),
        notificationPreferenceApi.getOrCreateForUser(user.userId).catch(() => null),
      ])
      setMentorProfile(profile)
      setPayoutAccount(payout)
      setNotifications(preference)
      setProfileForm({
        fullName: user.fullName || '',
        displayName: user.displayName || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        countryCode: user.countryCode || '',
      })
      setPrivacyForm({ profileIsPublic: user.profileIsPublic ?? true })
      setMentorForm({
        headline: profile.headline || '',
        professionalBio: profile.professionalBio || '',
        primaryDomain: profile.primaryDomain || '',
        skills: (profile.skills || []).join(', '),
        currentTitle: profile.currentTitle || '',
        currentCompany: profile.currentCompany || '',
        yearsOfExperience: profile.yearsOfExperience?.toString() || '',
        hourlyRateMxc: profile.hourlyRateMxc?.toString() || '',
        availability: profile.availability || '',
        languages: (profile.languages || []).join(', '),
        location: profile.location || '',
        helpDescription: profile.helpDescription || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        portfolioEvidenceUrl: profile.portfolioEvidenceUrl || '',
        videoIntroUrl: profile.videoIntroUrl || '',
        cvUrl: profile.cvUrl || '',
        certificateUrl: profile.certificateUrl || '',
      })
      if (payout) {
        setPayoutForm({
          payoutMethod: payout.payoutMethod || PayoutMethod.LOCAL_BANK,
          payoutCountry: payout.payoutCountry || '',
          bankName: payout.bankName || '',
          accountHolderName: payout.accountHolderName || '',
          accountNumber: '',
          bankCode: payout.bankCode || '',
          branchName: payout.branchName || '',
          notes: payout.notes || '',
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load mentor settings.')
    } finally {
      setLoading(false)
    }
  }

  const payoutStatus = mentorProfile?.payoutStatus || user?.payoutStatus || 'NOT_SUBMITTED'
  const notificationForm = useMemo(() => ({
    emailEnabled: notifications?.emailEnabled ?? true,
    pushEnabled: notifications?.pushEnabled ?? true,
    inAppEnabled: notifications?.inAppEnabled ?? true,
  }), [notifications])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    try {
      setSaving(true)
      const payload: UserUpdateRequest = {
        fullName: profileForm.fullName.trim(),
        displayName: emptyToUndefined(profileForm.displayName),
        avatarUrl: emptyToUndefined(profileForm.avatarUrl),
        bio: emptyToUndefined(profileForm.bio),
        countryCode: emptyToUndefined(profileForm.countryCode),
        profileIsPublic: privacyForm.profileIsPublic,
      }
      const updated = await userApi.updateUser(user.userId, payload)
      setUser(updated)
      toast.success('Profile settings saved.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const saveMentorProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    const bio = mentorForm.professionalBio.trim()
    const help = mentorForm.helpDescription.trim()
    if (bio && bio.length < 50) {
      toast.error('Professional bio must be at least 50 characters.')
      return
    }
    if (help && help.length < 30) {
      toast.error('Help description must be at least 30 characters.')
      return
    }
    try {
      setSaving(true)
      const payload: MentorProfileRequest = {
        headline: emptyToUndefined(mentorForm.headline),
        professionalBio: emptyToUndefined(bio),
        primaryDomain: emptyToUndefined(mentorForm.primaryDomain),
        skills: splitCsv(mentorForm.skills),
        currentTitle: emptyToUndefined(mentorForm.currentTitle),
        currentCompany: emptyToUndefined(mentorForm.currentCompany),
        yearsOfExperience: mentorForm.yearsOfExperience ? Number(mentorForm.yearsOfExperience) : undefined,
        hourlyRateMxc: mentorForm.hourlyRateMxc ? Number(mentorForm.hourlyRateMxc) : undefined,
        availability: emptyToUndefined(mentorForm.availability),
        languages: splitCsv(mentorForm.languages),
        location: emptyToUndefined(mentorForm.location),
        helpDescription: emptyToUndefined(help),
        linkedinUrl: emptyToUndefined(mentorForm.linkedinUrl),
        githubUrl: emptyToUndefined(mentorForm.githubUrl),
        portfolioUrl: emptyToUndefined(mentorForm.portfolioUrl),
        portfolioEvidenceUrl: emptyToUndefined(mentorForm.portfolioEvidenceUrl),
        videoIntroUrl: emptyToUndefined(mentorForm.videoIntroUrl),
        cvUrl: emptyToUndefined(mentorForm.cvUrl),
        certificateUrl: emptyToUndefined(mentorForm.certificateUrl),
        mentorAgreementAccepted: mentorProfile?.mentorAgreementAccepted,
        disputePolicyAccepted: mentorProfile?.disputePolicyAccepted,
      }
      const updated = await mentorApi.updateMentorProfile(user.userId, payload)
      setMentorProfile(updated)
      await refreshUser()
      toast.success('Mentor profile saved.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save mentor profile.')
    } finally {
      setSaving(false)
    }
  }

  const savePayout = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    try {
      setSaving(true)
      const payload = {
        payoutMethod: payoutForm.payoutMethod,
        payoutCountry: payoutForm.payoutCountry.trim(),
        bankName: payoutForm.bankName.trim(),
        accountHolderName: payoutForm.accountHolderName.trim(),
        accountNumber: payoutForm.accountNumber.trim() || payoutAccount?.accountNumber || '',
        bankCode: emptyToUndefined(payoutForm.bankCode),
        branchName: emptyToUndefined(payoutForm.branchName),
        isDefault: true,
        notes: emptyToUndefined(payoutForm.notes),
      }
      if (payoutAccount?.id) {
        const updated = await bankAccountApi.update(user.userId, payoutAccount.id, payload)
        setPayoutAccount(updated)
      } else {
        const created = await bankAccountApi.create(user.userId, payload)
        setPayoutAccount(created)
      }
      await loadSettings()
      toast.success('Payout account submitted for review.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save payout account.')
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async (next = notificationForm) => {
    if (!user?.userId) return
    try {
      setSaving(true)
      const updated = await notificationPreferenceApi.updateByUserId(user.userId, {
        userId: user.userId,
        emailEnabled: next.emailEnabled,
        pushEnabled: next.pushEnabled,
        inAppEnabled: next.inAppEnabled,
        emailTypeSettings: notifications?.emailTypeSettings || '{}',
        pushTypeSettings: notifications?.pushTypeSettings || '{}',
      })
      setNotifications(updated)
      toast.success('Notification preferences saved.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save notifications.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Settings"
      description="Manage your mentor profile, payout setup, notifications, privacy, and account mode."
    >
      {loading ? (
        <LoadingRows rows={5} />
      ) : error ? (
        <StateCard tone="error" title="Unable to load settings" message={error} action={<button onClick={loadSettings} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Retry</button>} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex h-10 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeTab === 'profile' ? (
              <SettingsForm title="Profile" subtitle="Basic account fields visible around Mentor X." onSubmit={saveProfile} saving={saving}>
                <Field label="Full name"><TextInput value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })} className="w-full" required /></Field>
                <Field label="Display name"><TextInput value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} className="w-full" /></Field>
                <Field label="Avatar URL"><TextInput value={profileForm.avatarUrl} onChange={(event) => setProfileForm({ ...profileForm, avatarUrl: event.target.value })} className="w-full" /></Field>
                <Field label="Short bio"><textarea value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" /></Field>
                <Field label="Country code"><TextInput value={profileForm.countryCode} onChange={(event) => setProfileForm({ ...profileForm, countryCode: event.target.value })} className="w-full" /></Field>
              </SettingsForm>
            ) : null}

            {activeTab === 'mentor' ? (
              <SettingsForm title="Mentor profile" subtitle="Professional information used for mentor review and public matching." onSubmit={saveMentorProfile} saving={saving}>
                <Field label="Headline"><TextInput value={mentorForm.headline} onChange={(event) => setMentorForm({ ...mentorForm, headline: event.target.value })} className="w-full" /></Field>
                <Field label="Professional bio"><textarea value={mentorForm.professionalBio} onChange={(event) => setMentorForm({ ...mentorForm, professionalBio: event.target.value })} className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Primary domain"><TextInput value={mentorForm.primaryDomain} onChange={(event) => setMentorForm({ ...mentorForm, primaryDomain: event.target.value })} className="w-full" /></Field>
                  <Field label="Skills, comma-separated"><TextInput value={mentorForm.skills} onChange={(event) => setMentorForm({ ...mentorForm, skills: event.target.value })} className="w-full" /></Field>
                  <Field label="Current title"><TextInput value={mentorForm.currentTitle} onChange={(event) => setMentorForm({ ...mentorForm, currentTitle: event.target.value })} className="w-full" /></Field>
                  <Field label="Current company"><TextInput value={mentorForm.currentCompany} onChange={(event) => setMentorForm({ ...mentorForm, currentCompany: event.target.value })} className="w-full" /></Field>
                  <Field label="Years of experience"><TextInput type="number" min={0} value={mentorForm.yearsOfExperience} onChange={(event) => setMentorForm({ ...mentorForm, yearsOfExperience: event.target.value })} className="w-full" /></Field>
                  <Field label="Hourly rate (MXC)"><TextInput type="number" min={0} value={mentorForm.hourlyRateMxc} onChange={(event) => setMentorForm({ ...mentorForm, hourlyRateMxc: event.target.value })} className="w-full" /></Field>
                  <Field label="Availability note"><TextInput value={mentorForm.availability} onChange={(event) => setMentorForm({ ...mentorForm, availability: event.target.value })} className="w-full" /></Field>
                  <Field label="Languages"><TextInput value={mentorForm.languages} onChange={(event) => setMentorForm({ ...mentorForm, languages: event.target.value })} className="w-full" /></Field>
                  <Field label="Location / timezone"><TextInput value={mentorForm.location} onChange={(event) => setMentorForm({ ...mentorForm, location: event.target.value })} className="w-full" /></Field>
                </div>
                <Field label="What can you help learners with?"><textarea value={mentorForm.helpDescription} onChange={(event) => setMentorForm({ ...mentorForm, helpDescription: event.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="LinkedIn URL"><TextInput value={mentorForm.linkedinUrl} onChange={(event) => setMentorForm({ ...mentorForm, linkedinUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="GitHub URL"><TextInput value={mentorForm.githubUrl} onChange={(event) => setMentorForm({ ...mentorForm, githubUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="Portfolio URL"><TextInput value={mentorForm.portfolioUrl} onChange={(event) => setMentorForm({ ...mentorForm, portfolioUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="Proof of work URL"><TextInput value={mentorForm.portfolioEvidenceUrl} onChange={(event) => setMentorForm({ ...mentorForm, portfolioEvidenceUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="Intro video URL"><TextInput value={mentorForm.videoIntroUrl} onChange={(event) => setMentorForm({ ...mentorForm, videoIntroUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="Resume / CV URL"><TextInput value={mentorForm.cvUrl} onChange={(event) => setMentorForm({ ...mentorForm, cvUrl: event.target.value })} className="w-full" /></Field>
                  <Field label="Certificate URL"><TextInput value={mentorForm.certificateUrl} onChange={(event) => setMentorForm({ ...mentorForm, certificateUrl: event.target.value })} className="w-full" /></Field>
                </div>
              </SettingsForm>
            ) : null}

            {activeTab === 'payout' ? (
              <SettingsForm title="Payout" subtitle="Submit or update your payout account. Admin approval is required before withdrawals." onSubmit={savePayout} saving={saving}>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <StatusPill label={formatStatus(payoutStatus)} tone={payoutStatus === 'APPROVED' ? 'emerald' : payoutStatus === 'REJECTED' ? 'rose' : payoutStatus === 'NOT_SUBMITTED' ? 'slate' : 'amber'} />
                  {payoutAccount ? <span className="text-sm font-semibold text-slate-600">Saved account: {maskAccount(payoutAccount.accountNumber)}</span> : <span className="text-sm font-semibold text-slate-500">No payout account submitted.</span>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Payout method"><SelectInput value={payoutForm.payoutMethod} onChange={(event) => setPayoutForm({ ...payoutForm, payoutMethod: event.target.value as PayoutMethod })} className="w-full"><option value={PayoutMethod.LOCAL_BANK}>Local bank</option></SelectInput></Field>
                  <Field label="Country"><TextInput value={payoutForm.payoutCountry} onChange={(event) => setPayoutForm({ ...payoutForm, payoutCountry: event.target.value })} className="w-full" required /></Field>
                  <Field label="Bank name"><TextInput value={payoutForm.bankName} onChange={(event) => setPayoutForm({ ...payoutForm, bankName: event.target.value })} className="w-full" required /></Field>
                  <Field label="Account holder"><TextInput value={payoutForm.accountHolderName} onChange={(event) => setPayoutForm({ ...payoutForm, accountHolderName: event.target.value })} className="w-full" required /></Field>
                  <Field label="Account number"><TextInput value={payoutForm.accountNumber} onChange={(event) => setPayoutForm({ ...payoutForm, accountNumber: event.target.value })} placeholder={payoutAccount ? `Current ${maskAccount(payoutAccount.accountNumber)}` : ''} className="w-full" required={!payoutAccount} /></Field>
                  <Field label="Bank code"><TextInput value={payoutForm.bankCode} onChange={(event) => setPayoutForm({ ...payoutForm, bankCode: event.target.value })} className="w-full" /></Field>
                  <Field label="Branch"><TextInput value={payoutForm.branchName} onChange={(event) => setPayoutForm({ ...payoutForm, branchName: event.target.value })} className="w-full" /></Field>
                </div>
                <Field label="Internal note for payout review"><textarea value={payoutForm.notes} onChange={(event) => setPayoutForm({ ...payoutForm, notes: event.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" /></Field>
              </SettingsForm>
            ) : null}

            {activeTab === 'availability' ? (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Availability</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Weekly schedule is managed on the Schedule page so booked sessions and free slots stay in one place.</p>
                <Link to="/mentor/schedule" className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Open schedule settings</Link>
              </div>
            ) : null}

            {activeTab === 'notifications' && notifications ? (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Notifications</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Control broad delivery channels. Notification type granularity is stored by backend JSON settings when available.</p>
                <div className="mt-6 space-y-3">
                  <ToggleRow label="Email notifications" checked={notificationForm.emailEnabled} onChange={(checked) => saveNotifications({ ...notificationForm, emailEnabled: checked })} disabled={saving} />
                  <ToggleRow label="Push notifications" checked={notificationForm.pushEnabled} onChange={(checked) => saveNotifications({ ...notificationForm, pushEnabled: checked })} disabled={saving} />
                  <ToggleRow label="In-app notifications" checked={notificationForm.inAppEnabled} onChange={(checked) => saveNotifications({ ...notificationForm, inAppEnabled: checked })} disabled={saving} />
                </div>
              </div>
            ) : activeTab === 'notifications' ? (
              <StateCard title="Notification preferences unavailable" message="The backend preference endpoint did not return a record. Try again later." />
            ) : null}

            {activeTab === 'privacy' ? (
              <SettingsForm title="Privacy & safety" subtitle="Only supported privacy fields are editable here." onSubmit={saveProfile} saving={saving}>
                <ToggleRow label="Show profile publicly" checked={privacyForm.profileIsPublic} onChange={(checked) => setPrivacyForm({ profileIsPublic: checked })} disabled={saving} />
                <div className="rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-500">
                  Response time, blocked users, and safety controls are not exposed by backend settings endpoints yet.
                </div>
              </SettingsForm>
            ) : null}

            {activeTab === 'account' ? (
              <div>
                <h2 className="text-xl font-bold text-slate-950">Account mode</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ReadonlyStatus label="Current mode" value="Mentor Mode" tone="indigo" />
                  <ReadonlyStatus label="Mentor status" value={user?.mentorStatus || 'UNKNOWN'} tone={user?.mentorStatus === 'APPROVED' ? 'emerald' : 'amber'} />
                  <ReadonlyStatus label="Identity status" value={user?.identityStatus || mentorProfile?.identityStatus || 'NOT_SUBMITTED'} tone="slate" />
                  <ReadonlyStatus label="Payout status" value={payoutStatus} tone={payoutStatus === 'APPROVED' ? 'emerald' : 'amber'} />
                </div>
                <Link to="/" className="mt-6 inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Switch back to User mode</Link>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </PageShell>
  )
}

function SettingsForm({
  title,
  subtitle,
  onSubmit,
  saving,
  children,
}: {
  title: string
  subtitle: string
  onSubmit: (event: FormEvent) => void
  saving: boolean
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>
        </div>
        <button disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

function ReadonlyStatus({ label, value, tone }: { label: string; value: string; tone: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-3">
        <StatusPill label={formatStatus(value)} tone={tone} />
      </div>
    </div>
  )
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function emptyToUndefined(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function maskAccount(account?: string) {
  if (!account) return 'Not provided'
  return `**** ${account.slice(-4)}`
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    NOT_SUBMITTED: 'Not submitted',
    NEEDS_MORE_INFO: 'Needs more info',
    PENDING: 'Pending review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  }
  return labels[status] || status.replace(/_/g, ' ').toLowerCase()
}
