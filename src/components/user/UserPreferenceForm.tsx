import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { matchingApi } from '@/api/matchingApi'
import {
  Loader2,
  Save,
  X,
  Search,
  Check,
  Layers,
  Wrench,
  Globe,
  Target,
  ChevronDown,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const LANGUAGE_OPTIONS: { id: string; label: string; flag: string }[] = [
  { id: 'Vietnamese', label: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'English', label: 'English', flag: '🇺🇸' },
  { id: 'Japanese', label: 'Tiếng Nhật', flag: '🇯🇵' },
  { id: 'Chinese', label: 'Tiếng Trung', flag: '🇨🇳' },
  { id: 'Korean', label: 'Tiếng Hàn', flag: '🇰🇷' },
]

const GOAL_SUGGESTIONS = [
  'Cải thiện kỹ năng phỏng vấn',
  'Nâng cao khả năng lãnh đạo',
  'Chuyển ngành nghề',
  'Xây dựng portfolio',
  'Học công nghệ mới',
]

/* ────────────── Section wrapper ────────────── */
function SectionCard({
  icon: Icon,
  title,
  description,
  count,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
      {/* Header — clickable to collapse */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] text-white shadow-[0_4px_12px_rgba(5,150,105,0.2)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{title}</h3>
            <span
              className={`inline-flex items-center rounded-full bg-[#059669]/10 px-2.5 py-0.5 text-xs font-bold text-[#059669] transition-opacity duration-150 ${
                count > 0 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {count || 0} đã chọn
            </span>
          </div>
          <p className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-5 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  )
}

/* ────────────── Toggle Chip ────────────── */
function ToggleChip({
  label,
  active,
  onClick,
  prefix,
  size = 'md',
}: {
  label: string
  active: boolean
  onClick: () => void
  prefix?: React.ReactNode
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border font-semibold transition-colors duration-150 ${
        size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-[14px]'
      } ${
        active
          ? 'border-[#059669] bg-[#059669]/10 text-[#059669] dark:border-[#10B981] dark:bg-[#10B981]/15 dark:text-[#10B981]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
      }`}
      style={{ contain: 'layout' }}
    >
      {prefix}
      <span className="truncate">{label}</span>
      <Check
        className={`h-3.5 w-3.5 shrink-0 transition-opacity duration-150 ${
          active ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
        }`}
      />
    </button>
  )
}

/* ════════════════ Main Form ════════════════ */
export default function UserPreferenceForm() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [skillSearch, setSkillSearch] = useState('')
  const [domainIds, setDomainIds] = useState<number[]>([])
  const [skillIds, setSkillIds] = useState<number[]>([])
  const [learningGoals, setLearningGoals] = useState<string[]>([])
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])
  const [showAllDomains, setShowAllDomains] = useState(false)
  const [saved, setSaved] = useState(false)

  const categoriesQuery = useQuery('preferences-categories', categoryApi.getAllActive)
  const skillsQuery = useQuery('preferences-skills', skillApi.getAllActive)

  const preferencesQuery = useQuery('my-matching-preferences', matchingApi.getPreferences, {
    onSuccess: (data) => {
      setDomainIds(data.interestedDomainIds || [])
      setSkillIds(data.preferredSkillIds || [])
      setLearningGoals(data.learningGoals || [])
      setPreferredLanguages(data.preferredLanguages || [])
    },
    onError: () => {
      setError('Không thể tải sở thích của bạn lúc này.')
    },
  })

  const updateMutation = useMutation(matchingApi.updatePreferences, {
    onSuccess: (data) => {
      setDomainIds(data.interestedDomainIds || [])
      setSkillIds(data.preferredSkillIds || [])
      setLearningGoals(data.learningGoals || [])
      setPreferredLanguages(data.preferredLanguages || [])
      setError('')
      setSaved(true)
      toast.success('Đã lưu sở thích thành công!', { duration: 3000 })
      setTimeout(() => setSaved(false), 3000)
      queryClient.invalidateQueries(['home-data', true])
      queryClient.invalidateQueries('my-matching-preferences')
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Không thể lưu sở thích.'
      setError(message)
      toast.error(message)
    },
  })

  const isLoading =
    categoriesQuery.isLoading || skillsQuery.isLoading || preferencesQuery.isLoading

  const filteredSkills = useMemo(() => {
    if (!skillsQuery.data) return []
    if (!skillSearch.trim()) return skillsQuery.data
    const term = skillSearch.toLowerCase()
    return skillsQuery.data.filter(
      (skill) =>
        skill.labelEn.toLowerCase().includes(term) || skill.labelVi.toLowerCase().includes(term)
    )
  }, [skillsQuery.data, skillSearch])

  const toggleDomain = (id: number) => {
    setDomainIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSkill = (id: number) => {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleLanguage = (language: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(language) ? prev.filter((item) => item !== language) : [...prev, language]
    )
  }

  const addLearningGoal = () => {
    const value = goalInput.trim()
    if (!value) return
    if (learningGoals.includes(value)) {
      setGoalInput('')
      return
    }
    setLearningGoals((prev) => [...prev, value].slice(0, 20))
    setGoalInput('')
  }

  const savePreferences = () => {
    updateMutation.mutate({
      interestedDomainIds: domainIds,
      preferredSkillIds: skillIds,
      learningGoals,
      preferredLanguages,
      onboardingCompleted: true,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#059669] to-[#10B981] shadow-[0_8px_20px_rgba(5,150,105,0.25)]">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <p className="text-sm font-medium text-slate-500">Đang tải sở thích của bạn...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* ── Domains ── */}
      <SectionCard
        icon={Layers}
        title="Lĩnh vực quan tâm"
        description="Chọn các lĩnh vực bạn muốn khám phá hoặc cải thiện."
        count={domainIds.length}
      >
        {(() => {
          const allCategories = categoriesQuery.data || []
          const VISIBLE_LIMIT = 8
          const hasMore = allCategories.length > VISIBLE_LIMIT
          const visible = showAllDomains ? allCategories : allCategories.slice(0, VISIBLE_LIMIT)
          return (
            <>
              <div className="flex flex-wrap gap-2.5">
                {visible.map((category) => (
                  <ToggleChip
                    key={category.id}
                    label={category.name}
                    active={domainIds.includes(category.id)}
                    onClick={() => toggleDomain(category.id)}
                  />
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowAllDomains((v) => !v)}
                  className="mt-2 text-[13px] font-semibold text-[#059669] hover:underline"
                >
                  {showAllDomains
                    ? 'Thu gọn'
                    : `Xem thêm ${allCategories.length - VISIBLE_LIMIT} lĩnh vực`}
                </button>
              )}
            </>
          )
        })()}
      </SectionCard>

      {/* ── Skills ── */}
      <SectionCard
        icon={Wrench}
        title="Kỹ năng ưu tiên"
        description="Chọn công cụ, framework hoặc phương pháp cụ thể bạn quan tâm."
        count={skillIds.length}
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Tìm kỹ năng..."
              className="block w-full rounded-[14px] border-0 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200/60 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#059669] hover:bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700"
            />
          </div>

          {/* Selected skills summary */}
          {skillIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skillsQuery.data
                ?.filter((s) => skillIds.includes(s.id))
                .map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#059669] px-3 py-1 text-[12px] font-bold text-white shadow-sm"
                  >
                    {skill.labelEn}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}

          {/* Skill grid */}
          <div className="max-h-72 overflow-y-auto rounded-[16px] border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-800/20">
            <div className="flex flex-wrap gap-2">
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => (
                  <ToggleChip
                    key={skill.id}
                    label={skill.labelEn}
                    active={skillIds.includes(skill.id)}
                    onClick={() => toggleSkill(skill.id)}
                    size="sm"
                  />
                ))
              ) : (
                <div className="w-full py-8 text-center text-sm text-slate-500">
                  Không tìm thấy kỹ năng "{skillSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Languages ── */}
      <SectionCard
        icon={Globe}
        title="Ngôn ngữ ưu tiên"
        description="Bạn muốn trao đổi bằng ngôn ngữ nào?"
        count={preferredLanguages.length}
      >
        <div className="flex flex-wrap gap-2.5">
          {LANGUAGE_OPTIONS.map((lang) => (
            <ToggleChip
              key={lang.id}
              label={lang.label}
              active={preferredLanguages.includes(lang.id)}
              onClick={() => toggleLanguage(lang.id)}
              prefix={<span className="text-base leading-none">{lang.flag}</span>}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── Goals ── */}
      <SectionCard
        icon={Target}
        title="Mục tiêu học tập"
        description="Bạn đang cố gắng đạt được điều gì?"
        count={learningGoals.length}
      >
        <div className="space-y-4">
          {/* Input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addLearningGoal()
                  }
                }}
                className="block w-full rounded-[14px] border-0 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-200/60 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#059669] hover:bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700"
                placeholder="Nhập mục tiêu của bạn..."
              />
            </div>
            <button
              type="button"
              onClick={addLearningGoal}
              className="flex items-center gap-1.5 rounded-[14px] bg-[#059669] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(5,150,105,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(5,150,105,0.3)] active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm</span>
            </button>
          </div>

          {/* Suggestion chips */}
          {learningGoals.length === 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Gợi ý
              </p>
              <div className="flex flex-wrap gap-2">
                {GOAL_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (!learningGoals.includes(suggestion)) {
                        setLearningGoals((prev) => [...prev, suggestion])
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:border-[#059669] hover:text-[#059669] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <Plus className="h-3 w-3" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Added goals */}
          {learningGoals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {learningGoals.map((goal, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {goal}
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                    onClick={() =>
                      setLearningGoals((prev) => prev.filter((item) => item !== goal))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-3.5 text-sm font-medium text-red-700 shadow-sm backdrop-blur-sm dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Success ── */}
      {saved && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#059669]/20 bg-[#059669]/10 px-5 py-3.5 text-sm font-medium text-[#059669] shadow-sm dark:border-[#059669]/30 dark:bg-[#059669]/20 dark:text-[#10B981]">
          <Check className="h-4 w-4 shrink-0" />
          <p>Đã lưu sở thích thành công!</p>
        </div>
      )}

      {/* ── Save Footer ── */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          disabled={updateMutation.isLoading}
          onClick={savePreferences}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#10B981] px-8 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_25px_rgba(5,150,105,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(5,150,105,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateMutation.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Lưu sở thích
        </button>
      </div>
    </div>
  )
}
