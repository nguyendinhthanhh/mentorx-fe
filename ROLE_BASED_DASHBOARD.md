# Role-Based Dashboard System

## Tổng quan
Hệ thống dashboard được phân chia theo role của user, mỗi role sẽ có dashboard riêng với nội dung và chức năng phù hợp.

## Quyền truy cập

### Admin có quyền truy cập:
✅ **Tất cả trang Admin** (`/admin/*`)
✅ **Tất cả trang Mentor** (`/mentor/*`)  
✅ **Tất cả trang User** (`/dashboard`, `/jobs`, `/courses`, `/wallet`, etc.)

### Mentor có quyền truy cập:
✅ **Tất cả trang Mentor** (`/mentor/*`)
✅ **Tất cả trang User** (`/dashboard`, `/jobs`, `/courses`, `/wallet`, etc.)
❌ **Không có quyền Admin** (`/admin/*`)

### User thường có quyền truy cập:
✅ **Tất cả trang User** (`/dashboard`, `/jobs`, `/courses`, `/wallet`, etc.)
❌ **Không có quyền Mentor** (`/mentor/*`)
❌ **Không có quyền Admin** (`/admin/*`)

## Navigation giữa các Views

### Logo Click → Trang chủ
- **AdminLayout:** Click logo "AdminHub" → Redirect về `/` (trang chủ)
- **MentorLayout:** Click logo "MentorHub" → Redirect về `/` (trang chủ)
- **MainLayout:** Click logo "MentorX" → Redirect về `/` (trang chủ)

### Admin Badge trong User View
- **MainLayout (User View):** Nút "Admin" màu đỏ/cam trong header
  - Chỉ hiện khi user có role ADMIN
  - Click để quay về `/admin/dashboard`

### Flow điển hình cho Admin:
1. Login → `/admin/dashboard`
2. Click logo "AdminHub" → `/` (trang chủ với user view)
3. Click nút "Admin" trong header → Quay về `/admin/dashboard`
4. Navigate to `/mentor/dashboard` → Xem mentor view
5. Click logo "MentorHub" → `/` (trang chủ)

## Các Role và Dashboard

### 1. Admin Dashboard (`/admin/dashboard`)
**Điều kiện truy cập:** User có role `ADMIN`

**Tính năng:**
- Platform Overview với real-time statistics
- API Function Management - Monitor các services
- System Resources monitoring (CPU, Memory, Database)
- Moderation queue - Xử lý reports
- Quick access đến các trang quản trị:
  - Users Management (`/admin/users`)
  - Jobs Management (`/admin/jobs`)
  - Courses Management (`/admin/courses`)
  - Reports Management (`/admin/reports`)
  - Wallet Management (`/admin/wallet`)
  - API Management (`/admin/api`)

**Stats hiển thị:**
- Total Users
- Active Jobs
- Total Revenue
- Course Sales

### 2. Mentor Dashboard (`/mentor/dashboard`)
**Điều kiện truy cập:** User có role `MENTOR` hoặc `mentorStatus === 'APPROVED'`

**Tính năng:**
- Earnings overview và performance metrics
- Recent Proposals tracking
- Profile Visibility toggle
- Next Session schedule
- Quick access đến:
  - My Proposals (`/mentor/proposals`)
  - Active Contracts (`/mentor/contracts`)
  - My Courses (`/mentor/my-courses`)
  - Schedule (`/mentor/schedule`)
  - Earnings (`/mentor/wallet`)

**Stats hiển thị:**
- Total Earnings (MXC)
- Active Contracts
- Average Rating
- Total Students

### 3. User Dashboard (`/dashboard`)
**Điều kiện truy cập:** User đã authenticated (default dashboard)

**Tính năng:**
- Personal greeting với time-based message
- Quick Actions menu
- Recent Activity feed
- Stats overview
- Quick links đến:
  - Post a Job (`/jobs/create`)
  - Become a Mentor (`/mentor/profile`)
  - Browse Courses (`/courses`)
  - Manage Wallet (`/wallet`)

**Stats hiển thị:**
- Active Jobs
- Enrolled Courses
- Wallet Balance (MXC)
- Unread Notifications

## Login Flow và Redirect Logic

### Sau khi login thành công:
```typescript
// Priority order:
1. ADMIN role → /admin/dashboard
2. MENTOR role hoặc mentorStatus === 'APPROVED' → /mentor/dashboard
3. Default → /dashboard
```

### Khi truy cập Landing Page (`/`):
- **Unauthenticated users:** Hiển thị landing page
- **Authenticated users:** Auto redirect về dashboard phù hợp với role

## Files đã tạo/cập nhật

### Backend
- ✅ `WalletController.java` - Fixed endpoints to `/api/v1/wallet`
- ✅ `AuthServiceImpl.java` - Auto-create wallets on registration

