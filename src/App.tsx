import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Dashboard Pages
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/user/ProfilePage'
import MentorProfilePage from './pages/mentor/MentorProfilePage'
import MentorListPage from './pages/mentor/MentorListPage'

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

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute'

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
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* User Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Mentor Routes */}
            <Route path="/mentors" element={<MentorListPage />} />
            <Route path="/mentor/profile" element={<MentorProfilePage />} />
            
            {/* Job Routes */}
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/create" element={<JobCreatePage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            
            {/* Course Routes */}
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/create" element={<CourseCreatePage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            
            {/* Wallet Routes */}
            <Route path="/wallet" element={<WalletPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl">404 - Page Not Found</h1></div>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
