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
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Spotlight</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Featured guides</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="absolute inset-0">
            <img src={mainPost.coverImage} alt={mainPost.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-900/26 to-transparent" />
          </div>
          <div className="relative flex min-h-[430px] flex-col justify-end p-6 sm:p-8">
            <span className="inline-flex w-fit rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
              Main Feature
            </span>
            <h3 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white">{mainPost.title}</h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100">{mainPost.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-200">
              <span>{mainPost.author}</span>
              <span>{mainPost.date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {mainPost.readTime}
              </span>
            </div>
            <Link
              to={`/blog/${mainPost.slug}`}
              className="mt-6 inline-flex h-11 w-fit items-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              Read more
            </Link>
          </div>
        </article>

        <div className="grid gap-4">
          {sidePosts.map((post) => (
            <article key={post.id} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid grid-cols-[130px_minmax(0,1fr)]">
                <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                <div className="p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">{post.category}</p>
                  <h4 className="mt-2 text-lg font-black leading-6 tracking-tight text-slate-950 transition group-hover:text-indigo-600">
                    {post.title}
                  </h4>
                  <p className="mt-2 text-xs text-slate-500">{post.readTime}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
