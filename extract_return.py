import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to find the main return block of MentorPublicProfilePage
# It starts with:
#   return (
#     <div className="mx-auto max-w-[1360px] space-y-8 px-4 pb-10 pt-2 sm:px-6 lg:px-8">

start_idx = content.find('  return (\n    <div className="mx-auto max-w-[1360px]')
if start_idx == -1:
    print("Could not find start index")
    sys.exit(1)

# The end of the main function is right before `function IdentityCard`
end_idx = content.find('function IdentityCard', start_idx)
if end_idx == -1:
    print("Could not find IdentityCard")
    sys.exit(1)

# We want to replace everything from start_idx up to the closing `  )\n}\n\n` before IdentityCard.
# Let's find the closing brace before end_idx
closing_idx = content.rfind('  )\n}', start_idx, end_idx)

if closing_idx == -1:
    print("Could not find closing brace")
    sys.exit(1)

original_return_block = content[start_idx:closing_idx + 6]

# Write it out to a file so we can inspect it safely
with open("original_return_block.txt", "w", encoding="utf-8") as out:
    out.write(original_return_block)

print("Extracted original return block successfully!")
