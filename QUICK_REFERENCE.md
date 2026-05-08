# Quick Reference - Navigation Structure

## 🎯 TL;DR

**Header:** Clean, marketplace-focused  
**User Menu:** Minimal (Profile, Settings, Logout)  
**Quick Access:** Icons for Messages & Wallet  
**Profile Section:** Sidebar with 5 categories, 15+ features  

---

## 📍 Where to Find Things

### **In Header (Always Visible)**
- 🏠 Home → `/`
- 👥 Mentors → `/mentors`
- 💼 Jobs → `/jobs`
- 📚 Courses → `/courses`
- 💬 Messages → `/chat` (icon, logged in)
- 💰 Wallet → `/wallet` (icon, logged in)
- 🔔 Notifications → Dropdown (logged in)
- 🛡️ Admin → `/admin/dashboard` (admins only)
- 👤 Avatar → User menu (logged in)

### **In User Dropdown**
- My Profile → `/profile`
- Settings → `/profile/settings`
- Logout

### **In Profile Sidebar**
- **Overview:** Dashboard
- **Account:** Profile, Settings
- **Activity:** Messages, Notifications, Jobs, Proposals
- **Learning:** Courses, Saved, Reviews
- **Financial:** Wallet, Payments

---

## 🗺️ Route Map

```
Public:
/                    Landing page
/mentors             Browse mentors
/jobs                Browse jobs
/courses             Browse courses

Quick Access (Logged In):
/chat                Messages
/wallet              Wallet

Profile Section (Logged In):
/profile/dashboard   Dashboard (default)
/profile             Profile settings
/profile/settings    Account settings
/profile/*           Other profile pages

Admin (Admins Only):
/admin/dashboard     Admin panel

Mentor (Mentors Only):
/mentor/dashboard    Mentor panel
```

---

## 🎨 Component Structure

```
App.tsx
├── MainLayout (Public + Quick Access)
│   ├── Header
│   │   ├── Logo
│   │   ├── Public Nav (Home, Mentors, Jobs, Courses)
│   │   └── Right Side (Theme, Icons, Dropdown)
│   └── Footer
│
├── ProfileLayout (Profile Section)
│   ├── Sidebar
│   │   ├── User Card
│   │   ├── Navigation (5 sections)
│   │   └── Progress Card
│   └── Content Area
│
├── AdminLayout (Admin Section)
│   └── Admin Sidebar + Content
│
└── MentorLayout (Mentor Section)
    └── Mentor Sidebar + Content
```

---

## 🔧 Key Files

### **Layouts**
- `MainLayout.tsx` - Main header/footer
- `ProfileLayout.tsx` - Profile sidebar
- `AdminLayout.tsx` - Admin sidebar
- `MentorLayout.tsx` - Mentor sidebar

### **Pages**
- `LandingPage.tsx` - Home page
- `ProfileDashboardPage.tsx` - Profile dashboard
- `ProfilePage.tsx` - Profile settings

### **Utils**
- `roleRedirect.ts` - Role-based redirects

### **Routes**
- `App.tsx` - All route definitions

---

## 💡 Quick Tips

### **Adding a New Profile Page**
1. Create page in `src/pages/user/`
2. Add route in `App.tsx` under ProfileLayout
3. Add link in `ProfileLayout.tsx` sidebar

### **Adding a Quick Access Icon**
1. Add icon in `MainLayout.tsx` right side
2. Link to the page
3. Add tooltip

### **Changing Default Dashboard**
1. Update `roleRedirect.ts`
2. Update redirect in `App.tsx`

---

## 🎯 Design Rules

1. **Header = Public browsing**
   - Only show public navigation
   - Quick access icons for common actions
   - Minimal user dropdown

2. **Profile = Management**
   - All user features in sidebar
   - Organized by category
   - Scalable structure

3. **Quick Access = Frequently Used**
   - Messages and Wallet get icons
   - One-click access
   - Always visible when logged in

4. **Dropdown = Essential Only**
   - Profile settings
   - Account settings
   - Logout

---

## 📱 Responsive

- **Desktop:** Full header + sidebar
- **Tablet:** Condensed header + collapsible sidebar
- **Mobile:** Hamburger menu + stacked layout

---

## 🚀 Common Tasks

### **Add a new public page**
```tsx
// In App.tsx
<Route element={<MainLayout />}>
  <Route path="/new-page" element={<NewPage />} />
</Route>
```

### **Add a new profile page**
```tsx
// In App.tsx
<Route element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
  <Route path="/profile/new" element={<NewProfilePage />} />
</Route>

// In ProfileLayout.tsx
{
  title: 'Section',
  items: [
    { to: '/profile/new', label: 'New Page', icon: Icon, description: 'Description' },
  ],
}
```

### **Add a quick access icon**
```tsx
// In MainLayout.tsx, right side section
<Link
  to="/new-feature"
  className="hidden sm:flex p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  title="New Feature"
>
  <Icon className="h-5 w-5" />
</Link>
```

---

## 📚 Full Documentation

- **NAVIGATION_FINAL_DESIGN.md** - Complete design
- **PROFILE_LAYOUT_REDESIGN.md** - Profile details
- **REDESIGN_SUMMARY.md** - Summary of changes

---

**Last Updated:** 2026-05-07  
**Status:** ✅ Production Ready
