import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import for Breadcrumbs
import_str = "import { Breadcrumbs } from '@/components/ui/Breadcrumbs'"
if import_str not in content:
    # Find the last import
    last_import_idx = content.rfind("import ")
    if last_import_idx != -1:
        end_of_last_import = content.find("\n", last_import_idx)
        content = content[:end_of_last_import] + "\n" + import_str + content[end_of_last_import:]

# 2. Replace the old back link with Breadcrumbs
old_back_block = r'<div className="flex flex-wrap items-center gap-3">\s*<Link to="/mentors" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-blue-700">\s*<ChevronLeft className="h-4 w-4" />\s*\{t\(\'mentor.public.backToMentors\'\)\}\s*</Link>\s*<span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-\[11px\] font-black uppercase tracking-\[0.16em\] text-blue-700">\s*\{t\(\'mentor.profile.publicProfile\'\)\}\s*</span>\s*</div>'

new_breadcrumbs_block = """      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Danh sách Mentor', to: '/mentors' },
            { label: name },
          ]}
        />
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 border border-indigo-100 shadow-sm">
          {t('mentor.profile.publicProfile')}
        </span>
      </div>"""

content = re.sub(old_back_block, new_breadcrumbs_block, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated MentorPublicProfilePage successfully!")
