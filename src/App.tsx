import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { CourseProductType } from '@/types'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import AdminOnlyRoute from './components/auth/AdminOnlyRoute'
import MentorRoute from './components/auth/MentorRoute'
import ThemeProvider from './components/ThemeProvider'
import ScrollToTop from './components/ScrollToTop'
import { authApi } from './api/authApi'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'react-hot-toast'

const MainLayout = lazy(() => import('./layouts/MainLayout'))
const AuthLayout = lazy(() => import('./layouts/AuthLayout'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const MentorLayout = lazy(() => import('./layouts/MentorLayout'))
const ProfileLayout = lazy(() => import('./layouts/ProfileLayout'))
const ChatLayout = lazy(() => import('./layouts/ChatLayout'))

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const GithubCallback = lazy(() => import('./pages/auth/GithubCallback'))

const ProfileDashboardPage = lazy(() => import('./pages/user/ProfileDashboardPage'))
const SettingsPage = lazy(() => import('./pages/user/SettingsPage'))
const PreferencesPage = lazy(() => import('./pages/user/PreferencesPage'))
const BankAccountPage = lazy(() => import('./pages/user/BankAccountPage'))
const SavedMentorsPage = lazy(() => import('./pages/user/SavedMentorsPage'))
const UserAppointmentsPage = lazy(() => import('./pages/user/UserAppointmentsPage'))
const UserTransactionsPage = lazy(() => import('./pages/user/UserTransactionsPage'))
const UserPublicProfilePage = lazy(() => import('./pages/user/UserPublicProfilePage'))
const NotificationListPage = lazy(() => import('./pages/user/NotificationListPage'))
const MyComplaintsPage = lazy(() => import('./pages/user/MyComplaintsPage'))
const NewComplaintPage = lazy(() => import('./pages/user/NewComplaintPage'))
const UserReviewsPage = lazy(() => import('./pages/user/UserReviewsPage'))
const MyCoursesPage = lazy(() => import('./pages/user/MyCoursesPage'))

const MentorProfilePage = lazy(() => import('./pages/mentor/MentorProfilePage'))
const MentorListPage = lazy(() => import('./pages/mentor/MentorListPage'))
const MentorPublicProfilePage = lazy(() => import('./pages/mentor/MentorPublicProfilePage'))
const RecommendedMentorsPage = lazy(() => import('./pages/mentor/RecommendedMentorsPage'))
const MentorDashboardPage = lazy(() => import('./pages/mentor/MentorDashboardPage'))
const MentorCoursesPage = lazy(() => import('./pages/mentor/MentorCoursesPage'))
const MentorCourseManagePage = lazy(() => import('./pages/mentor/MentorCourseManagePage'))
const MentorCouponsPage = lazy(() => import('./pages/mentor/MentorCouponsPage'))
const MentorCouponFormPage = lazy(() => import('./pages/mentor/MentorCouponFormPage'))
const MentorContractsPage = lazy(() => import('./pages/mentor/MentorContractsPage'))
const MentorProposalsPage = lazy(() => import('./pages/mentor/MentorProposalsPage'))
const MentorProjectsPage = lazy(() => import('./pages/mentor/MentorProjectsPage'))
const MentorProposalDetailPage = lazy(() => import('./pages/mentor/MentorProposalDetailPage'))
const MentorMessagesPage = lazy(() => import('./pages/mentor/MentorMessagesPage'))
const MentorSchedulePage = lazy(() => import('./pages/mentor/MentorSchedulePage'))
const MentorEarningsPage = lazy(() => import('./pages/mentor/MentorEarningsPage'))
const MentorReviewsPage = lazy(() => import('./pages/mentor/MentorReviewsPage'))

const BlogCreatePage = lazy(() => import('./pages/blog/BlogCreatePage'))
const BlogEditPage = lazy(() => import('./pages/blog/BlogEditPage'))

const JobListPage = lazy(() => import('./pages/job/JobListPage'))
const JobDetailPage = lazy(() => import('./pages/job/JobDetailPage'))
const JobCreatePage = lazy(() => import('./pages/job/JobCreatePage'))
const JobEditPage = lazy(() => import('./pages/job/JobEditPage'))
const MyJobsPage = lazy(() => import('./pages/job/MyJobsPage'))
const UserRequestDetailPage = lazy(() => import('./pages/job/UserRequestDetailPage'))

const CourseListPage = lazy(() => import('./pages/course/CourseListPage'))
const CourseDetailPage = lazy(() => import('./pages/course/CourseDetailPage'))
const CourseCreatePage = lazy(() => import('./pages/course/CourseCreatePage'))
const CourseLearnPage = lazy(() => import('./pages/course/CourseLearnPage'))

const WalletPage = lazy(() => import('./pages/wallet/WalletPage'))
const PayOSReturnPage = lazy(() => import('./pages/payment/PayOSReturnPage'))
const ChatListPage = lazy(() => import('./pages/chat/ChatListPage'))
const ChatDemoPage = lazy(() => import('./pages/chat/ChatDemoPage'))

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage'))
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'))
const AdminCourseReviewPage = lazy(() => import('./pages/admin/AdminCourseReviewPage'))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminWalletPage = lazy(() => import('./pages/admin/AdminWalletPage'))
const AdminMentorApplicationsPage = lazy(() => import('./pages/admin/AdminMentorApplicationsPage'))
const AdminMentorApplicationDetailPage = lazy(() => import('./pages/admin/AdminMentorApplicationDetailPage'))
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'))
const AdminComplaintsPage = lazy(() => import('./pages/admin/AdminComplaintsPage'))
const AdminComplaintDetailPage = lazy(() => import('./pages/admin/AdminComplaintDetailPage'))
const AdminDisputesPage = lazy(() => import('./pages/admin/AdminDisputesPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'))
const AiAssistantWidget = lazy(() =>
  import('./components/ui/AiAssistantWidget').then((module) => ({ default: module.AiAssistantWidget }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

import { HelmetProvider } from 'react-helmet-async'

function AppLoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm animate-pulse space-y-4 motion-reduce:animate-none">
        <div className="h-3 w-24 rounded-full bg-emerald-800/20" />
        <div className="h-9 w-3/4 rounded-xl bg-slate-900/10" />
        <div className="h-3 w-full rounded-full bg-slate-900/10" />
        <div className="h-3 w-5/6 rounded-full bg-slate-900/10" />
      </div>
      <span className="sr-only">Loading MentorX</span>
    </div>
  )
}

function App() {
  const [authReady, setAuthReady] = useState(false)
  const setTokens = useAuthStore((state) => state.setTokens)
  const setUser = useAuthStore((state) => state.setUser)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    let active = true
    authApi.refreshToken()
      .then((session) => {
        if (!active) return
        setTokens(session.accessToken)
        setUser(session.user)
      })
      .catch(() => {
        // No valid HttpOnly refresh cookie means an anonymous session.
      })
      .finally(() => {
        if (active) setAuthReady(true)
      })
    return () => { active = false }
  }, [setTokens, setUser])

  if (!authReady) return <AppLoadingScreen />

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster position="top-right" reverseOrder={false} />
        {isAuthenticated ? (
          <Suspense fallback={null}>
            <AiAssistantWidget />
          </Suspense>
        ) : null}
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
        <Suspense fallback={<AppLoadingScreen />}>
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

          {/* Protected Onboarding Route */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* Public Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mentors" element={<MentorListPage />} />
            <Route path="/mentors/:userId" element={<MentorPublicProfilePage />} />
            <Route path="/users/:userId" element={<UserPublicProfilePage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<GuidePage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/companies" element={<Navigate to="/courses" replace />} />
            
            {/* Public Payment Return Routes */}
            <Route path="/payment/payos-return" element={<PayOSReturnPage />} />
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
            <Route path="/payment/vnpay-return" element={<Navigate to="/wallet" replace />} />
            <Route path="/payment/momo-return" element={<Navigate to="/wallet" replace />} />
            
            {/* Blog Routes */}
            <Route path="/blogs/create" element={<BlogCreatePage />} />
            <Route path="/blog/:slug/edit" element={<BlogEditPage />} />

          </Route>

          {/* Chat Routes — Dedicated full-screen layout */}
          <Route element={<ProtectedRoute><ChatLayout /></ProtectedRoute>}>
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/demo" element={<ChatDemoPage />} />
          </Route>

          <Route path="/courses/:courseId/learn" element={<CourseLearnPage />} />
          <Route path="/courses/:courseId/learn/sections/:sectionId" element={<CourseLearnPage />} />
          <Route path="/courses/:courseId/learn/sections/:sectionId/lessons/:lessonId" element={<CourseLearnPage />} />

          {/* Profile Routes with ProfileLayout */}
          <Route element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
            <Route path="/profile" element={<ProfileDashboardPage />} />
            <Route path="/profile/dashboard" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/jobs" element={<Navigate to="/users/requests" replace />} />
            <Route path="/profile/proposals" element={<div>Proposals (Coming Soon)</div>} />
            <Route path="/profile/courses" element={<MyCoursesPage />} />
            <Route path="/profile/appointments" element={<UserAppointmentsPage />} />
            <Route path="/profile/saved" element={<SavedMentorsPage />} />
            <Route path="/profile/complaints" element={<MyComplaintsPage />} />
            <Route path="/profile/complaints/new" element={<NewComplaintPage />} />
            <Route path="/profile/reviews" element={<UserReviewsPage />} />
            <Route path="/profile/preferences" element={<PreferencesPage />} />
            <Route path="/profile/bank-accounts" element={<BankAccountPage />} />
            <Route path="/profile/settings" element={<SettingsPage />} />
            <Route path="/profile/payments" element={<Navigate to="/wallet" replace />} />
            <Route path="/my-jobs" element={<MyJobsPage />} />
            <Route path="/my-jobs/:jobId" element={<UserRequestDetailPage />} />
            <Route path="/users/requests" element={<MyJobsPage />} />
            <Route path="/users/requests/:jobId" element={<UserRequestDetailPage />} />
            
            {/* Mentor Verification */}
            <Route path="/become-mentor" element={<Navigate to="/become-a-mentor" replace />} />
            <Route path="/become-a-mentor" element={<MentorProfilePage />} />
          </Route>

          {/* Legacy Dashboard Route - Redirect to Profile Dashboard */}
          <Route path="/dashboard" element={<Navigate to="/profile" replace />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminOnlyRoute><AdminUsersPage /></AdminOnlyRoute>} />
            <Route path="/admin/mentor-applications" element={<AdminMentorApplicationsPage />} />
            <Route path="/admin/mentor-applications/:userId" element={<AdminMentorApplicationDetailPage />} />
            <Route path="/admin/jobs" element={<AdminJobsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/courses/:courseId/review" element={<AdminCourseReviewPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetailPage />} />
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/wallet" element={<AdminOnlyRoute><AdminWalletPage /></AdminOnlyRoute>} />
            <Route path="/admin/settings" element={<AdminOnlyRoute><AdminSettingsPage /></AdminOnlyRoute>} />
          </Route>

          {/* Mentor Routes */}
          <Route element={<ProtectedRoute><MentorRoute><MentorLayout /></MentorRoute></ProtectedRoute>}>
            <Route path="/courses/create" element={<CourseCreatePage />} />
            <Route path="/documents/create" element={<CourseCreatePage productType={CourseProductType.DOCUMENT} />} />
            <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="/mentor/dashboard" element={<MentorDashboardPage />} />
            <Route path="/mentor/profile-setup" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/profile" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/packages" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/profile-courses" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/availability" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/documents" element={<Navigate to="/profile/settings" replace />} />
            <Route path="/mentor/projects" element={<MentorProjectsPage />} />
            <Route path="/mentor/blogs/create" element={<Navigate to="/blogs/create" replace />} />
            <Route path="/mentor/proposals" element={<Navigate to="/mentor/projects?tab=proposals" replace />} />
            <Route path="/mentor/proposals/:proposalId" element={<MentorProposalDetailPage />} />
            <Route path="/mentor/contracts" element={<Navigate to="/mentor/projects?tab=contracts" replace />} />
            <Route path="/mentor/messages" element={<MentorMessagesPage />} />
            <Route path="/mentor/courses" element={<MentorCoursesPage />} />
            <Route path="/mentor/courses/:courseId/manage" element={<MentorCourseManagePage />} />
            <Route path="/mentor/coupons" element={<MentorCouponsPage />} />
            <Route path="/mentor/coupons/new" element={<MentorCouponFormPage />} />
            <Route path="/mentor/coupons/:couponId" element={<MentorCouponFormPage />} />
            <Route path="/mentor/my-courses" element={<Navigate to="/mentor/courses" replace />} />
            <Route path="/mentor/schedule" element={<MentorSchedulePage />} />
            <Route path="/mentor/earnings" element={<MentorEarningsPage />} />
            <Route path="/mentor/wallet" element={<Navigate to="/mentor/earnings" replace />} />
            <Route path="/mentor/reviews" element={<MentorReviewsPage />} />
            <Route path="/mentor/withdraw" element={<Navigate to="/wallet" replace />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl">404 - Page Not Found</h1></div>} />
          </Routes>
        </Suspense>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
