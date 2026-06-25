import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import {
  BLOG_POSTS,
  BLOG_TABS,
  PATHWAYS,
  POPULAR_TOPICS,
  MENTOR_INSIGHTS,
  START_HERE,
  type BlogTab,
} from './blog/blogData'
import { BlogHero } from './blog/components/BlogHero'
import { AudienceTabs } from './blog/components/AudienceTabs'
import { FeaturedGuides } from './blog/components/FeaturedGuides'
import { PathwayCards } from './blog/components/PathwayCards'
import { BlogCard } from './blog/components/BlogCard'
import { HandbookSidebar } from './blog/components/HandbookSidebar'
import { NewsletterCTA } from './blog/components/NewsletterCTA'
import { EmptyState } from './blog/components/EmptyState'

type NewsletterStatus = 'idle' | 'ok'

export default function GuidePage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<BlogTab>('All')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatus>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return BLOG_POSTS.filter((post) => {
      const tabMatch = activeTab === 'All' ? true : post.audience === activeTab
      const queryMatch =
        normalized.length === 0 ||
        post.title.toLowerCase().includes(normalized) ||
        post.excerpt.toLowerCase().includes(normalized) ||
        post.category.toLowerCase().includes(normalized) ||
        post.audience.toLowerCase().includes(normalized) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalized))
      return tabMatch && queryMatch
    })
  }, [activeTab, query])

  const featuredPosts = useMemo(() => {
    const source = filteredPosts.length > 0 ? filteredPosts : BLOG_POSTS
    const picks = source.filter((post) => post.featured).slice(0, 3)
    if (picks.length === 3) return picks
    const extra = source.filter((post) => !picks.some((item) => item.id === post.id)).slice(0, 3 - picks.length)
    return [...picks, ...extra]
  }, [filteredPosts])

  const mainFeature = featuredPosts[0] ?? BLOG_POSTS[0]
  const sideFeatures = featuredPosts.slice(1, 3)

  const latestPosts = useMemo(() => {
    if (filteredPosts.length === 0) return []
    const excluded = new Set(featuredPosts.map((post) => post.id))
    return filteredPosts.filter((post) => !excluded.has(post.id))
  }, [featuredPosts, filteredPosts])

  const signalStats = useMemo(
    () => [
      {
        label: 'Guides live',
        value: `${BLOG_POSTS.length}+`,
        note: 'practical articles across mentoring, jobs, and learning',
        icon: BookOpenText,
        accent: 'from-[#ff8a00] via-[#ff5e7a] to-[#ff2d55]',
      },
      {
        label: 'Featured this week',
        value: `${featuredPosts.length}`,
        note: 'editor-picked reads with stronger signal',
        icon: Sparkles,
        accent: 'from-[#7c3aed] via-[#4f46e5] to-[#06b6d4]',
      },
      {
        label: 'Learning tracks',
        value: `${PATHWAYS.length}`,
        note: 'goal-based journeys for learners and mentors',
        icon: TrendingUp,
        accent: 'from-[#14b8a6] via-[#10b981] to-[#84cc16]',
      },
      {
        label: 'Safety topics',
        value: `${POPULAR_TOPICS.length}`,
        note: 'trust, escrow, wallet, and dispute guidance',
        icon: ShieldCheck,
        accent: 'from-[#0f172a] via-[#164e63] to-[#0f766e]',
      },
    ],
    [featuredPosts.length]
  )

  const handleSubscribe = () => {
    const trimmed = newsletterEmail.trim()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!valid) {
      setNewsletterStatus('idle')
      setNewsletterError('Please enter a valid email address.')
      return
    }
    setNewsletterError('')
    setNewsletterStatus('ok')
    setNewsletterEmail('')
  }

  const resetFilters = () => {
    setActiveTab('All')
    setQuery('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07131d] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,125,70,0.24),transparent_28%),radial-gradient(circle_at_18%_36%,rgba(244,63,94,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_88%_52%,rgba(124,58,237,0.18),transparent_26%),linear-gradient(180deg,#07131d_0%,#0a1824_36%,#eff5ff_36%,#f8fbff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[34rem] h-56 bg-[linear-gradient(180deg,rgba(248,251,255,0),rgba(248,251,255,0.92)_38%,#f8fbff_100%)]" />

      <main className="relative z-10 pb-20">
        <BlogHero
          query={query}
          onQueryChange={setQuery}
          onChipSelect={setQuery}
          todayGuide={mainFeature}
        />

        <section className="mx-auto -mt-10 max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {signalStats.map((item, index) => {
              const Icon = item.icon
              return (
                <article
                  key={item.label}
                  className={`onb-fade-in-up overflow-hidden rounded-[28px] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_-36px_rgba(8,15,30,0.45)] backdrop-blur-xl`}
                  style={{ animationDelay: `${0.04 * index}s` }}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950">{item.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
                </article>
              )
            })}
          </div>

          <div className="mt-6 rounded-[32px] border border-white/55 bg-white/68 p-3 shadow-[0_24px_90px_-40px_rgba(8,15,30,0.42)] backdrop-blur-xl">
            <AudienceTabs tabs={BLOG_TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              activeTab={activeTab}
              query={query}
              onReset={resetFilters}
            />
          ) : (
            <>
              <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                  <FeaturedGuides mainPost={mainFeature} sidePosts={sideFeatures} />
                  <PathwayCards pathways={PATHWAYS} onSelect={setQuery} />
                </div>

                <div>
                  <HandbookSidebar
                    topics={POPULAR_TOPICS}
                    insights={MENTOR_INSIGHTS}
                    startHere={START_HERE}
                    onTopicSelect={setQuery}
                  />
                </div>
              </section>

              <section className="mt-8 rounded-[36px] border border-white/65 bg-white/78 p-6 shadow-[0_28px_100px_-42px_rgba(8,15,30,0.45)] backdrop-blur-xl sm:p-8">
                <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Knowledge stream</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                      Latest from the Mentor X handbook
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-slate-600">
                    Reads designed for people making real progress: selecting mentors, structuring sessions, pricing expertise, and protecting work with clearer platform rules.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {latestPosts.map((post, index) => {
                      const variant = index % 4 === 0 ? 'horizontal' : index % 4 === 1 ? 'insight' : 'vertical'
                      return <BlogCard key={post.id} post={post} variant={variant} />
                    })}
                </div>
              </section>

              <section className="mt-10">
                <NewsletterCTA
                  email={newsletterEmail}
                  error={newsletterError}
                  status={newsletterStatus}
                  onEmailChange={(value) => {
                    setNewsletterEmail(value)
                    if (newsletterError) setNewsletterError('')
                    if (newsletterStatus === 'ok') setNewsletterStatus('idle')
                  }}
                  onSubmit={handleSubscribe}
                />
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mt-8 space-y-6">
      <div className="h-[360px] animate-pulse rounded-[30px] border border-white/60 bg-white/75" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[180px] animate-pulse rounded-[24px] border border-white/60 bg-white/75" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[260px] animate-pulse rounded-[24px] border border-white/60 bg-white/75" />
        ))}
      </div>
    </div>
  )
}
