import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { chatApi } from '@/api/chatApi'
import { MessageSquare, Users, Plus, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ChatDemoPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const createDemoChat = async (type: 'mentor' | 'admin' | 'user') => {
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // In a real scenario, you would select a specific user
      // For demo, we'll create a room with placeholder data
      const demoUsers = {
        mentor: { id: 'demo-mentor-id', name: 'Demo Mentor' },
        admin: { id: 'demo-admin-id', name: 'Admin Support' },
        user: { id: 'demo-user-id', name: 'Demo User' }
      }

      const selectedUser = demoUsers[type]

      const room = await chatApi.createRoom({
        participantIds: [user.userId, selectedUser.id],
        name: `Chat với ${selectedUser.name}`,
        type: 'DIRECT_MESSAGE'
      })

      setSuccess(`Đã tạo chat room với ${selectedUser.name}!`)
      
      // Navigate to chat page after 1 second
      setTimeout(() => {
        navigate('/chat')
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo chat room. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để sử dụng tính năng chat</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 mb-6 shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tính Năng Chat - MentorX
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kết nối và trò chuyện với mentor, admin hoặc người dùng khác một cách dễ dàng
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Chat with Mentor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chat với Mentor</h3>
            <p className="text-sm text-gray-600 mb-4">
              Trao đổi trực tiếp với mentor để được tư vấn và hướng dẫn
            </p>
            <button
              onClick={() => createDemoChat('mentor')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tạo Chat
            </button>
          </div>

          {/* Chat with Admin */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chat với Admin</h3>
            <p className="text-sm text-gray-600 mb-4">
              Liên hệ với admin để được hỗ trợ và giải đáp thắc mắc
            </p>
            <button
              onClick={() => createDemoChat('admin')}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tạo Chat
            </button>
          </div>

          {/* Chat with User */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chat với User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Kết nối với người dùng khác để trao đổi và học hỏi
            </p>
            <button
              onClick={() => createDemoChat('user')}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tạo Chat
            </button>
          </div>
        </div>

        {/* Go to Chat Page */}
        <div className="text-center">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 shadow-lg shadow-primary-200 font-semibold"
          >
            <MessageSquare className="w-5 h-5" />
            Đi đến Trang Chat
          </button>
        </div>

        {/* Features List */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tính Năng Chính</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Nhắn tin real-time',
              'Gửi file và hình ảnh',
              'Đánh dấu đã đọc',
              'Tìm kiếm chat',
              'Thông báo tin nhắn mới',
              'Chat 1-1 và nhóm',
              'Typing indicators',
              'Online status'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Lưu ý</h3>
          <p className="text-sm text-blue-800">
            Đây là trang demo để test tính năng chat. Trong môi trường thực tế, bạn sẽ chọn người dùng cụ thể từ danh sách mentor hoặc người dùng để bắt đầu chat.
          </p>
        </div>
      </div>
    </div>
  )
}
