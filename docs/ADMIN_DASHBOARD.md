# Admin Dashboard

> Mỗi mục là một widget/hiển thị trên trang dashboard. Kèm endpoint để frontend gọi.

## Stat Cards (hàng trên cùng)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Tổng users | Số nguyên | `GET /api/users/statistics/total` |
| Users đang hoạt động | Số nguyên | `GET /api/users/statistics/active` |
| Mentor đã duyệt | Số nguyên | `GET /api/users/statistics/mentors` |
| Mentor chờ duyệt | Số nguyên | `GET /api/users/statistics/pending-mentors` |
| Tổng escrow đang khóa | Số tiền | `GET /api/v1/wallet/escrow/total-locked` |
| Ví cần đối soát | Số nguyên | `GET /api/v1/wallet/admin/wallets/reconciliation-required` |

## Pending Approvals (hàng thứ hai)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Mentor chờ duyệt | Số lượng + link sang trang duyệt | `GET /api/users/statistics/pending-mentors` |
| Payout accounts chờ duyệt | Số lượng + link sang trang duyệt | `GET /api/v1/admin/mentor-payouts` |
| Yêu cầu rút tiền chờ xử lý | Số lượng + link sang trang duyệt | `GET /api/v1/wallet/admin/withdrawals` |
| Báo cáo escalated | Số lượng + link sang trang reports | `GET /api/admin/reports/escalated` |
| Khiếu nại pending | Số lượng + link sang trang complaints | `GET /api/admin/complaints?status=PENDING` |

## Financial Overview

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Tổng quan tài chính | Balance, revenue, platform fees | `GET /api/v1/wallet/admin/financial-summary` |

## Report Stats

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Thống kê báo cáo | Counts theo status, category, targetType, avg resolution time | `GET /api/admin/reports/stats` |

## Recent Activity (2 bảng nhỏ cuối trang)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Báo cáo gần đây | Danh sách 5-10 reports mới nhất (id, category, status, priority, sla) | `GET /api/admin/reports?page=0&size=10&sort=createdAt,desc` |
| Giao dịch gần đây | Danh sách 5-10 transactions mới nhất (type, amount, user) | `GET /api/v1/wallet/admin/transactions?page=0&size=10` |
