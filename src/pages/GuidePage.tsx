import { useEffect, useMemo, useState } from 'react'
import {
  BLOG_TABS,
  PATHWAYS,
  POPULAR_TOPICS,
  MENTOR_INSIGHTS,
  START_HERE,
  type BlogTab,
} from './blog/blogData'
import blogApi, { BlogPost } from '../api/blogApi'
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

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await blogApi.getFeaturedPosts()
        setFeaturedPosts(data || [])
      } catch (err) {
        console.error('Failed to fetch featured posts', err)
      }
    }
    fetchFeatured()
  }, [])

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const params: any = { size: 50 } // fetch a good chunk for the main page
        if (activeTab !== 'All') params.audience = activeTab.replace(' ', '_').toUpperCase()
        if (query) params.query = query
        const pageResponse = await blogApi.getPosts(params)
        setPosts(pageResponse.content || [])
      } catch (err) {
        console.error('Failed to fetch posts', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchPosts()
    }, 300) // debounce
    return () => clearTimeout(timer)
  }, [activeTab, query])

  const mainFeature = featuredPosts[0] || posts[0]
  const sideFeatures = featuredPosts.slice(1, 3)

  const latestPosts = useMemo(() => {
    if (posts.length === 0) return []
    const excluded = new Set(featuredPosts.map((p) => p.id))
    return posts.filter((p) => !excluded.has(p.id))
  }, [posts, featuredPosts])

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <BlogHero
        query={query}
        onQueryChange={setQuery}
        onChipSelect={setQuery}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-8">
          <AudienceTabs tabs={BLOG_TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {loading ? (
          <LoadingState />
        ) : posts.length === 0 ? (
          <EmptyState
            activeTab={activeTab}
            query={query}
            onReset={resetFilters}
          />
        ) : (
          <div className="space-y-16">
            <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-12">
                <FeaturedGuides mainPost={mainFeature} sidePosts={sideFeatures} />
                <PathwayCards pathways={PATHWAYS} onSelect={setQuery} />
              </div>
              <div className="hidden lg:block space-y-8">
                <HandbookSidebar
                  topics={POPULAR_TOPICS}
                  insights={MENTOR_INSIGHTS}
                  startHere={START_HERE}
                  onTopicSelect={setQuery}
                />
              </div>
            </section>

            <section>
              <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Latest from the Handbook
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Insights and guides to help you grow.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </section>

            <section>
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
          </div>
        )}
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mt-8 space-y-8">
      <div className="h-[400px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[300px] animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  )
}
