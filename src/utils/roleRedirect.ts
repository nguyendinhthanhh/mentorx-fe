import { UserResponse } from '@/types'

/**
 * Get the appropriate dashboard path based on user roles
 */
export const getDashboardPath = (user: UserResponse | null): string => {
  if (!user) return '/login'

  const userRoles = (user.roles ?? []).map(r => r.roleName.toUpperCase())

  // Admin has highest priority
  if (userRoles.includes('ADMIN')) {
    return '/admin/dashboard'
  }

  // Mentor dashboard for approved mentors
  if (userRoles.includes('MENTOR') || user.mentorStatus === 'APPROVED') {
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

/**
 * Check if user is mentor
 */
export const isMentor = (user: UserResponse | null): boolean => {
  if (!user) return false
  return hasRole(user, 'MENTOR') || user.mentorStatus === 'APPROVED'
}
