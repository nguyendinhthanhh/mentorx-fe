import { MentorStatus, UserMode, UserResponse, VerificationStatus } from '@/types'

/**
 * Get the appropriate dashboard path based on user roles
 */
export const getDashboardPath = (user: UserResponse | null): string => {
  if (!user) return '/login'

  if (canAccessAdminWorkspace(user)) {
    return '/admin/dashboard'
  }

  // Mentor dashboard only when the user is both approved and currently in mentor mode.
  if (isMentorApproved(user) && user.currentMode === UserMode.MENTOR) {
    return '/mentor/dashboard'
  }

  // Regular users land on their profile workspace, not a dashboard.
  return '/profile'
}

/**
 * Check if user has a specific role
 */
export const hasRole = (user: UserResponse | null, role: string): boolean => {
  if (!user) return false
  return (user.roles ?? []).some(r => r.roleName.toUpperCase() === role.toUpperCase())
}

/**
 * Check if user is admin
 */
export const isAdmin = (user: UserResponse | null): boolean => {
  return hasRole(user, 'ADMIN')
}

export const isModerator = (user: UserResponse | null): boolean => {
  return hasRole(user, 'MODERATOR')
}

export const canAccessAdminWorkspace = (user: UserResponse | null): boolean => {
  return isAdmin(user) || isModerator(user)
}

export const canModerateMentorApplications = (user: UserResponse | null): boolean => {
  return canAccessAdminWorkspace(user)
}

export const canApproveWithdrawals = (user: UserResponse | null): boolean => {
  return isAdmin(user)
}

/**
 * Check if user is mentor
 */
export const isMentor = (user: UserResponse | null): boolean => {
  return isMentorApproved(user)
}

export const isMentorApproved = (user: UserResponse | null): boolean => {
  if (!user) return false
  return hasRole(user, 'MENTOR') && user.mentorStatus === MentorStatus.APPROVED
}

export const canSwitchToMentorMode = (user: UserResponse | null): boolean => {
  if (!user) return false
  if (user.availableModes?.includes(UserMode.MENTOR)) return true
  return isMentorApproved(user)
}

export const getAvailableModes = (user: UserResponse | null): UserMode[] => {
  if (!user) return [UserMode.USER]
  if (Array.isArray(user.availableModes) && user.availableModes.length > 0) {
    return user.availableModes.includes(UserMode.USER)
      ? user.availableModes
      : [UserMode.USER, ...user.availableModes]
  }
  return canSwitchToMentorMode(user) ? [UserMode.USER, UserMode.MENTOR] : [UserMode.USER]
}

export const requireMentorMode = (user: UserResponse | null): boolean => {
  return canSwitchToMentorMode(user)
}

export const isVerificationNotSubmitted = (status?: VerificationStatus | MentorStatus | null): boolean => {
  return status === undefined
    || status === null
    || status === VerificationStatus.NOT_SUBMITTED
    || status === MentorStatus.NONE
    || status === MentorStatus.NOT_APPLIED
}
