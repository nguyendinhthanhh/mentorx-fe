import { useQueries, useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { categoryApi } from '@/api/categoryApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { Plus, BookOpen, Star, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { CourseLessonResponse, SupportedLanguage } from '@/types'

export default function CourseListPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'document'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [languageFilter, setLanguageFilter] = useState<'' | SupportedLanguage>('')
  const [levelFilter, setLevelFilter] = useState('')

  const selectedCategoryId = useMemo(() => {
    if (!categoryFilter) return undefined
    const parsed = Number(categoryFilter)
    return Number.isNaN(parsed) ? undefined : parsed
  }, [categoryFilter])

  const { data, isLoading } = useQuery(
    ['courses', selectedCategoryId, skillFilter, languageFilter, levelFilter],
    () =>
      courseApi.getPublished({
        page: 0,
        size: 20,
        categoryId: selectedCategoryId,
        skill: skillFilter.trim() || undefined,
        language: languageFilter || undefined,
        level: levelFilter.trim() || undefined,
      })
  )
  const { data: categories = [] } = useQuery('course-filter-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const lessonQueries = useQueries(
    (data?.content ?? []).map((course) => ({
      queryKey: ['course-lessons-summary', course.courseId],
      queryFn: () => courseApi.getLessonsByCourse(course.courseId),
      enabled: !!course.courseId,
      staleTime: 1000 * 60 * 5,
    }))
  )

  const lessonSummaryByCourseId = useMemo(() => {
    const summary: Record<
      string,
      { videoCount: number; documentCount: number; totalLessons: number; isLoading: boolean }
    > = {}

    if (!data?.content) {
      return summary
    }

    data.content.forEach((course, index) => {
      const query = lessonQueries[index]

      if (!query || query.isLoading || query.isIdle) {
        summary[course.courseId] = {
          videoCount: 0,
          documentCount: 0,
          totalLessons: 0,
          isLoading: true,
        }
        return
      }

      const lessons = (query.data ?? []) as CourseLessonResponse[]
      const publishedLessons = lessons.filter((lesson) => lesson.isPublished !== false)
      const videoCount = publishedLessons.filter(
        (lesson) => lesson.lessonType === 'VIDEO' || !!lesson.videoUrl
      ).length
      const documentCount = publishedLessons.filter(
        (lesson) =>
          lesson.lessonType === 'DOWNLOADABLE' ||
          lesson.lessonType === 'ARTICLE' ||
          lesson.lessonType === 'TEXT' ||
          !!lesson.resourceUrl ||
          !!lesson.articleContent
      ).length

      summary[course.courseId] = {
        videoCount,
        documentCount,
        totalLessons: publishedLessons.length,
        isLoading: false,
      }
    })

    return summary
  }, [data?.content, lessonQueries])

  const resolveCourseType = (courseId: string) => {
    const summary = lessonSummaryByCourseId[courseId]
    if (!summary || summary.isLoading) return 'unknown'
    if (summary.videoCount > 0) return 'course'
    if (summary.documentCount > 0) return 'document'
    return 'course'
  }

  const filteredCourses = data?.content.filter((course) => {
    const keyword = search.toLowerCase()
    const matchesSearch =
      !search ||
      course.title.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword)

    if (!matchesSearch) return false
    if (typeFilter === 'all') return true

    const courseType = resolveCourseType(course.courseId)
    if (courseType === 'unknown') return true
    return courseType === typeFilter
  })

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {t('courses.title')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                {t('courses.subtitle')}
              </p>
            </div>
            <Link
              to="/courses/create"
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('courses.create')}
            </Link>
          </div>

          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('courses.searchPlaceholder')}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: t('courses.filterAll') },
              { key: 'course' as const, label: t('courses.filterCourses') },
              { key: 'document' as const, label: t('courses.filterDocuments') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTypeFilter(item.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  typeFilter === item.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
            >
              <option value="">All domains</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
              placeholder="Filter by skill"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
            />
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value as '' | SupportedLanguage)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
            >
              <option value="">All languages</option>
              <option value={SupportedLanguage.VI}>Vietnamese</option>
              <option value={SupportedLanguage.EN}>English</option>
              <option value={SupportedLanguage.JA}>Japanese</option>
              <option value={SupportedLanguage.ZH}>Chinese</option>
            </select>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
            >
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-slate-100" />
                <div className="p-5">
                  <div className="mb-3 h-5 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                  <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mb-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="flex justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const lessonSummary = lessonSummaryByCourseId[course.courseId]
              const courseType = resolveCourseType(course.courseId)
              const typeLabel =
                courseType === 'document' ? t('courses.typeDocument') : t('courses.typeCourse')
              const typeClass =
                courseType === 'document'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'

              return (
                <Link
                  key={course.courseId}
                  to={`/courses/${course.courseId}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-indigo-50">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-indigo-300" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-black text-slate-700 backdrop-blur">
                      {course.level || t('courses.resourceType')}
                    </span>
                    <span className={`absolute right-3 top-3 rounded-lg px-2.5 py-1 text-xs font-black ${typeClass}`}>
                      {typeLabel}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 font-black text-slate-950 transition group-hover:text-indigo-700">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {course.description || t('courses.noDescription')}
                    </p>

                    {lessonSummary?.isLoading ? (
                      <div className="mt-3 h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
                    ) : lessonSummary?.totalLessons ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        {lessonSummary.videoCount > 0 && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-600">
                            {lessonSummary.videoCount} Video
                            {lessonSummary.videoCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {lessonSummary.documentCount > 0 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {lessonSummary.documentCount} Document
                            {lessonSummary.documentCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {lessonSummary.totalLessons} Lessons
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="mr-2 truncate font-bold text-slate-500">
                        {course.instructor?.fullName || t('courses.unknownInstructor')}
                      </span>
                      {course.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-700">
                            {course.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-lg font-black text-indigo-700">
                        {course.priceMxc ? formatCurrency(course.priceMxc) : t('courses.free')}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        {course.totalEnrollments}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto h-14 w-14 text-slate-300" />
            <h3 className="mt-4 text-xl font-black text-slate-950">
              {t('courses.noCoursesFound')}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {search ? t('courses.emptyWithSearch') : t('courses.emptyNoCourses')}
            </p>
            <Link
              to="/courses/create"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('courses.create')}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
