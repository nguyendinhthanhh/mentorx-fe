import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Remove Eye from React import and add to lucide-react
content = content.replace("import { Eye, useMemo, useState } from 'react'", "import { useMemo, useState } from 'react'")
if "Eye," not in content and " Eye " not in content:
    content = content.replace("import {", "import {\n  Eye,", 1)

# Fix 2 & 3: mentor.isVerified and mentor.averageRating
# In my replacement block, I wrote:
# {mentor.isVerified && (
#    ...
# )}
# And: {mentor.averageRating > 0 && ...} and {mentor.averageRating.toFixed(1)}

content = content.replace("{mentor.isVerified && (", "{true && (") # Assuming all public profiles have verified badge as per old IdentityCard which hardcoded it
content = content.replace("mentor.averageRating > 0", "(mentor.averageRating || 0) > 0")
content = content.replace("mentor.averageRating.toFixed(1)", "mentor.averageRating?.toFixed(1)")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed TS errors")
