import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { isAdmin, isMentor } from '@/utils/roleRedirect'

interface Props {
  children: React.ReactNode
}

export default function MentorRoute({ children }: Props) {
  const { user } = useAuthStore()

  // Admin can access all mentor routes
  if (user && isAdmin(user)) {
    return <>{children}</>
  }

  // Check if user is an approved mentor
  if (!user || !isMentor(user)) {
    return <Navigate to="/become-a-mentor" replace />
  }

  return <>{children}</>
}
