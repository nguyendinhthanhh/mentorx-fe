import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/utils/roleRedirect'

interface Props {
  children: React.ReactNode
}

export default function AdminOnlyRoute({ children }: Props) {
  const { user } = useAuthStore()

  if (!user || !isAdmin(user) || (user.status && !['ACTIVE', 'PENDING'].includes(user.status))) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}

