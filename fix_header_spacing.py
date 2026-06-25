import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorListPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. First, locate the title block inside <main> and remove it.
# The title block is:
title_block_regex = r'<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">\s*<div>\s*<h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Find the right mentor</h1>\s*<p className="mt-2 text-base text-[#4B5563]">\s*Learn from verified experts and accelerate your growth\.\s*</p>\s*</div>\s*<div className="flex w-full items-center gap-4 sm:w-auto">\s*<div className="hidden md:flex items-center gap-3">\s*<div className="flex -space-x-3">\s*<img src=\{mentorFallbackImages\[0\]\} className="w-10 h-10 rounded-full border-2 border-\[#FFFFFF\] object-cover" />\s*<img src=\{mentorFallbackImages\[1\]\} className="w-10 h-10 rounded-full border-2 border-\[#FFFFFF\] object-cover" />\s*<img src=\{mentorFallbackImages\[2\]\} className="w-10 h-10 rounded-full border-2 border-\[#FFFFFF\] object-cover" />\s*</div>\s*<div className="text-sm">\s*<p className="font-semibold text-\[#111827\]">\{totalMentors\} approved mentors</p>\s*<p className="text-\[#9CA3AF\]">in this marketplace</p>\s*</div>\s*</div>\s*</div>\s*</div>'

# We'll replace it with just the stats part (since the title is moving up)
stats_block = """        <div className="mb-6 flex items-center justify-between">
           <div className="hidden md:flex items-center gap-3">
              <div className="flex -space-x-3">
                 <img src={mentorFallbackImages[0]} className="w-10 h-10 rounded-full border-2 border-[#F8FAFC] object-cover" />
                 <img src={mentorFallbackImages[1]} className="w-10 h-10 rounded-full border-2 border-[#F8FAFC] object-cover" />
                 <img src={mentorFallbackImages[2]} className="w-10 h-10 rounded-full border-2 border-[#F8FAFC] object-cover" />
              </div>
              <div className="text-sm">
                 <p className="font-semibold text-gray-900">{totalMentors} approved mentors</p>
                 <p className="text-gray-500">in this marketplace</p>
              </div>
           </div>
        </div>"""

content = re.sub(title_block_regex, stats_block, content, flags=re.DOTALL)

# 2. Modify the <section> to be a Hero section (not sticky, with gradient, and centered title)
old_section_header = r'<section className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur pb-4 pt-6 shadow-sm">\s*<div className="mx-auto max-w-\[1600px\] px-4 sm:px-6 lg:px-8">'

new_section_header = """      <section className="bg-gradient-to-b from-indigo-50 to-[#F8FAFC] border-b border-gray-200 pb-8 pt-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-3xl mx-auto">
             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Find the right mentor</h1>
             <p className="mt-4 text-lg text-gray-600">Learn from verified experts and accelerate your growth.</p>
          </div>"""

content = re.sub(old_section_header, new_section_header, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Moved search bar into a Hero section successfully!")
