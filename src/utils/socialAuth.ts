import { AuthResponse, MentorStatus } from '@/types'
import { canAccessAdminWorkspace } from '@/utils/roleRedirect'

export function getSocialAuthRedirectPath(response: AuthResponse): string {
  if (response.isNewUser || !response.user.isOnboarded) {
    return '/onboarding'
  }

  if (canAccessAdminWorkspace(response.user)) {
    return '/admin/dashboard'
  }

  if (
    (response.user.roles ?? []).some((role) => role.roleName.toUpperCase() === 'MENTOR')
    || response.user.mentorStatus === MentorStatus.APPROVED
  ) {
    return '/mentor/dashboard'
  }

  return '/profile'
}
