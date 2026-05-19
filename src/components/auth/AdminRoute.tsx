import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/utils/roleRedirect'

interface Props {
  children: React.ReactNode
}

export default function AdminRoute({ children }: Props) {
  const { user } = useAuthStore()

  // Check if user has ADMIN role
  if (!user || !isAdmin(user)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
