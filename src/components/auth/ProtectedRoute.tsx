import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, skippedOnboardingThisSession } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.status === 'PENDING') {
    return <Navigate to="/verify-email" replace />
  }

  // Force onboarding if not completed
  const isOnboardingPage = window.location.pathname === '/onboarding'
  if (user && !user.isOnboarded && !skippedOnboardingThisSession && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
