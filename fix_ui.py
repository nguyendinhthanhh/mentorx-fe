import sys
import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the Avatar negative margin
# Original:
# <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-20 sm:-mt-24 mb-6 relative z-10">
#   <div className="relative shrink-0">
#     <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl border-[6px] border-white bg-white shadow-lg overflow-hidden">
# Replace with:
# <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6 relative z-10">
#   <div className="relative shrink-0 -mt-20 sm:-mt-24">
#     <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl border-[6px] border-white bg-white shadow-lg overflow-hidden">

content = content.replace(
    '<div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-20 sm:-mt-24 mb-6 relative z-10">\n                  <div className="relative shrink-0">',
    '<div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6 relative z-10">\n                  <div className="relative shrink-0 -mt-20 sm:-mt-28 ml-2">'
)

# 2. Fix the Breadcrumbs position
# Currently:
#       {/* 1. Hero Cover Banner */}
#       <div className="relative h-48 sm:h-64 bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800">
#         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
#       </div>
#
#       <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
#         {/* 2. Top Navigation (Breadcrumbs) placed absolutely overlapping the cover */}
#         <div className="relative -mt-[160px] sm:-mt-[220px] mb-8 z-20">
#           <div className="flex flex-wrap items-center justify-between gap-4">
#             <div className="rounded-lg bg-black/30 backdrop-blur-md px-4 py-2 border border-white/10 shadow-sm">
#               <Breadcrumbs
#                 items={[
#                   { label: 'Trang chủ', to: '/' },
#                   { label: 'Danh sách Mentor', to: '/mentors' },
#                   { label: name },
#                 ]}
#                 className="text-white hover:text-indigo-200"
#               />
#             </div>
#             {/* Removed the "Hồ sơ mentor công khai" badge as requested */}
#           </div>
#         </div>

# We will move Breadcrumbs OUT of the Hero Banner and put it above it, like a normal page header.

new_hero_block = """      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Danh sách Mentor', to: '/mentors' },
            { label: name },
          ]}
        />
      </div>

      {/* 1. Hero Cover Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 -mt-20">"""

# Replace the block
pattern = re.compile(
    r'\{\/\* 1\. Hero Cover Banner \*\/.*?<div className="relative -mt-\[160px\] sm:-mt-\[220px\] mb-8 z-20">.*?<\/div>\n        <\/div>',
    re.DOTALL
)

content = pattern.sub(new_hero_block, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed UI layout")
