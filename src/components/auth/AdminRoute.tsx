import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { canAccessAdminWorkspace } from '@/utils/roleRedirect'

interface Props {
  children: React.ReactNode
}

export default function AdminRoute({ children }: Props) {
  const { user } = useAuthStore()

  if (!user || !canAccessAdminWorkspace(user)) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
