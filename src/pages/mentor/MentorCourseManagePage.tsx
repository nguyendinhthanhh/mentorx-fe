import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { fileApi } from '@/api/fileApi'
import { CourseStatus, LessonType } from '@/types'
import {
  ArrowLeft,
  Bold,
  FileText,
  HelpCircle,
  Image,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'

const editorInputClass = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'

type DraftLesson = {
  clientId: string
  id?: string
  title: string
  description: string
  lessonType: LessonType
  durationMinutes: string
  videoUrl: string
  articleContent: string
  resourceUrl: string
  isFreePreview: boolean
  isMandatory: boolean
  isPublished: boolean
}

type DraftSection = {
  clientId: string
  id?: string
  title: string
  description: string
  isPublished: boolean
  lessons: DraftLesson[]
}

type Selection =
  | { type: 'section'; sectionClientId: string }
  | { type: 'lesson'; sectionClientId: string; lessonClientId: string }

const newId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`

const createSection = (index: number): DraftSection => ({
  clientId: newId(),
  title: `Section ${index + 1}`,
  description: '',
  isPublished: true,
  lessons: [],
})

const createLesson = (type: LessonType, index: number): DraftLesson => ({
  clientId: newId(),
  title: type === LessonType.QUIZ ? `Quiz ${index + 1}` : `Lesson ${index + 1}`,
  description: '',
  lessonType: type === LessonType.VIDEO ? LessonType.ARTICLE : type,
  durationMinutes: '',
  videoUrl: '',
  articleContent: '',
  resourceUrl: '',
  isFreePreview: false,
  isMandatory: true,
  isPublished: true,
})

export default function MentorCourseManagePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<DraftSection[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [uploadingField, setUploadingField] = useState<'videoUrl' | 'resourceUrl' | null>(null)

  const { data: course } = useQuery(['course', courseId], () => courseApi.getById(courseId!), { enabled: !!courseId })
  const { data: savedSections = [], isLoading: sectionsLoading } = useQuery(
    ['course-sections-edit', courseId],
    () => courseApi.getSections(courseId!),
    { enabled: !!courseId }
  )
  const { data: savedLessons = [], isLoading: lessonsLoading } = useQuery(
    ['course-lessons', courseId],
    () => courseApi.getLessonsByCourse(courseId!),
    { enabled: !!courseId }
  )

  useEffect(() => {
    if (sectionsLoading || lessonsLoading) return
    const hydrated = savedSections.map((section) => ({
      clientId: section.id,
      id: section.id,
      title: section.title,
      description: section.description || '',
      isPublished: section.isPublished !== false,
      lessons: savedLessons
        .filter((lesson) => lesson.sectionId === section.id)
        .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
        .map((lesson) => ({
          clientId: lesson.id,
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          lessonType: lesson.lessonType || LessonType.VIDEO,
          durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : '',
          videoUrl: lesson.videoUrl || '',
          articleContent: lesson.articleContent || '',
          resourceUrl: lesson.resourceUrl || '',
          isFreePreview: lesson.isFreePreview === true,
          isMandatory: lesson.isMandatory !== false,
          isPublished: lesson.isPublished !== false,
        })),
    }))
    setSections(hydrated)
    setSelection(hydrated[0] ? { type: 'section', sectionClientId: hydrated[0].clientId } : null)
    setDirty(false)
  }, [savedSections, savedLessons, sectionsLoading, lessonsLoading])

  const selectedSection = useMemo(
    () => sections.find((section) => section.clientId === selection?.sectionClientId),
    [sections, selection]
  )
  const selectedLesson = useMemo(() => {
    if (!selection || selection.type !== 'lesson') return null
    return selectedSection?.lessons.find((lesson) => lesson.clientId === selection.lessonClientId) || null
  }, [selectedSection, selection])

  const saveMutation = useMutation(
    () => {
      const validation = validateCurriculum(sections)
      if (validation) throw new Error(validation)
      return courseApi.saveCurriculum(courseId!, {
        sections: sections.map((section, sectionIndex) => ({
          id: section.id,
          title: section.title.trim(),
          description: section.description || undefined,
          sectionOrder: sectionIndex + 1,
          isPublished: section.isPublished,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: lesson.id,
            title: lesson.title.trim(),
            description: lesson.description || undefined,
            lessonType: lesson.lessonType,
            lessonOrder: lessonIndex + 1,
            durationMinutes: lesson.durationMinutes ? Number(lesson.durationMinutes) : undefined,
            videoUrl: lesson.videoUrl || undefined,
            articleContent: lesson.articleContent || undefined,
            resourceUrl: lesson.resourceUrl || undefined,
            isFreePreview: lesson.isFreePreview,
            isPublished: lesson.isPublished,
            isMandatory: lesson.isMandatory,
          })),
        })),
      })
    },
    {
      onSuccess: () => {
        setDirty(false)
        setError('')
        queryClient.invalidateQueries(['course-sections-edit', courseId])
        queryClient.invalidateQueries(['course-lessons', courseId])
      },
      onError: (err: any) => setError(err.message || err.response?.data?.message || 'Failed to save curriculum.'),
    }
  )

  const submitReviewMutation = useMutation(() => courseApi.submitForReview(courseId!), {
    onSuccess: () => queryClient.invalidateQueries(['course', courseId]),
  })

  const markDirty = (next: DraftSection[]) => {
    setSections(next)
    setDirty(true)
    setError('')
  }

  const addSection = () => {
    const section = createSection(sections.length)
    markDirty([...sections, section])
    setSelection({ type: 'section', sectionClientId: section.clientId })
  }

  const removeSection = (sectionClientId: string) => {
    const next = sections.filter((section) => section.clientId !== sectionClientId)
    markDirty(next)
    setSelection(next[0] ? { type: 'section', sectionClientId: next[0].clientId } : null)
  }

  const addLesson = (sectionClientId: string, type: LessonType) => {
    const targetSection = sections.find((section) => section.clientId === sectionClientId)
    if (!targetSection) return
    const newLesson = createLesson(type, targetSection.lessons.length)
    const next = sections.map((section) => {
      if (section.clientId !== sectionClientId) return section
      return { ...section, lessons: [...section.lessons, newLesson] }
    })
    markDirty(next)
    setSelection({ type: 'lesson', sectionClientId, lessonClientId: newLesson.clientId })
  }

  const removeLesson = (sectionClientId: string, lessonClientId: string) => {
    const next = sections.map((section) =>
      section.clientId === sectionClientId
        ? { ...section, lessons: section.lessons.filter((lesson) => lesson.clientId !== lessonClientId) }
        : section
    )
    markDirty(next)
    setSelection({ type: 'section', sectionClientId })
  }

  const updateSection = (sectionClientId: string, patch: Partial<DraftSection>) => {
    markDirty(sections.map((section) => (section.clientId === sectionClientId ? { ...section, ...patch } : section)))
  }

  const updateLesson = (sectionClientId: string, lessonClientId: string, patch: Partial<DraftLesson>) => {
    markDirty(
      sections.map((section) =>
        section.clientId === sectionClientId
          ? {
              ...section,
              lessons: section.lessons.map((lesson) => (lesson.clientId === lessonClientId ? { ...lesson, ...patch } : lesson)),
            }
          : section
      )
    )
  }

  const uploadLessonAsset = async (field: 'videoUrl' | 'resourceUrl', file: File) => {
    if (!selectedLesson || !selection || selection.type !== 'lesson') return
    const validation = validateAsset(file, field)
    if (validation) {
      setError(validation)
      return
    }
    try {
      setUploadingField(field)
      const result = await fileApi.uploadCourseMedia(file, field === 'videoUrl' ? 'mentorx/courses/lessons/videos' : 'mentorx/courses/lessons/files')
      updateLesson(selection.sectionClientId, selection.lessonClientId, { [field]: result.fileUrl })
    } finally {
      setUploadingField(null)
    }
  }

  const uploadLessonContentImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Lesson content images must be image files.')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Lesson content images must be 10 MB or smaller.')
    }
    const result = await fileApi.uploadCourseMedia(file, 'mentorx/courses/lessons/images')
    return result.fileUrl
  }

  const canSubmitForReview = !dirty && sections.length > 0 && sections.some((section) => section.lessons.length > 0)
    && (course?.status === CourseStatus.DRAFT || course?.status === CourseStatus.REJECTED)

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-4">
      <Link to="/mentor/my-courses" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to my courses
      </Link>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{course?.status || 'DRAFT'}</p>
          <h1 className="text-2xl font-black text-slate-900">{course?.title || 'Course editor'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {dirty && <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Unsaved changes</span>}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {saveMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <button
            disabled={!canSubmitForReview || submitReviewMutation.isLoading}
            onClick={() => submitReviewMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {submitReviewMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Review
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}

      <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Sections</h2>
            <button onClick={addSection} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600" title="Add section">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 p-3">
            {sections.map((section, sectionIndex) => (
              <div key={section.clientId} className="rounded-xl border border-slate-200 bg-white">
                <div
                  className={`flex items-center gap-1 px-2 py-2 ${
                    selection?.type === 'section' && selection.sectionClientId === section.clientId ? 'text-indigo-700' : 'text-slate-800'
                  }`}
                >
                  <button
                    onClick={() => setSelection({ type: 'section', sectionClientId: section.clientId })}
                    className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                  >
                    <span className="block truncate text-sm font-black">{sectionIndex + 1}. {section.title || 'Untitled section'}</span>
                  </button>
                  <button
                    onClick={() => removeSection(section.clientId)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete section"
                    aria-label={`Delete ${section.title || 'section'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1 border-t border-slate-100 p-2">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.clientId}
                      className={`flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-semibold ${
                        selection?.type === 'lesson' && selection.lessonClientId === lesson.clientId
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelection({ type: 'lesson', sectionClientId: section.clientId, lessonClientId: lesson.clientId })}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
                      >
                        {lesson.lessonType === LessonType.QUIZ ? <HelpCircle className="h-4 w-4 shrink-0" /> : lesson.lessonType === LessonType.VIDEO ? <Video className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{sectionIndex + 1}.{lessonIndex + 1} {lesson.title || 'Untitled'}</span>
                      </button>
                      <button
                        onClick={() => removeLesson(section.clientId, lesson.clientId)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title={lesson.lessonType === LessonType.QUIZ ? 'Delete quiz' : 'Delete lesson'}
                        aria-label={`Delete ${lesson.title || (lesson.lessonType === LessonType.QUIZ ? 'quiz' : 'lesson')}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button onClick={() => addLesson(section.clientId, LessonType.VIDEO)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      + Lesson
                    </button>
                    <button onClick={() => addLesson(section.clientId, LessonType.QUIZ)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      + Quiz
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sections.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500">Use the plus button to add your first section.</p>}
          </div>
        </aside>

        <main className="p-6">
          {!selection && <EmptyEditor onAddSection={addSection} />}
          {selection?.type === 'section' && selectedSection && (
            <SectionEditor
              section={selectedSection}
              onChange={(patch) => updateSection(selectedSection.clientId, patch)}
              onDelete={() => removeSection(selectedSection.clientId)}
            />
          )}
          {selection?.type === 'lesson' && selectedSection && selectedLesson && (
            <LessonEditor
              lesson={selectedLesson}
              uploadingField={uploadingField}
              onChange={(patch) => updateLesson(selectedSection.clientId, selectedLesson.clientId, patch)}
              onDelete={() => removeLesson(selectedSection.clientId, selectedLesson.clientId)}
              onUpload={uploadLessonAsset}
              onImageUpload={uploadLessonContentImage}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyEditor({ onAddSection }: { onAddSection: () => void }) {
  return (
    <div className="flex h-full min-h-[560px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Plus className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-black text-slate-900">Start your curriculum</h2>
      <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">Add sections on the left, then add lessons or quizzes inside each section.</p>
      <button onClick={onAddSection} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Add Section</button>
    </div>
  )
}

function SectionEditor({ section, onChange, onDelete }: {
  section: DraftSection
  onChange: (patch: Partial<DraftSection>) => void
  onDelete: () => void
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <EditorHeader title="Section Settings" onDelete={onDelete} />
      <Field label="Section title">
        <input value={section.title} onChange={(event) => onChange({ title: event.target.value })} className={editorInputClass} />
      </Field>
      <Field label="Description">
        <textarea value={section.description} onChange={(event) => onChange({ description: event.target.value })} className={`${editorInputClass} min-h-32`} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={section.isPublished} onChange={(event) => onChange({ isPublished: event.target.checked })} />
        Visible when course is published
      </label>
    </div>
  )
}

function LessonEditor({ lesson, uploadingField, onChange, onDelete, onUpload, onImageUpload }: {
  lesson: DraftLesson
  uploadingField: 'videoUrl' | 'resourceUrl' | null
  onChange: (patch: Partial<DraftLesson>) => void
  onDelete: () => void
  onUpload: (field: 'videoUrl' | 'resourceUrl', file: File) => void
  onImageUpload: (file: File) => Promise<string>
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <EditorHeader title={lesson.lessonType === LessonType.QUIZ ? 'Quiz Settings' : 'Lesson Settings'} onDelete={onDelete} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input value={lesson.title} onChange={(event) => onChange({ title: event.target.value })} className={editorInputClass} />
        </Field>
        <Field label="Type">
          <select value={lesson.lessonType} onChange={(event) => onChange({ lessonType: event.target.value as LessonType })} className={editorInputClass}>
            <option value={LessonType.ARTICLE}>Lesson</option>
            <option value={LessonType.VIDEO}>Video lesson</option>
            <option value={LessonType.DOWNLOADABLE}>Downloadable</option>
            <option value={LessonType.QUIZ}>Quiz</option>
          </select>
        </Field>
      </div>
      <Field label="Summary">
        <textarea value={lesson.description} onChange={(event) => onChange({ description: event.target.value })} className={`${editorInputClass} min-h-24`} />
      </Field>
      <Field label="Duration minutes">
        <input type="number" min="0" step="1" value={lesson.durationMinutes} onChange={(event) => onChange({ durationMinutes: event.target.value })} className={`${editorInputClass} max-w-xs`} />
      </Field>

      {(lesson.lessonType === LessonType.ARTICLE || lesson.lessonType === LessonType.VIDEO) && (
        <UploadField
          label="Optional video"
          value={lesson.videoUrl}
          uploading={uploadingField === 'videoUrl'}
          accept="video/*"
          onChange={(value) => onChange({ videoUrl: value })}
          onUpload={(file) => onUpload('videoUrl', file)}
        />
      )}
      {lesson.lessonType === LessonType.DOWNLOADABLE && (
        <UploadField
          label="Downloadable file"
          value={lesson.resourceUrl}
          uploading={uploadingField === 'resourceUrl'}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          onChange={(value) => onChange({ resourceUrl: value })}
          onUpload={(file) => onUpload('resourceUrl', file)}
        />
      )}
      {(lesson.lessonType === LessonType.ARTICLE || lesson.lessonType === LessonType.VIDEO || lesson.lessonType === LessonType.DOWNLOADABLE) && (
        <RichTextEditor
          label="Lesson content"
          value={lesson.articleContent}
          onChange={(articleContent) => onChange({ articleContent })}
          onImageUpload={onImageUpload}
        />
      )}
      {lesson.lessonType === LessonType.QUIZ && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Quiz question editing will live here. This save flow already persists the quiz lesson shell.
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isFreePreview} onChange={(event) => onChange({ isFreePreview: event.target.checked })} />
          Free preview
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isMandatory} onChange={(event) => onChange({ isMandatory: event.target.checked })} />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={lesson.isPublished} onChange={(event) => onChange({ isPublished: event.target.checked })} />
          Visible
        </label>
      </div>
    </div>
  )
}

function EditorHeader({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function UploadField({ label, value, uploading, accept, onChange, onUpload }: {
  label: string
  value: string
  uploading: boolean
  accept: string
  onChange: (value: string) => void
  onUpload: (file: File) => void
}) {
  return (
    <Field label={label}>
      <div className="rounded-xl border border-slate-200 p-3">
        <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onUpload(file)
              event.currentTarget.value = ''
            }}
          />
        </label>
        <input value={value} onChange={(event) => onChange(event.target.value)} className={editorInputClass} placeholder="Uploaded or external URL" />
      </div>
    </Field>
  )
}

function RichTextEditor({ label, value, onChange, onImageUpload }: {
  label: string
  value: string
  onChange: (value: string) => void
  onImageUpload: (file: File) => Promise<string>
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const runCommand = (command: string) => {
    document.execCommand(command)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const insertImage = async (file: File) => {
    try {
      setUploadingImage(true)
      const imageUrl = await onImageUpload(file)
      document.execCommand('insertHTML', false, `<img src="${imageUrl}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;" />`)
      editorRef.current?.focus()
      onChange(editorRef.current?.innerHTML || '')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton title="Bold" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Bulleted list" onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
          <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-600" title="Upload image">
            {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) insertImage(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
        </div>
        <div
          ref={(node) => { editorRef.current = node }}
          contentEditable
          className="min-h-64 px-4 py-3 text-sm leading-6 text-slate-900 outline-none [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}

function ToolbarButton({ title, onClick, children }: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-600" title={title}>
      {children}
    </button>
  )
}

function validateCurriculum(sections: DraftSection[]) {
  if (!sections.length) return 'Add at least one section before saving.'
  for (const section of sections) {
    if (section.title.trim().length < 3) return 'Each section needs a title with at least 3 characters.'
    if (section.description.length > 1000) return 'Section descriptions must be 1000 characters or fewer.'
    for (const lesson of section.lessons) {
      if (lesson.title.trim().length < 3) return 'Each lesson needs a title with at least 3 characters.'
      if (lesson.description.length > 2000) return 'Lesson summaries must be 2000 characters or fewer.'
      if (lesson.durationMinutes) {
        const duration = Number(lesson.durationMinutes)
        if (!Number.isInteger(duration) || duration < 0) return 'Lesson duration must be a full number and cannot be negative.'
      }
      if (lesson.lessonType === LessonType.DOWNLOADABLE && !lesson.resourceUrl.trim()) return 'Downloadable lessons need a file upload or URL.'
    }
  }
  return ''
}

function validateAsset(file: File, field: 'videoUrl' | 'resourceUrl') {
  if (field === 'videoUrl') {
    if (!file.type.startsWith('video/')) return 'Lesson video must be a video file.'
    if (file.size > 500 * 1024 * 1024) return 'Lesson video must be 500 MB or smaller.'
  }
  if (field === 'resourceUrl') {
    const allowed = [
      'application/pdf',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint',
    ]
    if (file.type && !allowed.includes(file.type)) return 'Downloadable file must be PDF, Word, PowerPoint, or ZIP.'
    if (file.size > 100 * 1024 * 1024) return 'Downloadable file must be 100 MB or smaller.'
  }
  return ''
}
