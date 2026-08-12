import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import DOMPurify from 'dompurify'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, Edit, Clock, Calendar, User, Tag, ChevronUp } from 'lucide-react'
import blogApi, { BlogPost } from '../api/blogApi'
import { BlogCard } from './blog/components/BlogCard'
import { useAuthStore } from '../store/authStore'
import { isAdmin } from '../utils/roleRedirect'

type TabKey = 'content' | 'info'

export default function BlogDetailPage() {
  const { user } = useAuthStore()
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('content')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

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
        setError('Không thể tải bài viết này.')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const metaLabel = useMemo(() => {
    if (!post) return ''
    return `${post.category} / ${post.audience}`
  }, [post])

  const formattedDate = useMemo(() => {
    if (!post) return ''
    return post.date || new Date(post.updatedAt).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
  }, [post])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Skeleton sticky bar */}
        <div className="sticky top-16 z-20 bg-white dark:bg-slate-950/95 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            <span className="text-gray-300">|</span>
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-4">
            <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${85 + Math.random() * 15}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-slate-400">Cẩm nang</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Không tìm thấy bài viết</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
            {error || 'Bài viết này có thể đã bị xoá hoặc đường dẫn không còn hợp lệ.'}
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cẩm nang
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Helmet>
        <title>{post.title} | MentorX</title>
        <meta name="description" content={post.excerpt} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.coverImage && <meta property="og:image" content={post.coverImage} />}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.href} />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={post.excerpt} />
        {post.coverImage && <meta property="twitter:image" content={post.coverImage} />}
      </Helmet>

      {/* ─── Sticky breadcrumb bar ─── */}
      <div className="sticky top-16 z-20 bg-white dark:bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
          <Link
            to="/blog"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-[15px] w-[15px]" />
            Quay lại
          </Link>
          <span className="text-gray-300">|</span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
            {post.title}
          </p>
          {(user?.userId === post.authorId || isAdmin(user)) && (
            <Link
              to={`/blog/${post.slug}/edit`}
              className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 hover:text-emerald-600 dark:text-emerald-500"
            >
              <Edit className="h-3.5 w-3.5" />
              Chỉnh sửa
            </Link>
          )}
        </div>
      </div>

      {/* ─── Main content area ─── */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Tab navigation */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'content'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:text-slate-200'
            }`}
          >
            Nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:text-slate-200'
            }`}
          >
            Thông tin
          </button>
        </div>

        {activeTab === 'content' && (
          <div>
            {/* ─── Metadata line ─── */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {post.category}
              </span>
              <span>·</span>
              <span>{post.audience}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.viewCount || 0} lượt xem
              </span>
            </div>

            {/* ─── Title ─── */}
            <h1 className="text-lg font-bold leading-snug text-gray-900 dark:text-gray-100 sm:text-xl">
              {post.title}
            </h1>

            {/* ─── Author compact ─── */}
            <div className="mt-3 mb-6 flex items-center gap-2">
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
              />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">{post.author}</span>
                <span>·</span>
                <span>{post.authorRole}</span>
              </div>
            </div>

            {/* ─── Cover image (if exists) ─── */}
            {Boolean(post.coverImage) && post.coverImage.trim() !== '' && post.coverImage !== 'null' && (
              <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-auto w-full object-cover"
                  style={{ maxHeight: '360px' }}
                />
              </div>
            )}

            {/* ─── Article body ─── */}
            <div
              ref={contentRef}
              className="blog-document prose prose-slate dark:prose-invert max-w-none prose-sm prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:leading-snug prose-h1:text-lg prose-h1:mt-8 prose-h1:mb-3 prose-h2:text-base prose-h2:mt-7 prose-h2:mb-2.5 prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-2 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-li:leading-relaxed prose-a:text-emerald-600 dark:prose-a:text-emerald-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-img:rounded-lg prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-800 prose-table:text-sm prose-th:bg-slate-50 dark:prose-th:bg-slate-900/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-slate-100 dark:prose-td:border-slate-800 prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-900/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-code:before:content-none prose-code:after:content-none prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-medium prose-pre:bg-slate-900 prose-pre:rounded-lg "
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '', { FORBID_ATTR: ['style'] }) }}
            />

            {/* ─── Tags ─── */}
            {post.tags.length > 0 && (
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Tag className="h-3.5 w-3.5" />
                  Chủ đề liên quan
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 transition hover:bg-slate-100 dark:bg-slate-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Thông tin bài viết</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Tiêu đề</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{post.title}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Tác giả</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <img src={post.authorAvatar} alt={post.author} className="h-6 w-6 rounded-full object-cover" />
                        <span>{post.author}</span>
                        <span className="text-xs text-slate-400">({post.authorRole})</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Danh mục</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{post.category}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Đối tượng</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{post.audience}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Ngày xuất bản</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{formattedDate}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Thời gian đọc</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{post.readTime}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Lượt xem</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 dark:text-slate-200">{post.viewCount || 0}</td>
                  </tr>
                  {post.tags.length > 0 && (
                    <tr>
                      <td className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 px-4 py-3 font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400 w-40">Thẻ (tags)</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 dark:text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {post.excerpt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tóm tắt</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">{post.excerpt}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Related posts ─── */}
        {relatedPosts.length > 0 && (
          <section className="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đọc thêm</p>
                <h2 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">Bài viết cùng chủ đề</h2>
              </div>
              <Link to="/blog" className="hidden items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400 transition hover:text-slate-900 dark:text-slate-100 sm:inline-flex">
                Xem tất cả
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
      </div>

      {/* ─── Scroll-to-top button ─── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-700 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  )
}
