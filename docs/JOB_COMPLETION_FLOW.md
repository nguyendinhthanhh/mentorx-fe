# Job Completion Flow - HYBRID APPROACH

## 🎯 Overview

Chúng ta sử dụng **HYBRID APPROACH** để quản lý việc hoàn thành công việc (Job Completion), cân bằng giữa tiện lợi và an toàn.

## 📐 Architecture

### 1. **Primary CTA: My Jobs Detail Page** (Main Action)

**Location:** `/my-jobs/:jobId` hoặc `/users/requests/:jobId`

**Features:**
- ✅ Full context view
- ✅ Job description
- ✅ Agreed terms
- ✅ Escrow amount display
- ✅ Contract details
- ✅ Deliverables summary

**Primary Action:**
```tsx
<button
  onClick={() => setShowCompleteConfirm(true)}
  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold"
>
  <CheckCircle2 className="inline h-5 w-5 mr-2" />
  Xác nhận hoàn thành & giải ngân
</button>
```

**Confirmation Modal:**
- Shows escrow amount
- Warns about action permanence
- Requires explicit confirmation

### 2. **Quick Link: Chat Banner** (Navigation Helper)

**Location:** `/chat` (when job-related conversation)

**Component:** `JobContextBanner`

**Features:**
- 🔗 Contextual link to Job Detail page
- 📊 Quick status display
- 💰 Escrow/budget display
- 🎨 Color-coded by status

**Banner Variants:**

#### **IN_PROGRESS (Active Contract)**
```tsx
<div className="bg-gradient-to-r from-emerald-50 to-blue-50">
  <p>Công việc đang thực hiện</p>
  <p>Escrow: {amount}</p>
  <Link to="/my-jobs/{jobId}">Chi tiết & Xác nhận →</Link>
</div>
```

#### **OPEN (Awaiting Mentor)**
```tsx
<div className="bg-gradient-to-r from-indigo-50 to-purple-50">
  <p>Yêu cầu đang chờ chọn mentor</p>
  <Link to="/my-jobs/{jobId}">Xem chi tiết →</Link>
</div>
```

#### **COMPLETED**
```tsx
<div className="bg-gradient-to-r from-slate-50 to-slate-100">
  <p>Công việc đã hoàn thành</p>
  <Link to="/my-jobs/{jobId}">Xem lịch sử →</Link>
</div>
```

## 🔄 User Flow

### Flow 1: Từ Chat đến Completion
```
Chat với mentor
  ↓
Thấy banner "Công việc đang thực hiện"
  ↓
Click "Chi tiết & Xác nhận"
  ↓
Mở My Jobs detail page
  ↓
Review toàn bộ thông tin
  ↓
Click "Xác nhận hoàn thành & Giải ngân"
  ↓
Modal confirmation
  ↓
Confirm → Release escrow ✅
```

### Flow 2: Direct Access
```
My Jobs list
  ↓
Click vào job
  ↓
My Jobs detail page
  ↓
Review information
  ↓
Click "Xác nhận hoàn thành"
  ↓
Confirm → Done ✅
```

## 📂 File Structure

```
src/
├── pages/
│   ├── job/
│   │   └── UserRequestDetailPage.tsx    # Primary CTA location
│   └── chat/
│       ├── ChatListPage.tsx              # Chat interface
│       └── components/
│           ├── ConversationPane.tsx      # Integrates JobContextBanner
│           └── JobContextBanner.tsx      # Banner component
```

## 🎨 Design Principles

### 1. **Separation of Concerns**
- **Chat** = Communication tool
- **My Jobs** = Management & Transaction tool

### 2. **Progressive Disclosure**
- Banner shows minimal info
- Full page shows complete context

### 3. **Contextual Awareness**
- Banner only shows when relevant
- Different variants for different statuses

### 4. **Safety First**
- No direct "Done" button in chat
- Always require full context view
- Confirmation modal for final action

## 🔐 Security Considerations

### Why NOT put "Done" button in Chat?

❌ **Problems:**
1. Lack of full context
2. Easy to click by mistake
3. Financial action requires careful review
4. Poor audit trail

✅ **Solution:**
- Link to full detail page
- Complete information before action
- Clear confirmation flow

## 🚀 Implementation Details

### JobContextBanner Component

**Props:**
```typescript
interface JobContextBannerProps {
  jobId: string
  userId: string
}
```

**Features:**
- Auto-detects job status
- Fetches contract info
- Shows appropriate variant
- Links to correct page (owner vs mentor)

**Integration:**
```tsx
// In ConversationPane.tsx
{selectedRoom.referenceType === 'JOB' && selectedRoom.referenceId && (
  <JobContextBanner 
    jobId={selectedRoom.referenceId} 
    userId={currentUserId} 
  />
)}
```

## 📊 Status-Based Behavior

| Job Status | Banner Color | CTA Text | Target Page |
|------------|--------------|----------|-------------|
| OPEN | Indigo | "Xem chi tiết" | /my-jobs/{id} |
| IN_PROGRESS | Emerald | "Chi tiết & Xác nhận" | /my-jobs/{id} |
| COMPLETED | Slate | "Xem lịch sử" | /my-jobs/{id} |
| CANCELLED | Amber | No CTA | - |
| CLOSED | Amber | No CTA | - |

## 🎯 User Roles

### Owner (Client)
- Sees banner in chat
- Can navigate to My Jobs
- Can complete contract
- Releases escrow

### Mentor
- Sees banner in chat
- Can navigate to contract page
- Cannot complete (owner only)
- Receives escrow

## 📱 Responsive Design

- Banner adapts to screen size
- Button text adjusts on mobile
- Full page optimized for all devices

## ✅ Testing Checklist

- [ ] Banner shows for IN_PROGRESS jobs
- [ ] Banner shows correct escrow amount
- [ ] Link navigates to correct page
- [ ] Owner can see complete button
- [ ] Mentor cannot see complete button
- [ ] Confirmation modal works
- [ ] Escrow releases correctly
- [ ] Banner updates after completion

## 📚 Related Documentation

- [Chat System](./CHAT_SYSTEM.md)
- [Job Management](./JOB_MANAGEMENT.md)
- [Payment Flow](./PAYMENT_FLOW.md)
- [Escrow System](./ESCROW_SYSTEM.md)

---

**Last Updated:** 2026-06-03
**Version:** 1.0.0
