import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import MentorLayout from './layouts/MentorLayout'
import ProfileLayout from './layouts/ProfileLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import GithubCallback from './pages/auth/GithubCallback'

// Dashboard Pages
import ProfilePage from './pages/user/ProfilePage'
import SavedMentorsPage from './pages/user/SavedMentorsPage'
import MentorProfilePage from './pages/mentor/MentorProfilePage'
import MentorListPage from './pages/mentor/MentorListPage'
import MentorPublicProfilePage from './pages/mentor/MentorPublicProfilePage'
import RecommendedMentorsPage from './pages/mentor/RecommendedMentorsPage'
import NotificationListPage from './pages/user/NotificationListPage'
import MyComplaintsPage from './pages/user/MyComplaintsPage'
import NewComplaintPage from './pages/user/NewComplaintPage'

// Job Pages
import JobListPage from './pages/job/JobListPage'
import JobDetailPage from './pages/job/JobDetailPage'
import JobCreatePage from './pages/job/JobCreatePage'
import JobEditPage from './pages/job/JobEditPage'
import MyJobsPage from './pages/job/MyJobsPage'
import UserRequestDetailPage from './pages/job/UserRequestDetailPage'

// Course Pages
import CourseListPage from './pages/course/CourseListPage'
import CourseDetailPage from './pages/course/CourseDetailPage'
import CourseCreatePage from './pages/course/CourseCreatePage'
import CourseLearnPage from './pages/course/CourseLearnPage'

// Wallet Pages
import WalletPage from './pages/wallet/WalletPage'

// Payment Pages
import VNPayReturnPage from './pages/payment/VNPayReturnPage'
import MomoReturnPage from './pages/payment/MomoReturnPage'
import PayOSReturnPage from './pages/payment/PayOSReturnPage'

// Chat Page
import ChatListPage from './pages/chat/ChatListPage'
import ChatDemoPage from './pages/chat/ChatDemoPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminApiPage from './pages/admin/AdminApiPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminJobsPage from './pages/admin/AdminJobsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCourseReviewPage from './pages/admin/AdminCourseReviewPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminWalletPage from './pages/admin/AdminWalletPage'
import AdminMentorApplicationsPage from './pages/admin/AdminMentorApplicationsPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage'
import AdminComplaintDetailPage from './pages/admin/AdminComplaintDetailPage'

// Mentor Pages
import MentorDashboardPage from './pages/mentor/MentorDashboardPage'
import MentorCoursesPage from './pages/mentor/MentorCoursesPage'
import MentorCourseManagePage from './pages/mentor/MentorCourseManagePage'
import MentorContractsPage from './pages/mentor/MentorContractsPage'
import MentorProposalsPage from './pages/mentor/MentorProposalsPage'
import MentorProposalDetailPage from './pages/mentor/MentorProposalDetailPage'
import MentorProfileSetupPage from './pages/mentor/MentorProfileSetupPage'
import MentorMessagesPage from './pages/mentor/MentorMessagesPage'
import MentorSchedulePage from './pages/mentor/MentorSchedulePage'
import MentorEarningsPage from './pages/mentor/MentorEarningsPage'
import MentorReviewsPage from './pages/mentor/MentorReviewsPage'
import MentorSettingsPage from './pages/mentor/MentorSettingsPage'
import MyCoursesPage from './pages/user/MyCoursesPage'


// Protected Route Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import AdminOnlyRoute from './components/auth/AdminOnlyRoute'
import MentorRoute from './components/auth/MentorRoute'
import ThemeProvider from './components/ThemeProvider'

