import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorListPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the broken sort by block:
old_sort_block = """             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => applySort(e.target.value)}
                  className="appearance-none border-none bg-transparent py-2 pl-2 pr-8 text-[14px] font-bold text-gray-900 outline-none cursor-pointer"
                  style={{ background: "url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%239CA3AF"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>') no-repeat right 0.5rem center/1rem" }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
             </div>"""

new_sort_block = """             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => applySort(e.target.value)}
                    className="appearance-none border-none bg-transparent py-2 pl-2 pr-8 text-[14px] font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
             </div>"""

content = content.replace(old_sort_block, new_sort_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed JSX Syntax Error!")
