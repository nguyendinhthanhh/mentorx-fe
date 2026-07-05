import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import blogApi, { BlogPost } from '../api/blogApi'
import { BlogCard } from './blog/components/BlogCard'

export default function BlogDetailPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      setError('')

      try {
        const article = await blogApi.getPostBySlug(slug)
        setPost(article)

        const pageResponse = await blogApi.getPosts({ size: 12 })
        setRelatedPosts(
          (pageResponse.content || [])
            .filter((item) => item.slug !== article.slug && item.category === article.category)
            .slice(0, 3)
        )
      } catch (err) {
        console.error('Failed to fetch blog post', err)
        setError('We could not load this guide right now.')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  const metaLabel = useMemo(() => {
    if (!post) return ''
    return `${post.category} / ${post.audience}`
  }, [post])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-[360px] animate-pulse rounded-[32px] bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-5 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-20 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Blog</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Guide not found</h1>
          <p className="mt-3 text-slate-600">
            {error || 'This guide may have been removed or the link is no longer valid.'}
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to handbook
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to handbook
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
              {post.category}
            </span>
            <span className="text-sm font-medium text-slate-500">{metaLabel}</span>
            <span className="text-sm font-medium text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-500">{post.readTime}</span>
            <span className="text-sm font-medium text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-500">{post.date}</span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {post.excerpt}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <img src={post.authorAvatar} alt={post.author} className="h-12 w-12 rounded-full bg-slate-100 object-cover" />
            <div>
              <p className="font-semibold text-slate-900">{post.author}</p>
              <p className="text-sm text-slate-500">{post.authorRole}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <img src={post.coverImage} alt={post.title} className="h-[260px] w-full object-cover sm:h-[380px]" />

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div
              className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-700 prose-p:leading-8"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {post.tags.length > 0 && (
              <div className="mt-10 border-t border-slate-200 pt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Topics</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Keep Reading</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">More in {post.category}</h2>
              </div>
              <Link to="/blog" className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:inline-flex">
                View all guides
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedPosts.map((item) => (
                <BlogCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
