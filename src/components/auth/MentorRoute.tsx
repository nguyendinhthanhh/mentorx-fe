import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { UserMode } from '@/types'
import { canSwitchToMentorMode, isAdmin } from '@/utils/roleRedirect'

interface Props {
  children: React.ReactNode
}

export default function MentorRoute({ children }: Props) {
  const { user, setCurrentMode } = useAuthStore()
  const isAdministrator = !!user && isAdmin(user)
  const mentorAllowed = !!user && canSwitchToMentorMode(user)

  useEffect(() => {
    if (mentorAllowed && user?.currentMode !== UserMode.MENTOR) {
      setCurrentMode(UserMode.MENTOR)
    }
  }, [mentorAllowed, setCurrentMode, user?.currentMode])

  // Admin can access all mentor routes
  if (isAdministrator) {
    return <>{children}</>
  }

  // Check if user is an approved mentor
  if (!mentorAllowed) {
    return <Navigate to="/become-a-mentor" replace />
  }

  return <>{children}</>
}
