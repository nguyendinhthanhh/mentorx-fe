import { Link } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import type { BlogPost } from '../blogData'

export function FeaturedGuides({
  mainPost,
  sidePosts,
}: {
  mainPost: BlogPost
  sidePosts: BlogPost[]
}) {
  return (
    <section>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Featured Guides</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="group relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 shadow-sm transition-all hover:shadow-md">
          <img
            src={mainPost.coverImage}
            alt={mainPost.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative p-6 sm:p-8">
            <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Main Feature
            </span>
            <h3 className="mt-4 max-w-2xl text-2xl font-bold leading-tight text-white sm:text-3xl">
              <Link to={`/blog/${mainPost.slug}`}>
                <span className="absolute inset-0" />
                {mainPost.title}
              </Link>
            </h3>
            <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-slate-300">
              {mainPost.excerpt}
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-300">
              <span>{mainPost.author}</span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-4 w-4" />
                {mainPost.readTime}
              </span>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-6">
          {sidePosts.map((post) => (
            <article key={post.id} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">{post.category}</span>
                <h4 className="mt-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-indigo-600">
                  <Link to={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h4>
                <p className="mt-auto pt-4 text-xs font-medium text-slate-500">{post.readTime} read</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
