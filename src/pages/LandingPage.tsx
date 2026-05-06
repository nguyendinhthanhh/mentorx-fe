import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  CreditCard,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'

const avatars = ['A', 'H', 'M']

const comparisonCards = [
  {
    title: 'Social Media',
    icon: MessageSquare,
    tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    points: ['Noisy information, spam', 'Unverified expertise', 'High fraud risk with advance payments'],
  },
  {
    title: 'Freelance Platforms',
    icon: Briefcase,
    tone: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    points: ['Focus on large, expensive projects', 'Complex processes, long wait times', 'High service fees (20%+)'],
  },
]

const mentorXBenefits = [
  'Verified identity Mentors',
  'Proactive "on-demand" model',
  'Escrow Payment - Absolute Security',
  'Fast 1-1 support',
]

const steps = [
  {
    title: 'Post a Request',
    desc: 'Describe your issue, estimated budget, and desired deadline.',
    icon: FileText,
    tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    title: 'Mentor Quotes',
    desc: 'Receive quotes from suitable Mentors. Chat directly and decide.',
    icon: MessageSquare,
    tone: 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300',
  },
  {
    title: 'Secure Payment',
    desc: 'Funds held by the system and only released to the Mentor upon completion.',
    icon: ShieldCheck,
    tone: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
  },
]

