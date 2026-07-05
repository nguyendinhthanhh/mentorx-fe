import { useEffect, useMemo, useState } from 'react'
import {
  type BlogTab,
  type BlogTrack,
  type BlogContributor,
  type StartHereLink,
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
const POSTS_PAGE_SIZE = 9
const BLOG_TAB_ORDER: BlogTab[] = [
  'All',
  'For Learners',
  'For Mentors',
  'Career Growth',
  'Freelance & Jobs',
  'Courses',
  'Platform Safety',
  'Technology',
]

const TRACK_ICON_BY_LABEL: Record<string, BlogTrack['icon']> = {
  'For Learners': 'learner',
  'For Mentors': 'mentor',
  'Freelance & Jobs': 'jobs',
  'Courses': 'course',
  'Career Growth': 'learner',
  'Platform Safety': 'course',
  'Technology': 'course',
}

export default function GuidePage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<BlogTab>('All')
  const [page, setPage] = useState(0)
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

  useEffect(() => {
    setPage(0)
  }, [activeTab, query])

  const visiblePosts = useMemo(() => {
    if (activeTab === 'All') return posts
    return posts.filter((post) => post.audience === activeTab || post.category === activeTab)
  }, [activeTab, posts])

  const visibleFeaturedPosts = useMemo(() => {
    if (activeTab === 'All') return featuredPosts
    return featuredPosts.filter((post) => post.audience === activeTab || post.category === activeTab)
  }, [activeTab, featuredPosts])

  const allPosts = useMemo(() => {
    const seen = new Set<string>()
    return [...featuredPosts, ...posts].filter((post) => {
      if (seen.has(post.id)) return false
      seen.add(post.id)
      return true
    })
  }, [featuredPosts, posts])

  const tabs = useMemo(() => {
    const availableTabs = new Set<BlogTab>(['All'])
    allPosts.forEach((post) => {
      availableTabs.add(post.audience as BlogTab)
      availableTabs.add(post.category as BlogTab)
    })
    return BLOG_TAB_ORDER.filter((tab) => availableTabs.has(tab))
  }, [allPosts])

  const mainFeature = visibleFeaturedPosts[0] || visiblePosts[0]
  const sideFeatures = visibleFeaturedPosts.slice(1, 3)

  const latestPosts = useMemo(() => {
    if (visiblePosts.length === 0) return []
    const excluded = new Set(visibleFeaturedPosts.map((p) => p.id))
    return visiblePosts.filter((p) => !excluded.has(p.id))
  }, [visiblePosts, visibleFeaturedPosts])

  const totalPages = Math.max(1, Math.ceil(latestPosts.length / POSTS_PAGE_SIZE))

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1))
  }, [totalPages])

  const paginatedLatestPosts = useMemo(() => {
    const start = page * POSTS_PAGE_SIZE
    return latestPosts.slice(start, start + POSTS_PAGE_SIZE)
  }, [latestPosts, page])

  const latestStart = latestPosts.length === 0 ? 0 : page * POSTS_PAGE_SIZE + 1
  const latestEnd = Math.min((page + 1) * POSTS_PAGE_SIZE, latestPosts.length)

  const popularTopics = useMemo(() => {
    const counts = new Map<string, number>()
    allPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([tag]) => tag)
  }, [allPosts])

  const quickTopics = useMemo(() => popularTopics.slice(0, 4), [popularTopics])

  const tracks = useMemo<BlogTrack[]>(() => {
    const counts = new Map<string, number>()
    allPosts.forEach((post) => {
      counts.set(post.audience, (counts.get(post.audience) || 0) + 1)
      counts.set(post.category, (counts.get(post.category) || 0) + 1)
    })

    return [...counts.entries()]
      .filter(([label]) => label !== 'Technology')
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([label, articleCount]) => ({
        key: label.toLowerCase().replace(/\s+/g, '-'),
        title: label,
        icon: TRACK_ICON_BY_LABEL[label] || 'course',
        articleCount,
      }))
  }, [allPosts])

  const contributors = useMemo<BlogContributor[]>(() => {
    const byAuthor = new Map<string, BlogContributor>()
    allPosts.forEach((post) => {
      const existing = byAuthor.get(post.author)
      if (existing) {
        existing.articleCount += 1
        return
      }
      byAuthor.set(post.author, {
        id: post.author.toLowerCase().replace(/\s+/g, '-'),
        name: post.author,
        role: post.authorRole,
        avatar: post.authorAvatar,
        articleCount: 1,
      })
    })

    return [...byAuthor.values()]
      .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name))
      .slice(0, 3)
  }, [allPosts])

  const startHere = useMemo<StartHereLink[]>(() => {
    const candidates = [...visibleFeaturedPosts, ...visiblePosts]
    const seen = new Set<string>()
    return candidates
      .filter((post) => {
        if (seen.has(post.slug)) return false
        seen.add(post.slug)
        return true
      })
      .slice(0, 3)
      .map((post) => ({
        slug: post.slug,
        title: post.title,
      }))
  }, [visibleFeaturedPosts, visiblePosts])

  const handleTopicSelect = (topic: string) => {
    setActiveTab('All')
    setQuery(topic)
  }

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
        quickTopics={quickTopics}
        onQueryChange={setQuery}
        onChipSelect={handleTopicSelect}
      />

      <main className="mx-auto mt-8 max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <AudienceTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {loading ? (
          <LoadingState />
        ) : visiblePosts.length === 0 ? (
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
                <PathwayCards pathways={tracks} onSelect={handleTopicSelect} />
              </div>
              <div className="hidden lg:block space-y-8">
                <HandbookSidebar
                  topics={popularTopics}
                  contributors={contributors}
                  startHere={startHere}
                  onTopicSelect={handleTopicSelect}
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
                {latestPosts.length > 0 && (
                  <p className="hidden text-sm font-medium text-slate-500 sm:block">
                    Showing {latestStart}-{latestEnd} of {latestPosts.length}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedLatestPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>

              {totalPages > 1 && (
                <BlogPagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
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

function BlogPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
    const start = totalPages <= 5 ? 0 : Math.max(0, Math.min(page - 2, totalPages - 5))
    return start + index
  })

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{page + 1}</span> of {totalPages}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={page === pageNumber ? 'page' : undefined}
            className={
              page === pageNumber
                ? 'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100'
            }
          >
            {pageNumber + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
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
