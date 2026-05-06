import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import MentorLayout from './layouts/MentorLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Dashboard Pages
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/user/ProfilePage'
import MentorProfilePage from './pages/mentor/MentorProfilePage'
import MentorListPage from './pages/mentor/MentorListPage'
import MentorPublicProfilePage from './pages/mentor/MentorPublicProfilePage'
import NotificationListPage from './pages/user/NotificationListPage'

// Job Pages
import JobListPage from './pages/job/JobListPage'
import JobDetailPage from './pages/job/JobDetailPage'
import JobCreatePage from './pages/job/JobCreatePage'

// Course Pages
import CourseListPage from './pages/course/CourseListPage'
import CourseDetailPage from './pages/course/CourseDetailPage'
import CourseCreatePage from './pages/course/CourseCreatePage'

// Wallet Pages
import WalletPage from './pages/wallet/WalletPage'

// Chat Page
import ChatListPage from './pages/chat/ChatListPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminApiPage from './pages/admin/AdminApiPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminJobsPage from './pages/admin/AdminJobsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminWalletPage from './pages/admin/AdminWalletPage'

// Mentor Pages
import MentorDashboardPage from './pages/mentor/MentorDashboardPage'

// Protected Route Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import MentorRoute from './components/auth/MentorRoute'
import ThemeProvider from './components/ThemeProvider'

import LandingPage from './pages/LandingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* Protected Onboarding Route */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* Public Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/mentors" element={<MentorListPage />} />
            <Route path="/mentors/:userId" element={<MentorPublicProfilePage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* User Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationListPage />} />
            
            {/* Mentor Routes */}
            <Route path="/mentor/profile" element={<MentorProfilePage />} />
            
            {/* Job Routes */}
            <Route path="/jobs/create" element={<JobCreatePage />} />
            
            {/* Course Routes */}
            <Route path="/courses/create" element={<CourseCreatePage />} />
            
            {/* Wallet Routes */}
            <Route path="/wallet" element={<WalletPage />} />

            {/* Chat Routes */}
            <Route path="/chat" element={<ChatListPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/api" element={<AdminApiPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/jobs" element={<AdminJobsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/wallet" element={<AdminWalletPage />} />
            <Route path="/admin/analytics" element={<div>System Analytics (Coming Soon)</div>} />
            <Route path="/admin/settings" element={<div>Platform Settings (Coming Soon)</div>} />
          </Route>

          {/* Mentor Routes */}
          <Route element={<ProtectedRoute><MentorRoute><MentorLayout /></MentorRoute></ProtectedRoute>}>
            <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="/mentor/dashboard" element={<MentorDashboardPage />} />
            <Route path="/mentor/proposals" element={<div>My Proposals (Coming Soon)</div>} />
            <Route path="/mentor/contracts" element={<div>Active Contracts (Coming Soon)</div>} />
            <Route path="/mentor/my-courses" element={<div>My Courses (Coming Soon)</div>} />
            <Route path="/mentor/schedule" element={<div>Schedule (Coming Soon)</div>} />
            <Route path="/mentor/wallet" element={<div>Earnings (Coming Soon)</div>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl">404 - Page Not Found</h1></div>} />
        </Routes>
      </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
