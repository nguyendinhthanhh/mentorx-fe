import { useQuery } from 'react-query'
import { chatApi } from '@/api/chatApi'
import { fileApi, FILE_UPLOAD_DIRS } from '@/api/fileApi'
import { MessageType } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { 
  MessageSquare, 
  Search, 
  Clock, 
  User, 
  ChevronRight,
  Filter,
  MoreVertical,
  Activity,
  ArrowLeft
} from 'lucide-react'
import { useState, useRef } from 'react'
import { formatDateTime } from '@/utils/formatters'
import ConversationPane from '@/pages/chat/components/ConversationPane'
import { getPrimaryOtherMember } from '@/pages/chat/chatShared'

export default function AdminSupportPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [composerError, setComposerError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery(
    ['admin-support-rooms', user?.userId],
    () => chatApi.getUserRooms(user!.userId, { page: 0, size: 50 }),
    { enabled: !!user }
  )

  const filteredRooms = data?.content.filter(room => 
    room.roomName?.toLowerCase().includes(search.toLowerCase()) ||
    room.lastMessagePreview?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedRoom = data?.content.find(r => r.id === selectedRoomId) || null
  const otherMember = selectedRoom ? getPrimaryOtherMember(selectedRoom, user?.userId) : undefined

  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['admin-support-messages', selectedRoomId],
    () => chatApi.getRoomMessages(selectedRoomId!, { size: 100 }),
    { enabled: !!selectedRoomId, refetchInterval: selectedRoomId ? 5000 : false }
  )
  const selectedMessages = messagesData?.content || []

  const handleSendMessage = async (message: string, files: File[] = []) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && files.length === 0) || !selectedRoomId || !user?.userId || isSending) return

    setComposerError(null)
    setIsSending(true)

    try {
      if (files.length === 0) {
        await chatApi.sendMessage({
          chatRoomId: selectedRoomId,
          senderId: user.userId,
          content: trimmedMessage,
          messageType: MessageType.TEXT,
        })
      } else {
        for (const [index, file] of files.entries()) {
          const uploadedFile = await fileApi.upload(file, { subDirectory: FILE_UPLOAD_DIRS.PUBLIC_CHAT })
          const isImage = file.type.startsWith('image/')
          await chatApi.sendMessage({
            chatRoomId: selectedRoomId,
            senderId: user.userId,
            content: index === 0 ? trimmedMessage : '',
            messageType: isImage ? MessageType.IMAGE : MessageType.FILE,
            attachmentUrl: uploadedFile.fileUrl,
            attachmentFilename: file.name,
            attachmentMimeType: file.type || uploadedFile.fileType,
            attachmentSize: file.size,
            metadata: {
              uploadedFileName: uploadedFile.fileName,
              originalFileName: file.name,
            },
          })
        }
      }
      setMessageInput('')
      refetchMessages()
    } catch (error: any) {
      setComposerError(error?.response?.data?.message || 'Unable to send message.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Support Center</h1>
          <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500">Manage incoming help requests and community messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-200/60 shadow-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             System Online
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Conversations</p>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">{data?.totalElements || 0}</h3>
         </div>
         <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unread Messages</p>
            <h3 className="text-4xl font-extrabold text-amber-500">12</h3>
         </div>
         <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg. Response Time</p>
            <h3 className="text-4xl font-extrabold text-indigo-500">~14m</h3>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[700px] flex-col md:flex-row overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none transition-all">
        {/* Conversations List (Left Pane) */}
        <div className={`flex flex-col border-r border-slate-100/50 dark:border-slate-800/50 transition-all ${selectedRoomId ? 'hidden md:flex md:w-[360px]' : 'w-full md:w-[360px]'}`}>
          {/* Search & Filter */}
          <div className="flex flex-col gap-4 border-b border-slate-100/50 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-800/30 sm:flex-row sm:items-center">
             <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm font-bold shadow-sm hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-700/60"
              />
           </div>
           <button className="self-end rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-3.5 text-slate-400 transition-all hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 sm:self-auto">
              <Filter className="w-5 h-5" />
           </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
           {isLoading ? (
             <div className="p-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Secure Channels...</p>
             </div>
           ) : filteredRooms?.length === 0 ? (
             <div className="p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-slate-100/50 dark:border-slate-800/50">
                   <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Active Tickets</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2">All incoming messages have been cleared. Great job!</p>
                </div>
             </div>
           ) : (
             <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {filteredRooms?.map((room) => (
                  <div 
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`group cursor-pointer p-6 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80 sm:flex sm:items-center sm:justify-between ${selectedRoomId === room.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  >
                     <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                        <div className="relative">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl border border-indigo-200/60 dark:border-indigo-800/30 shadow-sm group-hover:scale-105 transition-transform">
                              {room.roomName?.charAt(0).toUpperCase() || 'S'}
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-emerald-500 border-[3px] border-white dark:border-slate-900" />
                        </div>
                        <div className="min-w-0">
                           <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <h4 className="break-words text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{room.roomName || 'Support Session'}</h4>
                              <span className="px-3 py-1 rounded-lg bg-white/50 border border-slate-200/60 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest shadow-sm">{room.roomType}</span>
                           </div>
                           <p className="mt-1.5 max-w-md break-words text-xs font-medium text-slate-500 dark:text-slate-400 sm:truncate">
                              {room.lastMessagePreview || 'No messages yet...'}
                           </p>
                           <div className="flex items-center gap-3 mt-2.5">
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5" /> {room.lastMessageAt ? formatDateTime(room.lastMessageAt) : 'Recent'}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="mt-4 flex items-center gap-4 self-end sm:mt-0 sm:self-auto">
                        <button className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:shadow-md group-hover:-translate-x-1">
                           <ChevronRight className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

        {/* Conversation Pane (Right Pane) */}
        <div className={`flex flex-1 flex-col ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
          {selectedRoomId ? (
            <ConversationPane
              selectedRoom={selectedRoom}
              selectedMessages={selectedMessages}
              currentUserId={user?.userId || ''}
              otherMember={otherMember}
              messagesLoading={messagesLoading}
              scrollRef={scrollRef}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              queuedAttachments={[]}
              onAttachmentSelect={() => {}}
              onRemoveAttachment={() => {}}
              onSendMessage={handleSendMessage}
              fileInputRef={fileInputRef}
              onOpenFilePicker={() => {}}
              isSending={isSending}
              composerError={composerError}
              onShowDetails={() => {}}
              onBackToList={() => setSelectedRoomId(null)}
              showBackButton={true}
              heightClassName="h-full"
              noMessagesTitle="No messages yet"
              noMessagesDescription="Start a conversation with the user to resolve their support request."
              showDetailsButton={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Select a conversation</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a ticket from the left panel to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
