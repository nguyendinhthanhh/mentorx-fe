import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import blogApi, { BlogPostCreateRequest } from '../../api/blogApi'
import { fileApi } from '../../api/fileApi'
import { RichTextEditor, PendingImage } from '../../components/ui/RichTextEditor'

const CATEGORIES = [
  { value: 'CAREER_GROWTH', label: 'Career Growth' },
  { value: 'MENTORING', label: 'Mentoring' },
  { value: 'COURSES', label: 'Courses' },
  { value: 'FREELANCE_JOBS', label: 'Freelance & Jobs' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'PLATFORM_SAFETY', label: 'Platform Safety' },
]

const AUDIENCES = [
  { value: 'FOR_LEARNERS', label: 'For Learners' },
  { value: 'FOR_MENTORS', label: 'For Mentors' },
  { value: 'CAREER_GROWTH', label: 'Career Growth' },
  { value: 'FREELANCE_JOBS', label: 'Freelance & Jobs' },
  { value: 'COURSES', label: 'Courses' },
  { value: 'PLATFORM_SAFETY', label: 'Platform Safety' },
]

export default function MentorBlogEditPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [postId, setPostId] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: 'CAREER_GROWTH',
    audience: 'FOR_LEARNERS',
    tags: '',
    content: ''
  })
  
  const [content, setContent] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await blogApi.getPostBySlug(slug as string)
        setPostId(post.id)
        setFormData({
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content,
          category: post.category,
          audience: post.audience,
          tags: (post.tags || []).join(', ')
        })
        if (post.coverImage) {
          setCoverImagePreview(post.coverImage)
        }
      } catch (err) {
        toast.error('Failed to load blog post')
        navigate('/blog')
      } finally {
        setFetching(false)
      }
    }
    if (slug) fetchPost()
  }, [slug])

  if (fetching) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" /></div>

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImageFile(file)
      setCoverImagePreview(URL.createObjectURL(file))
    }
  }

  const handleEditorImageChange = (newHtml: string, pendingImage: PendingImage) => {
    setContent(newHtml)
    setPendingImages(prev => [...prev, pendingImage])
  }

  const uploadReferencedPendingImages = async (html: string, images: PendingImage[]) => {
    if (!html || images.length === 0) return html

    let finalHtml = html
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    const imgElements = Array.from(tempDiv.querySelectorAll('img[data-pending-image-id]'))
    for (const image of imgElements) {
      const pendingImageId = image.getAttribute('data-pending-image-id')
      const pendingImage = images.find((item) => item.id === pendingImageId)
      if (!pendingImage) continue

      try {
        const result = await fileApi.uploadCourseMedia(pendingImage.file, 'mentorx/blogs/images')
        if (result?.fileUrl) {
          finalHtml = finalHtml.replace(pendingImage.previewUrl, result.fileUrl)
        }
      } catch (err) {
        console.error('Failed to upload blog image', err)
      }
    }
    return finalHtml
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.excerpt.trim() || !content.trim()) {
      toast.error('Vui lòng điền tất cả các trường bắt buộc (Tiêu đề, Tóm tắt, Nội dung)')
      return
    }

    setLoading(true)

    try {
      let coverImageUrl = ''
      if (coverImageFile) {
        const result = await fileApi.uploadCourseMedia(coverImageFile, 'mentorx/blogs/covers')
        if (result?.fileUrl) {
          coverImageUrl = result.fileUrl
        }
      }

      const processedContent = await uploadReferencedPendingImages(content, pendingImages)

      const request: BlogPostCreateRequest = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: processedContent,
        category: formData.category,
        audience: formData.audience,
        coverImage: coverImageUrl,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }

      const post = await blogApi.updatePost(postId, request as any)
      toast.success('Cập nhật bài viết thành công!')
      navigate(`/blog/${post.slug}`)

    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to publish blog post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Viết bài mới</h1>
          <p className="text-sm text-slate-500">Chia sẻ kiến thức với cộng đồng</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Cover Image */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Ảnh bìa</span>
            {coverImagePreview ? (
              <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img src={coverImagePreview} alt="Cover preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverImageFile(null); setCoverImagePreview('') }}
                  className="absolute right-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-emerald-500 hover:bg-emerald-50">
                <ImageIcon className="mb-3 h-10 w-10 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Nhấn để tải lên ảnh bìa</span>
                <span className="mt-1 text-xs text-slate-500">Kích thước khuyến nghị: 1200x630px</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="vd: Cách vượt qua buổi mentoring đầu tiên"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-slate-700">Đoạn trích ngắn <span className="text-red-500">*</span></label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              value={formData.excerpt}
              onChange={handleInputChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Tóm tắt ngắn gọn bài viết của bạn..."
            />
          </div>

          {/* Category & Audience */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">Danh mục <span className="text-red-500">*</span></label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audience" className="mb-2 block text-sm font-semibold text-slate-700">Đối tượng mục tiêu <span className="text-red-500">*</span></label>
              <select
                id="audience"
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {AUDIENCES.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="prose-editor-container">
            <RichTextEditor
              label="Nội dung bài viết *"
              value={content}
              onChange={setContent}
              onImageChange={handleEditorImageChange}
              minHeightClass="min-h-[400px]"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="mb-2 block text-sm font-semibold text-slate-700">Thẻ (Tags)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="vd: mentoring, career, tips (ngăn cách bằng dấu phẩy)"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xuất bản...
                </>
              ) : (
                'Xuất bản bài viết'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
