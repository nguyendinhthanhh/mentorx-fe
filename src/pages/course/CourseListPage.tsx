import { useQuery } from 'react-query'
import { courseApi } from '@/api/courseApi'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { Plus, BookOpen, Star, Search, Users, FileText, Download, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { CategoryResponse, CourseProductType, SkillResponse, SupportedLanguage } from '@/types'
import { categoryLabel, skillLabel } from '@/utils/freeFormTaxonomy'

export default function CourseListPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'document'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false)
  const [languageFilter, setLanguageFilter] = useState<'' | SupportedLanguage>('')
  const [levelFilter, setLevelFilter] = useState('')

  const selectedCategoryId = useMemo(() => {
    if (!categoryFilter) return undefined
    const parsed = Number(categoryFilter)
    return Number.isNaN(parsed) ? undefined : parsed
  }, [categoryFilter])

  const { data, isLoading } = useQuery(
    ['courses', selectedCategoryId, skillFilter, languageFilter, levelFilter, typeFilter],
    () =>
      courseApi.getPublished({
        page: 0,
        size: 20,
        categoryId: selectedCategoryId,
        skill: skillFilter.trim() || undefined,
        productType:
          typeFilter === 'document'
            ? CourseProductType.DOCUMENT
            : typeFilter === 'course'
              ? CourseProductType.COURSE
              : undefined,
        language: languageFilter || undefined,
        level: levelFilter.trim() || undefined,
      })
  )
  const { data: categories = [] } = useQuery('course-filter-categories', categoryApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: skills = [] } = useQuery('course-filter-skills', skillApi.getAllActive, {
    staleTime: 5 * 60 * 1000,
  })

  const resolveCourseType = (productType?: CourseProductType) => {
    return productType === CourseProductType.DOCUMENT ? 'document' : 'course'
  }

  const filteredCourses = data?.content.filter((course) => {
    const keyword = search.toLowerCase()
    const matchesSearch =
      !search ||
      course.title.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword)

    if (!matchesSearch) return false
    return true
  })
  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<number, string>>((acc, category) => {
      acc[category.id] = categoryLabel(category)
      return acc
    }, {})
  }, [categories])
  const courseSearchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    const suggestions = new Set<string>()
    ;(data?.content || []).forEach((course) => {
      const values = [
        course.title,
        course.instructor?.fullName,
        course.instructorName,
        course.categoryId ? categoryNameById[course.categoryId] : '',
        ...(course.skills || []),
      ].filter(Boolean) as string[]
      values.forEach((value) => {
        if (value.toLowerCase().includes(query)) suggestions.add(value)
      })
    })
    return Array.from(suggestions).slice(0, 8)
  }, [categoryNameById, data?.content, search])
  const categorySuggestions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    return categories
      .filter((category) => {
        if (!query) return true
        return [category.name, category.slug].some((value) => value?.toLowerCase().includes(query))
      })
      .slice(0, 8)
  }, [categories, categorySearch])
  const skillSuggestions = useMemo(() => {
    const query = skillFilter.trim().toLowerCase()
    return skills
      .filter((skill) => {
        if (!query) return true
        return [skill.labelEn, skill.labelVi, skill.slug].some((value) => value?.toLowerCase().includes(query))
      })
      .slice(0, 8)
  }, [skills, skillFilter])

  const selectCategory = (category: CategoryResponse) => {
    setCategoryFilter(String(category.id))
    setCategorySearch(categoryLabel(category))
    setIsCategoryMenuOpen(false)
  }

  const selectSkill = (skill: SkillResponse) => {
    setSkillFilter(skillLabel(skill))
    setIsSkillMenuOpen(false)
  }

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
                onChange={(e) => {
                  setSearch(e.target.value)
                  setIsSearchMenuOpen(true)
                }}
                onFocus={() => setIsSearchMenuOpen(true)}
                onBlur={() => window.setTimeout(() => setIsSearchMenuOpen(false), 120)}
                placeholder={t('courses.searchPlaceholder')}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {isSearchMenuOpen && courseSearchSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {courseSearchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearch(suggestion)
                        setIsSearchMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-indigo-50"
                    >
                      <Search className="h-4 w-4 text-slate-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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
            <div className="relative w-44">
              <input
                value={categorySearch}
                onChange={(event) => {
                  setCategorySearch(event.target.value)
                  setCategoryFilter('')
                  setIsCategoryMenuOpen(true)
                }}
                onFocus={() => setIsCategoryMenuOpen(true)}
                onBlur={() => window.setTimeout(() => setIsCategoryMenuOpen(false), 120)}
                placeholder="All domains"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
                autoComplete="off"
              />
              {isCategoryMenuOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setCategoryFilter('')
                      setCategorySearch('')
                      setIsCategoryMenuOpen(false)
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">All domains</span>
                  </button>
                  {categorySuggestions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCategory(category)}
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                    >
                      <span className="text-sm font-semibold text-slate-900">{categoryLabel(category)}</span>
                      <span className="text-xs text-slate-500">{category.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-44">
              <input
                value={skillFilter}
                onChange={(event) => {
                  setSkillFilter(event.target.value)
                  setIsSkillMenuOpen(true)
                }}
                onFocus={() => setIsSkillMenuOpen(true)}
                onBlur={() => window.setTimeout(() => setIsSkillMenuOpen(false), 120)}
                placeholder="All skills"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500"
                autoComplete="off"
              />
              {isSkillMenuOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSkillFilter('')
                      setIsSkillMenuOpen(false)
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">All skills</span>
                  </button>
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSkill(skill)}
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
                    >
                      <span className="text-sm font-semibold text-slate-900">{skillLabel(skill)}</span>
                      <span className="text-xs text-slate-500">{skill.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              const courseType = resolveCourseType(course.productType)
              const typeLabel =
                courseType === 'document' ? t('courses.typeDocument') : t('courses.typeCourse')
              const typeClass =
                courseType === 'document'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700'
              const accentClass =
                courseType === 'document'
                  ? 'hover:border-amber-200 hover:shadow-amber-500/10'
                  : 'hover:border-indigo-200 hover:shadow-indigo-500/10'
              const domainName = course.categoryId ? categoryNameById[course.categoryId] : ''
              const courseSkills = course.skills || []

              return (
                <Link
                  key={course.courseId}
                  to={`/courses/${course.courseId}`}
                  className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${accentClass}`}
                >
                  <div className={`relative h-48 overflow-hidden ${courseType === 'document' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {courseType === 'document' ? (
                          <FileText className="h-12 w-12 text-amber-300" />
                        ) : (
                          <BookOpen className="h-12 w-12 text-indigo-300" />
                        )}
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
                    <CourseMetadata domainName={domainName} skills={courseSkills} />

                    {course.totalLessons ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        {courseType === 'document' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                            <Download className="h-3 w-3" />
                            Downloadable
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {courseType === 'document' ? '1 File' : `${course.totalLessons} Lessons`}
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      {(course.instructor?.fullName || course.instructorName) ? (
                        <span className="mr-2 truncate font-bold text-slate-500">
                          {course.instructor?.fullName || course.instructorName}
                        </span>
                      ) : <span />}
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
                        {courseType === 'document' ? <Download className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
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

function CourseMetadata({ domainName, skills }: { domainName?: string; skills: string[] }) {
  if (!domainName && skills.length === 0) return null
  return (
    <div className="mt-3 space-y-2">
      {domainName && (
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{domainName}</span>
        </div>
      )}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
