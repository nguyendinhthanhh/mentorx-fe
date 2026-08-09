# Moderator Dashboard

> Mỗi mục là một widget/hiển thị trên trang dashboard. Kèm endpoint để frontend gọi.

## Stat Cards (hàng trên cùng)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Tổng users | Số nguyên | `GET /api/users/statistics/total` |
| Users đang hoạt động | Số nguyên | `GET /api/users/statistics/active` |
| Mentor đã duyệt | Số nguyên | `GET /api/users/statistics/mentors` |
| Mentor chờ duyệt | Số nguyên | `GET /api/users/statistics/pending-mentors` |

## Pending Queue (hàng thứ hai)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Mentor chờ duyệt | Số lượng + link sang trang duyệt | `GET /api/mentors/pending` |
| Reports chưa có người xử lý | Số lượng PENDING reports | `GET /api/moderator/reports?status=PENDING` |
| Reports khẩn cấp | Số lượng urgent reports | `GET /api/moderator/reports?isUrgent=true` |
| Disputes đang mở | Số lượng + link sang trang disputes | `GET /api/disputes/admin/queue` |

## Report Queue (bảng chính — trọng tâm của moderator)

| Widget | Dữ liệu | Endpoint |
|---|---|---|
| Hàng đợi báo cáo | Table: id, priority, category, status, targetType, assignedTo, slaDeadline. Có tabs filter: Tất cả / Chưa claim / Của tôi / Khẩn cấp | `GET /api/moderator/reports?status=&category=&targetType=&isUrgent=&assignedToId=&page=&size=&sort=` |
| Chi tiết báo cáo (click row) | Reporter info, evidence, SLA, escalation history, similar reports, moderator notes | `GET /api/moderator/reports/{reportId}` |

### Hành động trên row (moderator interaction)

| Hành động | Endpoint |
|---|---|
| Claim báo cáo | `POST /api/moderator/reports/{reportId}/claim` |
| Thêm ghi chú nội bộ | `POST /api/moderator/reports/{reportId}/notes` |
| Yêu cầu thêm thông tin | `POST /api/moderator/reports/{reportId}/request-info` |
| Ẩn nội dung | `POST /api/moderator/reports/{reportId}/hide-content` |
| Resolve (WARN / REMOVE CONTENT / EDIT CONTENT) | `POST /api/moderator/reports/{reportId}/resolve` |
| Dismiss | `POST /api/moderator/reports/{reportId}/dismiss` |
| Escalate lên admin | `POST /api/moderator/reports/{reportId}/escalate` |
