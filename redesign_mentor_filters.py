import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorListPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to replace the whole sticky header section:
# <section className="sticky top-16 z-30 border-b border-[#E5E7EB] bg-[#FFFFFF]/95 backdrop-blur">
# ...
# </section>

new_header = """      <section className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur pb-4 pt-6 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          
          {/* Main Composite Search Bar */}
          <div className="flex flex-col xl:flex-row items-center rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition-all focus-within:border-[#4f46e5] focus-within:ring-4 focus-within:ring-indigo-50">
            {/* Keyword */}
            <div className="relative flex w-full xl:w-2/5 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search mentor by name, expertise..."
                className="w-full bg-transparent pl-3 text-[15px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-4 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Domain */}
            <div className="relative flex w-full xl:w-1/4 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Briefcase className="h-5 w-5 shrink-0 text-gray-400" />
              <select
                value={primaryDomain || ''}
                onChange={(e) => { setPrimaryDomain(e.target.value || undefined); setPage(0); }}
                className="w-full appearance-none bg-transparent pl-3 pr-8 text-[15px] font-medium text-gray-900 outline-none cursor-pointer"
              >
                <option value="">Any domain</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-gray-400" />
            </div>

            {/* Skill */}
            <div className="relative flex w-full xl:w-1/4 items-center px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100">
              <Code2 className="h-5 w-5 shrink-0 text-gray-400" />
              <select
                value={skillKeyword || ''}
                onChange={(e) => { setSkillKeyword(e.target.value || undefined); setPage(0); }}
                className="w-full appearance-none bg-transparent pl-3 pr-8 text-[15px] font-medium text-gray-900 outline-none cursor-pointer"
              >
                <option value="">Any skill</option>
                {skills.slice(0, 60).map((s) => (
                  <option key={s.id} value={s.labelEn}>{s.labelEn}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-gray-400" />
            </div>

            {/* Search CTA */}
            <div className="w-full xl:w-auto px-2 mt-2 xl:mt-0 shrink-0">
              <button 
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-8 text-[15px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Find Mentors
              </button>
            </div>
          </div>

          {/* Secondary Filters Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
             <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mr-2">Filters:</span>
                
                <select
                  value={minRating?.toString() || ''}
                  onChange={(e) => { setMinRating(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Rating</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                </select>

                <select
                  value={maxRate?.toString() || ''}
                  onChange={(e) => { setMaxRate(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Budget</option>
                  {RATE_OPTIONS.filter(o => o.value).map(o => (
                    <option key={o.label} value={o.value?.toString()}>{o.label}</option>
                  ))}
                </select>

                <select
                  value={availability || ''}
                  onChange={(e) => { setAvailability(e.target.value || undefined); setPage(0); }}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
                >
                  <option value="">Availability</option>
                  {AVAILABILITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {activeFilterCount > 0 && (
                  <button onClick={clearSearchAndFilters} className="text-[13px] font-bold text-rose-600 hover:text-rose-700 transition px-2">
                    Clear all
                  </button>
                )}
             </div>

             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => applySort(e.target.value)}
                  className="appearance-none border-none bg-transparent py-2 pl-2 pr-8 text-[14px] font-bold text-gray-900 outline-none cursor-pointer"
                  style={{ background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"%239CA3AF\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"/></svg>') no-repeat right 0.5rem center/1rem" }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
             </div>
          </div>
        </div>
      </section>"""

header_regex = r'<section className="sticky top-16 z-30 border-b border-\[#E5E7EB\] bg-\[#FFFFFF\]/95 backdrop-blur">.*?</section>'

content = re.sub(header_regex, new_header.strip(), content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Redesigned Search & Filters successfully!")
