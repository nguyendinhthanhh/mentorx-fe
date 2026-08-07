import { chatApi } from '@/api/chatApi'
import { ChatRoomResponse } from '@/types'

type EnsureDirectJobChatParams = {
  currentUserId: string
  peerUserId: string
  jobId: string
}

export async function ensureDirectJobChat({
  currentUserId,
  peerUserId,
  jobId,
}: EnsureDirectJobChatParams): Promise<ChatRoomResponse> {
  if (currentUserId === peerUserId) {
    throw new Error('Bạn không thể mở phòng chat với chính mình.')
  }

  // Use resolveConversation — backend finds existing room by (JOB, jobId, both users)
  // or creates one with proper referenceType/referenceId. Idempotent.
  const room = await chatApi.resolveConversation({
    recipientId: peerUserId,
    contextType: 'JOB',
    contextId: jobId,
  })

  localStorage.setItem(`chat_job_${room.id}`, jobId)
  return room
}

export function getJobChatRoute(jobId: string, peerUserId: string) {
  return `/chat?userId=${encodeURIComponent(peerUserId)}&jobId=${encodeURIComponent(jobId)}`
}
