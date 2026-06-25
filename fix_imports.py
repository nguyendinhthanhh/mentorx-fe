import re

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]",
    lambda m: "import {" + m.group(1) + ", Clock3, Loader2, ArrowRight} from 'lucide-react'",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed imports")