const needs = [
  {
    title: 'Technical Support',
    desc: 'Bug fixing, code reviews, system architecture consulting, DevOps, server optimization...',
    icon: Code2,
    accent: 'border-blue-500',
    link: 'View IT Mentors',
  },
  {
    title: 'Education & Training',
    desc: '1-1 tutoring, thesis guidance, solving difficult exercises, exam prep...',
    icon: BookOpen,
    accent: 'border-violet-500',
    link: 'View Education Mentors',
  },
  {
    title: 'Career Development',
    desc: 'CV reviews, mock interviews, career orientation, soft skills...',
    icon: TrendingUp,
    accent: 'border-orange-500',
    link: 'View Career Mentors',
  },
]

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/20 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Vietnam's #1 Mentoring Platform
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
              Solve Your Problems with the <span className="text-blue-600 dark:text-blue-400">Right Mentor</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              Post a request. Mentors apply. Secure payments through an escrow system. 
              No more worries about quality or payment risks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/jobs/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:shadow-none"
              >
                Post a Request
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/mentors"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <Search className="h-4 w-4" />
                Find a Mentor
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-2">
                {avatars.map((item) => (
                  <div key={item} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-black text-white dark:border-slate-950">
                    {item}
                  </div>
                ))}
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-black text-white dark:border-slate-950">
                  2k+
                </div>
              </div>
              <span>Mentors joined and ready to help.</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mr-0">
            <div className="relative aspect-[4/3] rotate-3 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#506b5f] shadow-2xl shadow-slate-300/80 dark:border-white/10 dark:shadow-black/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#d6c0a3]" />
              <div className="absolute bottom-14 left-1/2 h-32 w-2 -translate-x-1/2 rounded-full bg-white/80" />
              <div className="absolute bottom-10 left-1/2 h-16 w-12 -translate-x-1/2 rounded-t-full bg-white shadow-lg" />
              <div className="absolute bottom-24 left-[47%] h-20 w-px rotate-[-22deg] bg-amber-100" />
              <div className="absolute bottom-24 left-[52%] h-24 w-px rotate-[18deg] bg-amber-100" />
              <div className="absolute bottom-8 right-12 h-4 w-28 rounded-full bg-slate-700/70" />
              <div className="absolute bottom-14 right-16 h-4 w-24 rounded-full bg-white/80" />
            </div>

            <div className="absolute -left-3 top-6 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:-left-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-950 dark:text-white">John Doe</p>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Senior Developer</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between gap-8 text-[10px] font-bold">
                <span className="text-blue-600">500k/hour</span>
                <span className="flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-current" />5.0</span>
              </div>
            </div>

            <div className="absolute -right-2 top-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:-right-6">
              <p className="flex items-center gap-2 text-[11px] font-black text-slate-700 dark:text-slate-200">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                New Offer Received
              </p>
            </div>

            <div className="absolute bottom-6 right-0 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:-right-8">
              <p className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Secure Payment
              </p>
              <p className="mt-1 text-[10px] font-bold text-green-600">Escrow Protected</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">Why not just ask on Facebook?</h2>
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              Professional issues need real experience, not just random comments.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {comparisonCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-full ${card.tone}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <h3 className="font-black text-slate-950 dark:text-white">{card.title}</h3>
                <div className="mt-5 space-y-3">
                  {card.points.map((point) => (
                    <div key={point} className="flex gap-3">
                      <XCircle className="mt-0.5 h-4 w-4 flex-none text-red-400" />
                      <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="relative rounded-lg border-2 border-blue-500 bg-white p-6 shadow-xl shadow-blue-100 dark:bg-slate-900 dark:shadow-none">
              <div className="absolute right-5 top-5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                Recommended
              </div>
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
                X
              </div>
              <h3 className="font-black text-blue-600 dark:text-blue-300">Mentor X</h3>
              <div className="mt-5 space-y-3">
                {mentorXBenefits.map((point) => (
                  <div key={point} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-green-500" />
                    <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
              <Link to="/register" className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-700">
                Try it now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-16 dark:bg-slate-900/60 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">Simple Workflow</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-950">
                <span className="absolute right-3 top-2 text-xs font-black text-slate-300 dark:text-slate-700">{index + 1}</span>
                <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ${step.tone}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">Solve Every Need</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {needs.map((need) => (
              <div key={need.title} className={`rounded-lg border border-slate-200 border-t-4 ${need.accent} bg-white p-6 shadow-lg shadow-slate-100 dark:border-white/10 dark:bg-slate-900 dark:shadow-none`}>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  <need.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{need.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{need.desc}</p>
                <Link to="/mentors" className="mt-5 inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300">
                  {need.link}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 dark:bg-slate-900/60 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700 dark:bg-green-500/10 dark:text-green-300">
              <ShieldCheck className="h-4 w-4" />
              Absolute Security
            </div>
            <h2 className="max-w-xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Escrow Payment Protection System
            </h2>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
              Your funds are deposited into an internal wallet and "frozen" when the contract starts. 
              The Mentor only receives payment when the work is completed and you are satisfied.
            </p>
            <div className="mt-8 space-y-5">
              {[
                ['Transparent Wallet', 'Track all transactions, fast deposits and withdrawals via bank/QR code.'],
                ['Dispute Resolution', 'If the Mentor fails to complete the task, our Support team will intervene and refund you.'],
              ].map(([title, desc], index) => (
                <div key={title} className="flex gap-4">
                  <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${index === 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300'}`}>
                    {index === 0 ? <CreditCard className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Current Balance</p>
                  <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">2,500,000 VND</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 dark:border-white/10">
                  <Bell className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">+</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">Deposit to wallet</p>
                      <p className="text-[10px] font-semibold text-slate-400">12:30 AM - Today</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-green-600">+500,000 VND</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4 dark:bg-yellow-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-200">-</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">Escrow for contract #823</p>
                      <p className="text-[10px] font-semibold text-slate-400">Safely held</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300">-300,000 VND</span>
                </div>
              </div>
              <button className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                + Add Funds
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200 dark:border-white/10 dark:bg-slate-900 dark:shadow-none lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">Do you have professional skills?</h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                Become a Mentor on Mentor X to share your knowledge and earn extra income. 
                Access thousands of requests every day.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                {['Attractive income', 'Flexible schedule', 'Build personal brand'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-green-700 dark:bg-green-500/10 dark:text-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item}
                  </span>
                ))}
              </div>
              <Link to="/register" className="mt-7 inline-flex rounded-lg border border-slate-300 px-5 py-3 text-xs font-black text-slate-900 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10">
                Register as a Mentor
              </Link>
            </div>
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-400 shadow-xl shadow-emerald-100 dark:shadow-none">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-black text-slate-900 shadow-lg">
                  M
                </div>
                <p className="mt-4 text-sm font-black text-slate-900">Senior Mentor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 px-4 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
            Ready to solve your next problem?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-white/90">
            Don't let technical difficulties slow you down. Connect with experts today.
          </p>
          <Link to="/jobs/create" className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-black text-blue-600 shadow-xl hover:bg-blue-50">
            Post a Request Now
          </Link>
          <p className="mt-5 text-xs font-medium text-white/80">Free to post. Only pay when you choose a Mentor.</p>
        </div>
      </section>
    </div>
  )
}
