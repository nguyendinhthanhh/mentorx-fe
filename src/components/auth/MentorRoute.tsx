import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { MentorStatus } from '@/types'

interface Props {
  children: React.ReactNode
}

export default function MentorRoute({ children }: Props) {
  const { user } = useAuthStore()

  // Check if user is an approved mentor
  const isMentor = user?.mentorStatus === MentorStatus.APPROVED

  if (!user || !isMentor) {
    return <Navigate to="/mentor/profile" replace />
  }

  return <>{children}</>
}
