import { useEffect, useMemo, useState } from 'react'
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
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <main className="pb-20">
        <BlogHero
          query={query}
          onQueryChange={setQuery}
          onChipSelect={setQuery}
          todayGuide={mainFeature}
        />

        <section className="mx-auto mt-8 max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <AudienceTabs tabs={BLOG_TABS} activeTab={activeTab} onChange={setActiveTab} />

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
              <div className="mt-8">
                <FeaturedGuides mainPost={mainFeature} sidePosts={sideFeatures} />
              </div>

              <div className="mt-10">
                <PathwayCards pathways={PATHWAYS} />
              </div>

              <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="space-y-5 xl:col-span-8">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Knowledge stream</p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Latest from the handbook</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {latestPosts.map((post, index) => {
                      const variant = index % 4 === 0 ? 'horizontal' : index % 4 === 1 ? 'insight' : 'vertical'
                      return <BlogCard key={post.id} post={post} variant={variant} />
                    })}
                  </div>
                </div>

                <div className="xl:col-span-4">
                  <HandbookSidebar
                    topics={POPULAR_TOPICS}
                    insights={MENTOR_INSIGHTS}
                    startHere={START_HERE}
                    onTopicSelect={setQuery}
                  />
                </div>
              </section>

              <section className="mt-12">
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
      <div className="h-[360px] animate-pulse rounded-[30px] border border-slate-200 bg-white" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[180px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[260px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  )
}
