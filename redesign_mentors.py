import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorListPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the grid layout container
content = content.replace(
    '<div className="flex flex-col gap-5">',
    '<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">'
)

# 2. Extract and replace MentorCard
card_regex = r'function MentorCard\(\{ mentor, index \}: \{ mentor: MentorProfileResponse; index: number \}\) \{.*?(?=function SelectControl)'
new_card = """function MentorCard({ mentor, index }: { mentor: MentorProfileResponse; index: number }) {
  const name = mentor.user?.displayName || mentor.user?.fullName || 'Mentor'
  const headline = mentor.headline || 'Expert mentor'
  const rating = mentor.averageRating ? mentor.averageRating.toFixed(1) : 'New'
  const reviews = mentor.totalReviews || 0
  const image = mentor.user?.avatarUrl || mentorFallbackImages[index % mentorFallbackImages.length]
  const rate = mentor.hourlyRateMxc ? formatCurrency(mentor.hourlyRateMxc) : 'Flexible'
  const responseTime = mentor.responseTimeHours ? `Replies within ${mentor.responseTimeHours}h` : 'Replies within 12h'
  const availability = formatAvailability(mentor.availability)
  const isTopRated = mentor.averageRating && mentor.averageRating >= 4.8

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4f46e5] hover:shadow-xl relative">
      {/* Subtle Cover Background */}
      <div className="h-20 w-full bg-gradient-to-r from-indigo-50 to-slate-100"></div>
      
      {/* Avatar Container */}
      <div className="px-6 relative flex justify-between items-end -mt-10 mb-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-50 shadow-sm">
           <img src={image} alt={name} className="h-full w-full object-cover" />
        </div>
        <div className="mb-2 relative z-10">
           <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isTopRated ? 'Top Rated' : 'Verified'}
           </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 relative z-10">
        {/* Name and Headline */}
        <h2 className="text-[17px] font-bold text-gray-900 group-hover:text-[#4f46e5] transition-colors truncate">
           <Link to={`/mentors/${mentor.userId}`} className="focus:outline-none">
             <span className="absolute inset-0" aria-hidden="true" />
             {name}
           </Link>
        </h2>
        <p className="mt-1 text-[13px] font-medium text-gray-600 line-clamp-1">{headline}</p>
        
        {/* Rating and Metrics */}
        <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-gray-700">
           <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
           {rating} <span className="font-medium text-gray-500">({reviews} reviews)</span>
        </div>

        {/* Bio */}
        <p className="mt-4 text-[13px] leading-relaxed text-gray-600 line-clamp-3">
          {/* @ts-ignore */}
          {mentor.bio || `I help individuals and teams master their craft, build scalable solutions, and accelerate their careers.`}
        </p>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
           <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-gray-700">
             {mentor.primaryDomain || 'Software Engineering'}
           </span>
           {mentor.skillKeyword && (
           <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-gray-700">
             {mentor.skillKeyword}
           </span>
           )}
        </div>

        <div className="mt-auto pt-6">
           {/* Rate and Availability */}
           <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
              <div>
                 <span className="text-[16px] font-black text-[#4f46e5]">{rate}</span>
                 <span className="text-[11px] text-gray-500 font-medium"> / hr</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                 <Clock3 className="h-3.5 w-3.5" />
                 {availability}
              </div>
           </div>

           {/* Full Width CTA */}
           <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-indigo-700 relative z-20">
              View Profile
              <ArrowRight className="h-4 w-4" />
           </button>
        </div>
      </div>
    </article>
  )
}

"""
content = re.sub(card_regex, new_card, content, flags=re.DOTALL)

# 3. Replace MentorGridSkeleton
skeleton_regex = r'function MentorGridSkeleton\(\) \{.*?(?=function EmptyState)'
new_skeleton = """function MentorGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
           <div className="h-20 w-full bg-slate-100 animate-pulse"></div>
           <div className="px-6 -mt-10 mb-4">
              <div className="h-20 w-20 rounded-2xl bg-slate-200 border-4 border-white animate-pulse" />
           </div>
           <div className="px-6 flex-1 space-y-4">
              <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="space-y-2 mt-4">
                 <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                 <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                 <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
           </div>
        </div>
      ))}
    </div>
  )
}

"""
content = re.sub(skeleton_regex, new_skeleton, content, flags=re.DOTALL)

# 4. Filter section typography
content = content.replace('text-[#111827]', 'text-gray-900')
content = content.replace('text-[#4B5563]', 'text-gray-700')
content = content.replace('text-[#9CA3AF]', 'text-gray-500')
content = content.replace('bg-[#111827]', 'bg-gray-900')
content = content.replace('bg-[#1F2937]', 'bg-gray-800')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Redesigned MentorListPage successfully!")