### Frontend - Core
- ✅ `mentorx-fe/src/api/walletApi.ts` - Updated endpoints to `/v1/wallet`
- ✅ `mentorx-fe/src/components/auth/LoginForm.tsx` - Role-based redirect logic
- ✅ `mentorx-fe/src/components/auth/DashboardRedirect.tsx` - New component
- ✅ `mentorx-fe/src/components/auth/AdminRoute.tsx` - Updated to use utility functions
- ✅ `mentorx-fe/src/components/auth/MentorRoute.tsx` - Admin bypass + utility functions
- ✅ `mentorx-fe/src/utils/roleRedirect.ts` - Helper functions

### Frontend - Pages
- ✅ `mentorx-fe/src/pages/LandingPage.tsx` - Auto redirect authenticated users
- ✅ `mentorx-fe/src/pages/admin/AdminDashboardPage.tsx` - Full admin dashboard
- ✅ `mentorx-fe/src/pages/mentor/MentorDashboardPage.tsx` - Full mentor dashboard
- ✅ `mentorx-fe/src/pages/DashboardPage.tsx` - Full user dashboard

### Frontend - Layouts
- ✅ `mentorx-fe/src/layouts/AdminLayout.tsx` - Added Quick Access section
- ✅ `mentorx-fe/src/layouts/MentorLayout.tsx` - Added Quick Access + Admin badge
- ✅ `mentorx-fe/src/layouts/MainLayout.tsx` - Added Admin badge in header

## Utility Functions

### `getDashboardPath(user)`
Trả về đường dẫn dashboard phù hợp dựa trên role của user.

### `hasRole(user, role)`
Kiểm tra xem user có role cụ thể hay không.

### `isAdmin(user)`
Kiểm tra xem user có phải admin không.

### `isMentor(user)`
Kiểm tra xem user có phải mentor không (bao gồm cả mentorStatus).

## Testing

### Test Admin Login:
1. Login với account có role ADMIN
2. Verify redirect đến `/admin/dashboard`
3. Verify có thể truy cập:
   - ✅ Tất cả admin routes (`/admin/*`)
   - ✅ Tất cả mentor routes (`/mentor/*`)
   - ✅ Tất cả user routes (`/dashboard`, `/jobs`, etc.)
4. Verify Quick Access links trong sidebar
5. Verify Admin badge xuất hiện trong Mentor và User layouts

### Test Mentor Login:
1. Login với account có role MENTOR hoặc mentorStatus = APPROVED
2. Verify redirect đến `/mentor/dashboard`
3. Verify có thể truy cập:
   - ✅ Tất cả mentor routes (`/mentor/*`)
   - ✅ Tất cả user routes (`/dashboard`, `/jobs`, etc.)
   - ❌ Không thể truy cập admin routes (redirect về `/dashboard`)
4. Verify Quick Access links trong sidebar

### Test User Login:
1. Login với account thường (không có ADMIN/MENTOR role)
2. Verify redirect đến `/dashboard`
3. Verify có thể truy cập:
   - ✅ Tất cả user routes (`/dashboard`, `/jobs`, etc.)
   - ❌ Không thể truy cập mentor routes (redirect về `/mentor/profile`)
   - ❌ Không thể truy cập admin routes (redirect về `/dashboard`)

### Test Landing Page:
1. Logout và truy cập `/`
2. Verify hiển thị landing page
3. Login và verify auto redirect về dashboard phù hợp

### Test Navigation:
1. Login as Admin
2. Verify ở `/admin/dashboard`
3. Click logo "AdminHub" → Verify redirect đến `/` (trang chủ)
4. Verify Admin badge xuất hiện trong header
5. Click Admin badge → Verify redirect về `/admin/dashboard`
6. Navigate to `/mentor/dashboard` → Verify có thể truy cập
7. Click logo "MentorHub" → Verify redirect đến `/` (trang chủ)
8. Verify Admin badge xuất hiện trong header
9. Click Admin badge → Verify redirect về `/admin/dashboard`

## UI/UX Features

### Logo Navigation
- **AdminLayout:** Logo "AdminHub" link về `/` (trang chủ)
- **MentorLayout:** Logo "MentorHub" link về `/` (trang chủ)
- **MainLayout:** Logo "MentorX" link về `/` (trang chủ)
- **Mục đích:** Cho phép admin/mentor nhanh chóng quay về trang chủ để xem user view

### Admin Badge
- **Vị trí:** Header của MainLayout (chỉ khi ở user view)
- **Màu sắc:** Gradient đỏ/cam (rose-500 to orange-500)
- **Icon:** ShieldAlert
- **Chức năng:** Quick access về Admin Panel từ user view
- **Hiển thị:** Chỉ khi user có role ADMIN

## Notes

- Folder `mentorx-frontend` (Next.js) đã được xóa
- Tất cả code giờ nằm trong `mentorx-fe` (Vite + React)
- API endpoints đã được fix từ `/api/wallet` → `/api/v1/wallet`
- Backend auto-create 3 wallets khi user register: USER_AVAILABLE, USER_PENDING, ESCROW
- Admin có full access vào tất cả các trang trong hệ thống
- MentorRoute đã được cập nhật để cho phép admin bypass

