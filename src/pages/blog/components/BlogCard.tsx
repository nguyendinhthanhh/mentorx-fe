import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import type { BlogPost } from '../blogData'

export function BlogCard({
  post,
  variant,
}: {
  post: BlogPost
  variant: 'vertical' | 'horizontal' | 'insight'
}) {
  if (variant === 'insight') {
    return (
      <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">{post.category}</p>
        <h3 className="mt-2 text-2xl font-black leading-8 tracking-tight text-slate-950">{post.title}</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">{post.excerpt}</p>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-black text-slate-900">{post.author}</p>
            <p className="text-xs text-slate-500">{post.authorRole}</p>
          </div>
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Read
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md md:col-span-2">
        <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
          <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          <div className="p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">{post.category}</p>
            <h3 className="mt-2 text-2xl font-black leading-8 tracking-tight text-slate-950 transition group-hover:text-indigo-600">
              {post.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>{post.date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
              <span>{post.author}</span>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl">
        <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="px-2 pb-2 pt-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">{post.category}</p>
        <h3 className="mt-2 text-xl font-black leading-7 tracking-tight text-slate-950 transition group-hover:text-indigo-600">{post.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <img src={post.authorAvatar} alt={post.author} className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200" />
            <div>
              <p className="text-sm font-black text-slate-900">{post.author}</p>
              <p className="text-xs text-slate-500">{post.readTime}</p>
            </div>
          </div>
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
          >
            Read
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
