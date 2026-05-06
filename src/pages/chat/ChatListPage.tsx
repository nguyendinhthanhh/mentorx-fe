import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { formatRelativeTime } from '@/utils/formatters'
import { Search, MessageSquare, User, MoreVertical, Send, Paperclip } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { ChatRoomResponse, MessageResponse, MessageType } from '@/types'

export default function ChatListPage() {
  const { user } = useAuthStore()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useQuery(
    ['chatRooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId),
    { enabled: !!user?.userId }
  )

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['messages', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!),
    { enabled: !!selectedRoomId, refetchInterval: 5000 } // Poll every 5s
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedRoomId || !user) return

    try {
      await chatApi.sendMessage({
        chatRoomId: selectedRoomId,
        senderId: user.userId,
        content: messageInput,
        messageType: MessageType.TEXT,
      })
      setMessageInput('')
      refetchMessages()
      refetchRooms()
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  const selectedRoom = rooms?.content.find(r => r.id === selectedRoomId)

  if (!user) return null

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="p-4 animate-pulse flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : rooms?.content.length ? (
            rooms.content.map((room) => {
              const otherMember = room.members.find(m => m.userId !== user.userId)
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-50/50 ${
                    selectedRoomId === room.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {otherMember?.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm truncate ${selectedRoomId === room.id ? 'font-bold text-primary-900' : 'font-semibold text-gray-900'}`}>
                        {otherMember?.fullName || room.name || 'Chat'}
                      </h4>
                      {room.lastMessage && (
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(room.lastMessage.sentAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {room.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No active chats</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {selectedRoomId ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 bg-white border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                  {selectedRoom?.members.find(m => m.userId !== user.userId)?.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {selectedRoom?.members.find(m => m.userId !== user.userId)?.fullName || 'Chat'}
                  </h3>
                  <p className="text-[10px] text-green-500 font-medium">Online</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : messages?.content.length ? (
                messages.content.map((msg: MessageResponse) => {
                  const isMine = msg.senderId === user.userId
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMine 
                          ? 'bg-primary-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-10" />
                  <p className="text-sm">Start a conversation</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-50">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border-none rounded-2xl px-4 text-sm focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-sm shadow-primary-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-10 h-10 text-primary-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your Messages</h3>
            <p className="text-sm max-w-xs text-center mt-1">Select a chat from the sidebar to start messaging your mentors or clients.</p>
          </div>
        )}
      </div>
    </div>
  )
}
