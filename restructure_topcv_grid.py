import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Extract the Client Info Card
client_info_start_marker = "{/* Client Info Card */}"
client_info_end_marker = "{/* Management Actions Card */}"

c_start_idx = content.find(client_info_start_marker)
c_end_idx = content.find(client_info_end_marker)

if c_start_idx == -1 or c_end_idx == -1:
    print("Could not find Client Info Card.")
    sys.exit(1)

client_info_html = content[c_start_idx:c_end_idx]

# Remove it from the sidebar
content = content[:c_start_idx] + content[c_end_idx:]

# 2. Extract the TOP HEADER CARD
header_start_marker = "{/* TOP HEADER CARD (TopCV Style) */}"
header_end_marker = '<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">'

h_start_idx = content.find(header_start_marker)
h_end_idx = content.find(header_end_marker)

if h_start_idx == -1 or h_end_idx == -1:
    print("Could not find TOP HEADER CARD.")
    sys.exit(1)

top_header_html = content[h_start_idx:h_end_idx]

# Modify the `top_header_html` to remove the `mb-6` class from its root div, because the grid will handle the gap.
# Wait, actually it's fine, we can just replace the whole top_header_html section with a new Grid containing both.

new_top_row = f"""{{/* TOP ROW GRID (TopCV Style) */}}
        <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {top_header_html.replace('mb-6 rounded-sm', 'rounded-sm h-full')}
          
          <div className="h-full">
            {client_info_html.replace('rounded-xl border border-slate-200 bg-white  p-6 shadow-sm', 'h-full rounded-sm border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-center')}
          </div>
        </div>
        
        """

# Replace the original top header with the new Top Row Grid
content = content[:h_start_idx] + new_top_row + content[h_end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Moved Client Info Card to Top Row!")
