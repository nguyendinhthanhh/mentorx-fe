# Home Page Redesign - Marketplace Style

## Ngày thực hiện
8 tháng 5, 2026

## Tổng quan
Đã thay thế landing page cũ bằng trang Home mới theo phong cách marketplace Việt Nam (Chợ Tốt, TopCV, Freelancer).

## Thay đổi

### Files đã xóa ✅
- `landing-page.html` - Landing page HTML cũ (không còn dùng)
- `mentorx-fe/src/pages/LandingPage.tsx` - Component landing page cũ

### Files đã tạo ✅
- `mentorx-fe/src/pages/HomePage.tsx` - Trang Home mới với thiết kế marketplace

### Files đã cập nhật ✅
- `mentorx-fe/src/App.tsx` - Thay đổi route `/` từ LandingPage sang HomePage

## Tính năng trang Home mới

### 1. Hero Section với Search Bar 🔍
- Search bar lớn, nổi bật ở đầu trang
- Gradient background màu xanh chuyên nghiệp
- Quick stats: Số lượng việc làm, mentor, người dùng, đánh giá

### 2. Quick Categories 🏷️
- Tab switcher: Việc làm / Mentor
- 6 categories phổ biến cho mỗi tab
- Hiển thị icon, tên và số lượng
- Hover effects chuyên nghiệp

**Job Categories:**
- Lập trình (234 việc làm)
- Thiết kế (156 việc làm)
- Marketing (189 việc làm)
- Kinh doanh (145 việc làm)
- Tài chính (98 việc làm)
- Giáo dục (167 việc làm)

**Mentor Categories:**
- Product Manager (45 mentor)
- Software Engineer (78 mentor)
- UX/UI Designer (56 mentor)
- Data Analyst (34 mentor)
- Marketing (42 mentor)
- Startup Founder (29 mentor)

### 3. Featured Jobs Section 💼
- Grid layout 2 cột (responsive)
- Hiển thị 4 việc làm nổi bật
- Thông tin đầy đủ:
  - Tiêu đề công việc
  - Công ty
  - Địa điểm
  - Mức lương
  - Loại hình (Full-time/Contract)
  - Tags kỹ năng
  - Thời gian đăng
  - Badge "Gấp" cho việc urgent
- Hover effects với border màu xanh
- Link "Xem tất cả" ở góc phải

### 4. Featured Mentors Section 👥
- Grid layout 4 cột (responsive)
- Hiển thị 4 mentor nổi bật
- Thông tin đầy đủ:
  - Avatar với initials
  - Tên mentor
  - Chức danh
  - Công ty
  - Rating và số đánh giá
  - Chuyên môn (2 tags)
  - Giá theo giờ
  - Trạng thái available (dot màu xanh/xám)
- Card design chuyên nghiệp
- Link "Xem tất cả" ở góc phải

### 5. About Platform Section ℹ️
- Background trắng để tách biệt
- 3 cột giới thiệu:
  - **Việc làm chất lượng**: Hàng nghìn cơ hội từ công ty hàng đầu
  - **Mentor chuyên nghiệp**: Kết nối với mentor có kinh nghiệm
  - **Phát triển sự nghiệp**: Công cụ và tài nguyên hỗ trợ
- Icons màu sắc (blue, green, purple)
- Text center alignment

### 6. CTA Section 🚀
- Gradient background màu xanh
- Heading lớn, rõ ràng
- 2 buttons:
  - "Tìm việc làm" (white background)
  - "Tìm mentor" (blue background với border)
- Responsive layout

## Design Principles

### 1. Màu sắc
- **Primary**: Blue (600-800) - Chuyên nghiệp, tin cậy
- **Accent**: Green (available status), Red (urgent badge)
- **Background**: Gray-50 (neutral, sạch sẽ)
- **Text**: Gray-900 (heading), Gray-600 (body)

### 2. Typography
- **Headings**: Bold, rõ ràng
- **Body**: Regular weight, dễ đọc
- **Sizes**: Responsive (text-4xl → text-5xl trên desktop)

### 3. Spacing
- Container: max-w-7xl với padding responsive
- Sections: py-8 hoặc py-16
- Cards: p-4 hoặc p-6
- Gaps: gap-4 cho grids

### 4. Components
- **Cards**: White background, shadow-sm, hover:shadow-md
- **Buttons**: Rounded-lg, font-semibold, transition-colors
- **Badges**: Small, rounded, colored backgrounds
- **Icons**: Lucide React icons (consistent style)

### 5. Responsive Design
- Mobile-first approach
- Grid breakpoints:
  - Mobile: 1 column
  - Tablet (md): 2 columns
  - Desktop (lg): 3-4 columns
- Flex direction changes: flex-col → flex-row

## Sample Data

### Jobs
- 4 featured jobs với thông tin đầy đủ
- Mix của Full-time và Contract
- Locations: Hà Nội, TP.HCM, Đà Nẵng, Remote
- Salary range: 20-45 triệu
- Tags: React, TypeScript, Figma, Node.js, etc.

### Mentors
- 4 featured mentors với profiles đầy đủ
- Companies: Grab, Tiki, VNG, Shopee
- Roles: Product Manager, UX Designer, Engineering Manager, Marketing Director
- Hourly rates: 450.000đ - 600.000đ
- Ratings: 4.8 - 5.0

## Technical Stack

### Dependencies
- React + TypeScript
- React Router (Link, useNavigate)
- Lucide React (icons)
- Tailwind CSS (styling)

### State Management
- useState for search query
- useState for active tab (jobs/mentors)

### Routing
- `/` - Home page
- `/jobs` - Jobs listing
- `/jobs/:id` - Job detail
- `/mentors` - Mentors listing
- `/mentors/:id` - Mentor profile

## Next Steps (Optional)

### 1. Connect Real APIs ⏳
- Replace sample data with API calls
- Fetch featured jobs from backend
- Fetch featured mentors from backend
- Implement search functionality

### 2. Add Filters ⏳
- Location filter
- Salary range filter
- Experience level filter
- Skills/expertise filter

### 3. Add Pagination ⏳
- Load more jobs/mentors
- Infinite scroll
- Page numbers

### 4. Add Animations ⏳
- Fade in on scroll
- Skeleton loading states
- Smooth transitions

### 5. SEO Optimization ⏳
- Meta tags
- Open Graph tags
- Structured data (JSON-LD)

## Kết luận

Trang Home mới đã được thiết kế theo phong cách marketplace Việt Nam với:
- ✅ Search bar lớn, dễ sử dụng
- ✅ Quick categories cho jobs và mentors
- ✅ Featured listings với thông tin đầy đủ
- ✅ About section giới thiệu platform
- ✅ CTA rõ ràng
- ✅ Responsive design
- ✅ Professional UI/UX

Trang đã sẵn sàng để test và có thể kết nối với backend APIs!
