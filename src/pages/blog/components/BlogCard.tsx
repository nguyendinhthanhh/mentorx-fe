import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { BlogPost } from '../blogData'

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <Link to={`/blog/${post.slug}`} className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <img
          src={post.coverImage}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
            {post.category}
          </span>
          <span className="text-xs font-medium text-slate-500">{post.readTime}</span>
        </div>
        
        <h3 className="mt-4 text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-indigo-600">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {post.excerpt}
        </p>
        
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2.5">
            <img src={post.authorAvatar} alt={post.author} className="h-8 w-8 rounded-full bg-slate-100 object-cover" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{post.author}</p>
            </div>
          </div>
          <Link to={`/blog/${post.slug}`} className="text-indigo-600" aria-label={`Read ${post.title}`}>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}
