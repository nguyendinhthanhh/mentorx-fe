import re
import sys

file_path = r"d:\Mentor X\mentorx-fe\src\pages\job\JobDetailPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Insert the helper functions right before getJobDisplayData
helpers = """
function getTimeRemaining(deadlineAt: string | undefined | null) {
  if (!deadlineAt) return 'Không giới hạn';
  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Đã hết hạn';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  return `Còn ${minutes} phút`;
}

function getFullDateTime(deadlineAt: string | undefined | null) {
  if (!deadlineAt) return 'Không giới hạn';
  const d = new Date(deadlineAt);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} tháng ${month}, ${year} ${hours}:${minutes}`;
}

function getJobDisplayData"""

content = content.replace("function getJobDisplayData", helpers)

# 2. Update the Top Header usage
content = content.replace(
    'Hạn nhận đề xuất: <span className="font-medium text-gray-900">{derived.deadline}</span>',
    'Hạn nhận đề xuất: <span className="font-medium text-[#00b14f] bg-green-50 px-2 py-1 rounded-md border border-green-100">{getTimeRemaining(job.deadlineAt)}</span>'
)

# 3. Update the Sidebar usage
content = content.replace(
    '<p className="text-[14px] font-bold text-gray-900">{derived.deadline}</p>',
    '<p className="text-[14px] font-bold text-gray-900">{getFullDateTime(job.deadlineAt)}</p>'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated deadline formatting!")
