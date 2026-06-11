import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Archive, BookOpen, Eye, Loader2, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react'

import { mentorApi } from '@/api/mentorApi'
import { useI18n } from '@/i18n/I18nProvider'
import { CourseStatus, MentorOfferingRequest, MentorOfferingResponse } from '@/types'
import { formatMxc } from '@/utils/formatters'

interface Props {
  userId: string
}

const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const

const emptyForm = (): MentorOfferingRequest => ({
  title: '',
  description: '',
  priceMxc: 0,
  durationHours: 1,
  level: 'BEGINNER',
  lessonsCount: 1,
  thumbnailUrl: '',
})

export default function MentorCoursesManager({ userId }: Props) {
  const { language } = useI18n()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MentorOfferingRequest>(emptyForm())

  const copy = language === 'vi'
    ? {
        title: 'Khoa hoc noi bat',
        subtitle: 'Quan ly cac khoa hoc hien thi trong trang mentor cong khai.',
        create: 'Them khoa hoc',
        edit: 'Sua khoa hoc',
        empty: 'Chua co khoa hoc nao. Them khoa hoc dau tien de hien thi tren profile cong khai.',
        publish: 'Xuat ban',
        archive: 'Luu tru',
        remove: 'Xoa',
        save: 'Luu khoa hoc',
        cancel: 'Huy',
        lessons: 'bai hoc',
        duration: 'gio',
        thumbnail: 'Thumbnail URL',
        levelBeginner: 'Co ban',
        levelIntermediate: 'Trung cap',
        levelAdvanced: 'Nang cao',
      }
    : {
        title: 'Featured courses',
        subtitle: 'Manage the courses that appear on your public mentor page.',
        create: 'Add course',
        edit: 'Edit course',
        empty: 'No courses yet. Add your first course to show it on the public profile.',
        publish: 'Publish',
        archive: 'Archive',
        remove: 'Delete',
        save: 'Save course',
        cancel: 'Cancel',
        lessons: 'lessons',
        duration: 'hours',
        thumbnail: 'Thumbnail URL',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
      }

  const { data: courses = [], isLoading } = useQuery(['mentor-courses', userId], () => mentorApi.getMentorCourses(userId), {
    enabled: Boolean(userId),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['mentor-courses', userId]),
      queryClient.invalidateQueries(['mentor', userId]),
    ])
  }

  const createMutation = useMutation((payload: MentorOfferingRequest) => mentorApi.createMentorCourse(userId, payload), {
    onSuccess: async () => {
      await invalidate()
      setIsCreating(false)
      setForm(emptyForm())
    },
  })

  const updateMutation = useMutation(
    ({ courseId, payload }: { courseId: string; payload: MentorOfferingRequest }) => mentorApi.updateMentorCourse(courseId, payload),
    {
      onSuccess: async () => {
        await invalidate()
        setIsCreating(false)
        setEditingId(null)
        setForm(emptyForm())
      },
    }
  )

  const publishMutation = useMutation((courseId: string) => mentorApi.publishMentorCourse(courseId), {
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation((courseId: string) => mentorApi.archiveMentorCourse(courseId), {
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation((courseId: string) => mentorApi.deleteMentorCourse(courseId), {
    onSuccess: invalidate,
  })

  const beginEdit = (course: MentorOfferingResponse) => {
    setEditingId(course.id)
    setForm({
      title: course.title,
      description: course.description,
      priceMxc: course.priceMxc,
      durationHours: course.durationHours,
      level: course.level,
      lessonsCount: course.lessonsCount,
      thumbnailUrl: course.thumbnailUrl || '',
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setIsCreating(false)
    setForm(emptyForm())
  }

  const saveCourse = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingId) {
      updateMutation.mutate({ courseId: editingId, payload: form })
      return
    }
    createMutation.mutate(form)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{copy.title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{copy.subtitle}</p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {copy.create}
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={saveCourse} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-950">{editingId ? copy.edit : copy.create}</h3>
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label={copy.thumbnail}>
              <input
                value={form.thumbnailUrl || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
                className={inputClass}
                placeholder="https://..."
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className={inputClass}
                rows={4}
                required
              />
            </Field>
            <Field label="Price (MXC)">
              <input
                type="number"
                min="1"
                value={form.priceMxc}
                onChange={(event) => setForm((prev) => ({ ...prev, priceMxc: Number(event.target.value) }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Duration">
              <input
                type="number"
                min="1"
                value={form.durationHours}
                onChange={(event) => setForm((prev) => ({ ...prev, durationHours: Number(event.target.value) }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Lessons">
              <input
                type="number"
                min="1"
                value={form.lessonsCount}
                onChange={(event) => setForm((prev) => ({ ...prev, lessonsCount: Number(event.target.value) }))}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Level">
              <select
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
                className={inputClass}
                required
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLevel(option, copy)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createMutation.isLoading || updateMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {copy.save}
            </button>
            <button type="button" onClick={resetForm} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-white">
              {copy.cancel}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm font-medium text-slate-500">
          {copy.empty}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {courses.map((course) => {
            const isPublished = course.status === CourseStatus.PUBLISHED
            return (
              <article key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex gap-4 p-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge published={isPublished} />
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {formatLevel(course.level, copy)}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500">{course.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 px-5 py-4 text-sm">
                  <MiniStat label="Price" value={formatMxc(course.priceMxc, language)} />
                  <MiniStat label="Duration" value={`${course.durationHours} ${copy.duration}`} />
                  <MiniStat label="Lessons" value={`${course.lessonsCount} ${copy.lessons}`} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => beginEdit(course)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                      <Pencil className="h-3.5 w-3.5" />
                      {copy.edit}
                    </button>
                    {isPublished ? (
                      <button
                        type="button"
                        onClick={() => archiveMutation.mutate(course.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-50"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {copy.archive}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => publishMutation.mutate(course.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {copy.publish}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(course.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {copy.remove}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {published ? <Eye className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

function formatLevel(
  level: string,
  copy: { levelBeginner: string; levelIntermediate: string; levelAdvanced: string }
) {
  if (level === 'ADVANCED') return copy.levelAdvanced
  if (level === 'INTERMEDIATE') return copy.levelIntermediate
  return copy.levelBeginner
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
