import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { Upload, Video, X, Play, Loader2, CheckCircle2 } from 'lucide-react'
import { fileApi } from '@/api/fileApi'
import { mentorApi } from '@/api/mentorApi'

interface Props {
  userId: string
  currentVideoUrl?: string
}

export default function MentorVideoIntro({ userId, currentVideoUrl }: Props) {
  const queryClient = useQueryClient()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(currentVideoUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const updateVideoMutation = useMutation(
    (videoUrl: string) => mentorApi.updateMentorProfile(userId, { videoIntroUrl: videoUrl }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentorProfile', userId])
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Không thể cập nhật video')
      }
    }
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Vui lòng chọn file video (MP4, MOV, AVI...)')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video không được vượt quá 100MB')
      return
    }

    setError('')
    setVideoFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setVideoPreview(previewUrl)
  }

  const handleUpload = async () => {
    if (!videoFile) return

    setUploading(true)
    setError('')

    try {
      // Upload video file
      const uploadResponse = await fileApi.upload(videoFile)
      
      // Update mentor profile with video URL
      await updateVideoMutation.mutateAsync(uploadResponse.fileUrl)
      
      setVideoFile(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload video. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setVideoFile(null)
    if (videoPreview && videoPreview !== currentVideoUrl) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoPreview(currentVideoUrl || null)
    setError('')
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-primary-600" />
          Video Giới Thiệu
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Upload video giới thiệu bản thân (30-90 giây) để học viên hiểu rõ hơn về bạn
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Video đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <X className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Video Preview or Upload Area */}
      <div className="space-y-4">
        {videoPreview ? (
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
            <video
              src={videoPreview}
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
            
            {videoFile && (
              <button
                onClick={handleRemove}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <div className="p-4 bg-primary-100 rounded-full">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  Click để upload video
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  MP4, MOV, AVI (tối đa 100MB)
                </p>
              </div>
            </div>
          </label>
        )}

        {/* Upload Button */}
        {videoFile && (
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Video
                </>
              )}
            </button>
            
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-black text-blue-900 mb-3">💡 Tips cho video tốt</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Thời lượng 30-90 giây, ngắn gọn và súc tích</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Giới thiệu bản thân, kinh nghiệm và điểm mạnh</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Quay ở nơi có ánh sáng tốt, âm thanh rõ ràng</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Mặc trang phục chuyên nghiệp, tự tin và thân thiện</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Nói về những gì bạn có thể giúp học viên đạt được</span>
          </li>
        </ul>
      </div>

      {/* Example Script */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="font-black text-gray-900 mb-3">📝 Mẫu script tham khảo</h3>
        <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
          <p className="italic">
            "Xin chào, mình là [Tên], hiện đang làm [Vị trí] tại [Công ty]. 
            Mình có [X] năm kinh nghiệm trong lĩnh vực [Lĩnh vực].
          </p>
          <p className="italic">
            Mình chuyên giúp các bạn [Mục tiêu cụ thể], từ [Kỹ năng 1] đến [Kỹ năng 2].
            Mình đã hỗ trợ hơn [X] học viên đạt được [Kết quả].
          </p>
          <p className="italic">
            Nếu bạn đang muốn [Mục tiêu], hãy đặt lịch với mình nhé. 
            Mình rất mong được đồng hành cùng bạn!"
          </p>
        </div>
      </div>
    </div>
  )
}