import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import GuidePage from './pages/GuidePage'
import { Toaster } from 'react-hot-toast'

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
        <Toaster position="top-right" reverseOrder={false} />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/github/callback" element={<GithubCallback />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

          </Route>

          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Onboarding Route */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* Public Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mentors" element={<MentorListPage />} />
            <Route path="/mentors/:userId" element={<MentorPublicProfilePage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<GuidePage />} />
            <Route path="/companies" element={<Navigate to="/courses" replace />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {/* Recommended Mentors - Protected Route */}
            <Route path="/mentors/recommended" element={<RecommendedMentorsPage />} />
            
            {/* Job Routes */}
            <Route path="/jobs/create" element={<JobCreatePage />} />
            <Route path="/jobs/:jobId/edit" element={<JobEditPage />} />
            
            {/* Wallet Routes */}
            <Route path="/wallet" element={<WalletPage />} />

            {/* Payment Routes */}
            <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
            <Route path="/payment/momo-return" element={<MomoReturnPage />} />
            <Route path="/payment/payos-return" element={<PayOSReturnPage />} />

            {/* Chat Routes */}
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/demo" element={<ChatDemoPage />} />
            <Route path="/courses/:courseId/learn" element={<CourseLearnPage />} />
            <Route path="/courses/:courseId/learn/sections/:sectionId" element={<CourseLearnPage />} />
            <Route path="/courses/:courseId/learn/sections/:sectionId/lessons/:lessonId" element={<CourseLearnPage />} />

          </Route>

          {/* Profile Routes with ProfileLayout */}
          <Route element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/dashboard" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/settings" element={<div>Settings Page (Coming Soon)</div>} />
            <Route path="/profile/notifications" element={<NotificationListPage />} />
            <Route path="/profile/jobs" element={<Navigate to="/users/requests" replace />} />
            <Route path="/profile/proposals" element={<div>Proposals (Coming Soon)</div>} />
            <Route path="/profile/courses" element={<MyCoursesPage />} />
            <Route path="/profile/appointments" element={<div>Appointments (Coming Soon)</div>} />
            <Route path="/profile/transactions" element={<div>Transactions (Coming Soon)</div>} />
            <Route path="/profile/saved" element={<SavedMentorsPage />} />
            <Route path="/profile/complaints" element={<MyComplaintsPage />} />
            <Route path="/profile/complaints/new" element={<NewComplaintPage />} />
            <Route path="/profile/reviews" element={<div>Reviews (Coming Soon)</div>} />
            <Route path="/profile/payments" element={<div>Payment Methods (Coming Soon)</div>} />
            <Route path="/my-jobs" element={<MyJobsPage />} />
            <Route path="/my-jobs/:jobId" element={<UserRequestDetailPage />} />
            <Route path="/users/requests" element={<MyJobsPage />} />
            <Route path="/users/requests/:jobId" element={<UserRequestDetailPage />} />
            
            {/* Mentor Verification */}
            <Route path="/become-a-mentor" element={<MentorProfilePage />} />
          </Route>

          {/* Legacy Dashboard Route - Redirect to Profile Dashboard */}
          <Route path="/dashboard" element={<Navigate to="/profile" replace />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/api" element={<AdminOnlyRoute><AdminApiPage /></AdminOnlyRoute>} />
            <Route path="/admin/users" element={<AdminOnlyRoute><AdminUsersPage /></AdminOnlyRoute>} />
            <Route path="/admin/mentor-applications" element={<AdminMentorApplicationsPage />} />
            <Route path="/admin/jobs" element={<AdminJobsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/courses/:courseId/review" element={<AdminCourseReviewPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetailPage />} />
            <Route path="/admin/wallet" element={<AdminOnlyRoute><AdminWalletPage /></AdminOnlyRoute>} />
            <Route path="/admin/settings" element={<AdminOnlyRoute><div>Platform Settings (Coming Soon)</div></AdminOnlyRoute>} />
          </Route>

          {/* Mentor Routes */}
          <Route element={<ProtectedRoute><MentorRoute><MentorLayout /></MentorRoute></ProtectedRoute>}>
            <Route path="/courses/create" element={<CourseCreatePage />} />
            <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="/mentor/dashboard" element={<MentorDashboardPage />} />
            <Route path="/mentor/profile" element={<MentorProfileSetupPage initialTab="profile" />} />
            <Route path="/mentor/profile-setup" element={<MentorProfileSetupPage initialTab="profile" />} />
            <Route path="/mentor/packages" element={<MentorProfileSetupPage initialTab="packages" />} />
            <Route path="/mentor/profile-courses" element={<MentorProfileSetupPage initialTab="courses" />} />
            <Route path="/mentor/availability" element={<MentorProfileSetupPage initialTab="availability" />} />
            <Route path="/mentor/proposals" element={<MentorProposalsPage />} />
            <Route path="/mentor/proposals/:proposalId" element={<MentorProposalDetailPage />} />
            <Route path="/mentor/contracts" element={<MentorContractsPage />} />
            <Route path="/mentor/messages" element={<MentorMessagesPage />} />
            <Route path="/mentor/courses" element={<MentorCoursesPage />} />
            <Route path="/mentor/courses/:courseId/manage" element={<MentorCourseManagePage />} />
            <Route path="/mentor/my-courses" element={<Navigate to="/mentor/courses" replace />} />
            <Route path="/mentor/schedule" element={<MentorSchedulePage />} />
            <Route path="/mentor/earnings" element={<MentorEarningsPage />} />
            <Route path="/mentor/wallet" element={<Navigate to="/mentor/earnings" replace />} />
            <Route path="/mentor/reviews" element={<MentorReviewsPage />} />
            <Route path="/mentor/settings" element={<MentorSettingsPage />} />
            <Route path="/mentor/withdraw" element={<Navigate to="/wallet" replace />} />
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
