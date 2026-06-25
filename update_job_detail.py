import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import for Breadcrumbs
import_str = "import { Breadcrumbs } from '@/components/ui/Breadcrumbs'"
if import_str not in content:
    last_import_idx = content.rfind("import ")
    if last_import_idx != -1:
        end_of_last_import = content.find("\n", last_import_idx)
        content = content[:end_of_last_import] + "\n" + import_str + content[end_of_last_import:]

# 2. Replace the old Breadcrumb navigation block
old_nav_block = r'\{\/\* Breadcrumb \*\/.*?<\/nav>'

new_nav_block = """{/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Trang chủ', to: '/' },
              { label: 'Việc làm IT', to: '/jobs' },
              { label: job.title },
            ]}
          />
        </div>"""

content = re.sub(old_nav_block, new_nav_block, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated JobDetailPage successfully!")
