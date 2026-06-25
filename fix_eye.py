import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove Eye from react import
content = content.replace("import {\n  Eye, useMemo, useState } from 'react'", "import { useMemo, useState } from 'react'")
content = content.replace("import { Eye, useMemo, useState } from 'react'", "import { useMemo, useState } from 'react'")

# Add Eye to lucide-react import
# Find `from 'lucide-react'` and the block of imports before it
# e.g. import {\n  Award,\n  BookOpen,\n  ... } from 'lucide-react'
if " Eye," not in content and "\n  Eye," not in content:
    content = content.replace("from 'lucide-react'", "  Eye,\n} from 'lucide-react'")
    content = content.replace("}  Eye,", "  Eye,") # fix if I replaced incorrectly
    # Actually simpler:
    content = content.replace("import {\n  Award,", "import {\n  Eye,\n  Award,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed Eye import")
