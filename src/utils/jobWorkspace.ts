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
  const rooms: ChatRoomResponse[] = []
  let page = 0
  let hasMore = true

  while (hasMore && page < 10) {
    const result = await chatApi.getUserRooms(currentUserId, { page, size: 100 })
    rooms.push(...result.content)
    hasMore = !result.last
    page += 1
  }

  const existingDirectRoom = rooms.find(
    (room) =>
      room.roomType === 'DIRECT_MESSAGE' &&
      room.members.some((member) => member.userId === peerUserId)
  )

  if (existingDirectRoom) {
    localStorage.setItem(`chat_job_${existingDirectRoom.id}`, jobId)
    return existingDirectRoom
  }

  const createdRoom = await chatApi.createRoom({
    roomType: 'DIRECT_MESSAGE',
    memberIds: [currentUserId, peerUserId],
    createdByUserId: currentUserId,
  })

  localStorage.setItem(`chat_job_${createdRoom.id}`, jobId)
  return createdRoom
}

export function getJobChatRoute(jobId: string, peerUserId: string) {
  return `/chat?userId=${encodeURIComponent(peerUserId)}&jobId=${encodeURIComponent(jobId)}`
}
