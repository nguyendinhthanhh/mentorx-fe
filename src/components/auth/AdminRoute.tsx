import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: React.ReactNode
}

export default function AdminRoute({ children }: Props) {
  const { user } = useAuthStore()

  // Check if user has ADMIN role
  const isAdmin = user?.roles?.some(role => role.roleName.toUpperCase().includes('ADMIN'))

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
