import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. We need to extract the TOP HEADER CARD and the Client Info Card from the TOP ROW GRID.
# And put the TOP HEADER CARD into the "Main Column".
# And put the Client Info Card back into the "Sidebar".

top_row_start = "{/* TOP ROW GRID (TopCV Style) */}"
top_row_end = '<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">'

tr_start_idx = content.find(top_row_start)
tr_end_idx = content.find(top_row_end)

if tr_start_idx == -1 or tr_end_idx == -1:
    print("Could not find TOP ROW GRID.")
    sys.exit(1)

top_row_content = content[tr_start_idx:tr_end_idx]

# Extract TOP HEADER CARD
header_start = "{/* TOP HEADER CARD (TopCV Style) */}"
header_end = '<div className="h-full">' # This is where the Client Info Card wrapper starts in the top row
h_start_idx = top_row_content.find(header_start)
h_end_idx = top_row_content.find(header_end)

if h_start_idx == -1 or h_end_idx == -1:
    print("Could not extract TOP HEADER CARD.")
    sys.exit(1)

top_header_card = top_row_content[h_start_idx:h_end_idx].strip()
# Remove the wrapping `div className="mb-6 grid ..."` logic
# Actually, top_header_card currently contains `<div className="rounded-sm h-full border border-slate-200 bg-white p-6 shadow-sm">`
top_header_card = top_header_card.replace('rounded-sm h-full border', 'rounded-sm border')

# Extract Client Info Card
client_info_start = "{/* Client Info Card */}"
client_info_end = "</div>\n        </div>\n        \n" # The end of the TOP ROW GRID

c_start_idx = top_row_content.find(client_info_start)
c_end_idx = top_row_content.find("</div>\n        </div>\n        \n", c_start_idx)

if c_start_idx == -1:
    print("Could not extract Client Info Card.")
    sys.exit(1)

client_info_card = top_row_content[c_start_idx:]
# Clean up the wrapper `<div className="h-full">`
client_info_card = client_info_card.replace('<div className="h-full">\n            ', '')
client_info_card = client_info_card.rsplit('</div>\n        </div>', 1)[0]
client_info_card = client_info_card.strip()

# Now remove the entire TOP ROW GRID from content
content = content[:tr_start_idx] + content[tr_end_idx:]

# Now we have the single grid: `<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">`
# We need to inject the `top_header_card` at the very top of the Main Column (`<div className="space-y-6">`)
main_col_start = '<div className="space-y-6">'
m_idx = content.find(main_col_start)
if m_idx == -1:
    print("Could not find Main Column.")
    sys.exit(1)

content = content[:m_idx + len(main_col_start)] + "\n" + top_header_card + "\n" + content[m_idx + len(main_col_start):]

# Now inject the `client_info_card` into the Sidebar, right below "Thông tin chung" or above it.
# The user's list: "Thông tin chung... Lĩnh vực... Thông tin Client... MentorX AI Assistant"
# So Client Info Card goes after THÔNG TIN CHUNG CARD
sidebar_general_end = "</div>\n\n            {/* Management Actions Card */}"
sg_idx = content.find(sidebar_general_end)

if sg_idx == -1:
    print("Could not find Sidebar General End.")
    sys.exit(1)

content = content[:sg_idx + 6] + "\n            " + client_info_card + "\n" + content[sg_idx + 6:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Restructured to Single Grid Layout!")
