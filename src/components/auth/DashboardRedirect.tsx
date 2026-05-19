import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getDashboardPath } from '@/utils/roleRedirect'

/**
 * Component to redirect authenticated users to their appropriate dashboard
 * and unauthenticated users to landing page
 */
export default function DashboardRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    // Show landing page for unauthenticated users
    return null // Will be handled by LandingPage route
  }

  // Redirect to appropriate dashboard based on role
  const dashboardPath = getDashboardPath(user)
  return <Navigate to={dashboardPath} replace />
}
