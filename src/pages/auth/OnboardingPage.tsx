import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  GraduationCap,
  Languages,
  LayoutPanelTop,
  Loader2,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { categoryApi } from '@/api/categoryApi'
import { matchingApi } from '@/api/matchingApi'
import { onboardingApi } from '@/api/onboardingApi'

type SelectOption = {
  id: string
  label: string
  description: string
  icon: LucideIcon
}

type FieldOption = SelectOption & {
  categorySlug?: string
}

const STEP_META = [
  {
    key: 'stage',
    stepLabel: 'Bước 1',
    progressLabel: 'Current Stage',
    question: 'Hiện tại bạn đang ở đâu trên hành trình nghề nghiệp?',
    helper: 'Chúng tôi sẽ dùng thông tin này để gợi ý mentor phù hợp hơn.',
  },
  {
    key: 'goal',
    stepLabel: 'Bước 2',
    progressLabel: 'Primary Goal',
    question: 'Bạn muốn Mentor X hỗ trợ điều gì trước tiên?',
    helper: 'Chọn mục tiêu chính để đề xuất mentor và lộ trình đi đúng hướng ngay từ đầu.',
  },
  {
    key: 'fields',
    stepLabel: 'Bước 3',
    progressLabel: 'Interested Fields',
    question: 'Những lĩnh vực nào bạn muốn tập trung?',
    helper: 'Chọn tối đa 3 lĩnh vực để gợi ý nội dung và mentor sát hơn.',
  },
  {
    key: 'languages',
    stepLabel: 'Bước 4',
    progressLabel: 'Languages',
    question: 'Bạn muốn học và trao đổi bằng ngôn ngữ nào?',
    helper: 'Bạn có thể chọn tối đa 2 ngôn ngữ để ưu tiên khi matching.',
  },
  {
    key: 'style',
    stepLabel: 'Bước 5',
    progressLabel: 'Mentor Style',
    question: 'Bạn thích mentor có phong cách như thế nào?',
    helper: 'Chọn tối đa 2 phong cách để cuộc trao đổi dễ hợp nhịp hơn.',
  },
] as const

const CAREER_OPTIONS: SelectOption[] = [
  { id: 'student', label: 'Sinh viên', description: 'Đang học và chuẩn bị đi làm.', icon: GraduationCap },
  { id: 'intern', label: 'Thực tập sinh', description: 'Muốn chuyển từ học sang trải nghiệm thực tế.', icon: Rocket },
  { id: 'new-grad', label: 'Mới tốt nghiệp', description: 'Đang cần định hướng cho bước đi đầu tiên.', icon: Search },
  { id: 'junior', label: 'Người mới đi làm', description: 'Muốn học nhanh từ mentor để lên level.', icon: Briefcase },
  { id: 'mid-level', label: 'Đã có kinh nghiệm', description: 'Muốn phát triển nghề nghiệp rõ ràng hơn.', icon: TrendingUp },
  { id: 'senior', label: 'Senior hoặc lead', description: 'Cần trao đổi sâu hơn về chiến lược và growth.', icon: Users },
  { id: 'career-switch', label: 'Chuyển ngành', description: 'Muốn có lộ trình thực tế để đổi hướng.', icon: Target },
]

const GOAL_OPTIONS: SelectOption[] = [
  { id: 'find-mentor', label: 'Tìm mentor phù hợp', description: 'Muốn có người đồng hành đều đặn.', icon: Users },
  { id: 'improve-skills', label: 'Nâng kỹ năng nhanh hơn', description: 'Cần biết nên học gì tiếp theo.', icon: BookOpen },
  { id: 'interview', label: 'Chuẩn bị CV và phỏng vấn', description: 'Muốn tự tin hơn trước khi apply.', icon: Rocket },
  { id: 'career-planning', label: 'Lên kế hoạch nghề nghiệp', description: 'Cần góc nhìn dài hạn và thực tế.', icon: Target },
  { id: 'find-jobs', label: 'Tìm cơ hội việc làm', description: 'Muốn tiếp cận công việc phù hợp hơn.', icon: Briefcase },
  { id: 'build-portfolio', label: 'Xây portfolio hoặc dự án', description: 'Muốn có đầu ra rõ ràng để chứng minh năng lực.', icon: LayoutPanelTop },
]

const FIELD_OPTIONS: FieldOption[] = [
  { id: 'frontend', label: 'Frontend', description: 'React, web UI, performance.', icon: LayoutPanelTop, categorySlug: 'software-dev' },
  { id: 'backend', label: 'Backend', description: 'API, database, architecture.', icon: Code2, categorySlug: 'software-dev' },
  { id: 'mobile', label: 'Mobile', description: 'iOS, Android, cross-platform.', icon: Smartphone, categorySlug: 'software-dev' },
  { id: 'ai', label: 'AI', description: 'LLM, machine learning, automation.', icon: Brain, categorySlug: 'data-ai' },
  { id: 'data', label: 'Data', description: 'Analytics, BI, data engineering.', icon: Database, categorySlug: 'data-ai' },
  { id: 'ui-ux', label: 'UI/UX', description: 'Design system, research, flows.', icon: Palette, categorySlug: 'design' },
  { id: 'product', label: 'Product', description: 'Product thinking, roadmap, discovery.', icon: Target, categorySlug: 'business-finance' },
  { id: 'business', label: 'Business', description: 'Strategy, planning, operations.', icon: Briefcase, categorySlug: 'business-finance' },
  { id: 'marketing', label: 'Marketing', description: 'Growth, content, campaigns.', icon: TrendingUp, categorySlug: 'business-finance' },
  { id: 'sales', label: 'Sales', description: 'B2B sales, closing, pipeline.', icon: TrendingUp, categorySlug: 'business-finance' },
  { id: 'finance', label: 'Finance', description: 'Financial planning, analysis, reporting.', icon: Briefcase, categorySlug: 'business-finance' },
  { id: 'operations', label: 'Operations', description: 'Process, execution, team coordination.', icon: Settings2, categorySlug: 'business-finance' },
  { id: 'hr', label: 'HR', description: 'Hiring, people ops, career development.', icon: Users, categorySlug: 'business-finance' },
  { id: 'education', label: 'Education', description: 'Teaching, training, learning design.', icon: BookOpen },
  { id: 'cyber-security', label: 'Cyber Security', description: 'App security, incident response.', icon: ShieldCheck, categorySlug: 'software-dev' },
  { id: 'cloud', label: 'Cloud', description: 'AWS, GCP, Azure, infra.', icon: Cloud, categorySlug: 'software-dev' },
  { id: 'devops', label: 'DevOps', description: 'CI/CD, monitoring, deployments.', icon: Settings2, categorySlug: 'software-dev' },
]

const LANGUAGE_OPTIONS: SelectOption[] = [
  { id: 'vi', label: 'Vietnamese', description: 'Ưu tiên trao đổi bằng tiếng Việt.', icon: Languages },
  { id: 'en', label: 'English', description: 'Thoải mái trao đổi bằng tiếng Anh.', icon: Languages },
  { id: 'ja', label: 'Japanese', description: 'Muốn học hoặc làm việc với tiếng Nhật.', icon: Languages },
]

const STYLE_OPTIONS: SelectOption[] = [
  { id: 'friendly', label: 'Friendly', description: 'Thoải mái, dễ chia sẻ và dễ hỏi thêm.', icon: Sparkles },
  { id: 'direct', label: 'Direct', description: 'Đi thẳng vào vấn đề, phản hồi rõ ràng.', icon: ArrowRight },
  { id: 'detailed', label: 'Detailed', description: 'Giải thích kỹ và có nhiều ngữ cảnh hơn.', icon: BookOpen },
  { id: 'practical', label: 'Practical', description: 'Ưu tiên ví dụ thật và cách áp dụng ngay.', icon: CheckCircle2 },
  { id: 'flexible', label: 'Flexible', description: 'Tùy theo tốc độ và mục tiêu của bạn.', icon: MessageSquare },
]

const MAX_FIELDS = 3
const MAX_CUSTOM_FIELDS = 3
const MAX_LANGUAGES = 2
const MAX_STYLES = 2

function buildOptionMap<T extends { id: string }>(options: T[]) {
  return Object.fromEntries(options.map((option) => [option.id, option])) as Record<string, T>
}

function BrandMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F172A] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
      <Sparkles className="h-5 w-5" />
    </div>
  )
}

function ProgressRail({
  currentStep,
}: {
  currentStep: number
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {STEP_META.map((step, index) => (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <div
              className={`h-3.5 w-3.5 rounded-full border transition-all duration-200 ${
                index < currentStep
                  ? 'border-[#F59E0B] bg-[#F59E0B]'
                  : index === currentStep
                  ? 'border-[#F59E0B] bg-white ring-4 ring-[#FDE6B3]'
                  : 'border-[#D6D3D1] bg-white'
              }`}
            />
            {index < STEP_META.length - 1 ? (
              <div
                className={`h-px flex-1 transition-all duration-200 ${
                  index < currentStep ? 'bg-[#F59E0B]' : 'bg-[#E5E7EB]'
                }`}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{STEP_META[currentStep].stepLabel}</p>
          <p className="mt-1 text-sm text-[#6B7280]">{STEP_META[currentStep].progressLabel}</p>
        </div>
        <p className="text-sm text-[#6B7280]">Khoảng 30 giây</p>
      </div>
    </div>
  )
}

function OptionCard({
  option,
  selected,
  onClick,
  multiSelect,
}: {
  option: SelectOption
  selected: boolean
  onClick: () => void
  multiSelect?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40 focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] ${
        selected
          ? 'border-[#F59E0B] bg-[#FFF7ED] shadow-[0_12px_24px_rgba(245,158,11,0.10)]'
          : 'border-[#E8E8E8] bg-white hover:bg-[#FAFAFA]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            selected ? 'bg-[#FDE6B3] text-[#D97706]' : 'bg-[#F7F7F5] text-[#6B7280]'
          }`}
        >
          <option.icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#111827]">{option.label}</p>
            {multiSelect ? (
              <span className="text-[11px] text-[#9CA3AF]">Có thể chọn nhiều</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-5 text-[#6B7280]">{option.description}</p>
        </div>

        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? 'border-[#F59E0B] bg-[#F59E0B] text-[#111827]' : 'border-[#D1D5DB] bg-white text-transparent'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  )
}

function FloatingCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  if (!value) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-4 border-t border-[#F1F5F9] py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs font-medium text-[#6B7280]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshUser, skipOnboardingForSession, clearSkippedOnboarding } = useAuthStore()

  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([])
  const [customFieldTags, setCustomFieldTags] = useState<string[]>([])
  const [customFieldInput, setCustomFieldInput] = useState('')
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(['vi'])
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([])
  const [hasHydratedPreferences, setHasHydratedPreferences] = useState(false)

  const categoriesQuery = useQuery('onboarding-categories', categoryApi.getAllActive)
  const preferencesQuery = useQuery('my-matching-preferences', matchingApi.getPreferences, {
    retry: false,
  })

  const careerById = useMemo(() => buildOptionMap(CAREER_OPTIONS), [])
  const goalById = useMemo(() => buildOptionMap(GOAL_OPTIONS), [])
  const fieldById = useMemo(() => buildOptionMap(FIELD_OPTIONS), [])
  const languageById = useMemo(() => buildOptionMap(LANGUAGE_OPTIONS), [])
  const styleById = useMemo(() => buildOptionMap(STYLE_OPTIONS), [])

  const categoryIdBySlug = useMemo(
    () =>
      Object.fromEntries((categoriesQuery.data || []).map((category) => [category.slug, category.id])) as Record<
        string,
        number
      >,
    [categoriesQuery.data]
  )

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!preferencesQuery.data || hasHydratedPreferences) {
      return
    }

    const savedGoals = preferencesQuery.data.learningGoals || []
    const knownFieldLabels = new Set(FIELD_OPTIONS.map((option) => option.label))
    const knownCareerLabels = new Set(CAREER_OPTIONS.map((option) => option.label))
    const knownGoalLabels = new Set(GOAL_OPTIONS.map((option) => option.label))
    const knownStyleLabels = new Set(STYLE_OPTIONS.map((option) => option.label))
    const matchedStage = CAREER_OPTIONS.find((option) => savedGoals.includes(option.label))
    const matchedGoal = GOAL_OPTIONS.find((option) => savedGoals.includes(option.label))
    const matchedFields = FIELD_OPTIONS.filter((option) => savedGoals.includes(option.label)).map((option) => option.id)
    const matchedStyles = STYLE_OPTIONS.filter((option) => savedGoals.includes(option.label)).map((option) => option.id)
    const matchedLanguages = LANGUAGE_OPTIONS.filter((option) =>
      preferencesQuery.data.preferredLanguages.includes(option.label)
    ).map((option) => option.id)
    const customSavedFields = savedGoals.filter(
      (goal) =>
        !knownFieldLabels.has(goal) &&
        !knownCareerLabels.has(goal) &&
        !knownGoalLabels.has(goal) &&
        !knownStyleLabels.has(goal)
    )

    if (matchedStage) {
      setSelectedStage(matchedStage.id)
    }
    if (matchedGoal) {
      setSelectedGoal(matchedGoal.id)
    }
    if (matchedFields.length > 0) {
      setSelectedFieldIds(matchedFields)
    }
    if (matchedStyles.length > 0) {
      setSelectedStyleIds(matchedStyles)
    }
    if (customSavedFields.length > 0) {
      setCustomFieldTags(customSavedFields.slice(0, MAX_CUSTOM_FIELDS))
    }
    if (matchedLanguages.length > 0) {
      setSelectedLanguageIds(matchedLanguages)
    }

    setHasHydratedPreferences(true)
  }, [hasHydratedPreferences, preferencesQuery.data])

  const selectedFieldLabels = useMemo(
    () => [...selectedFieldIds.map((id) => fieldById[id]?.label).filter(Boolean), ...customFieldTags] as string[],
    [customFieldTags, fieldById, selectedFieldIds]
  )

  const selectedLanguageLabels = useMemo(
    () => selectedLanguageIds.map((id) => languageById[id]?.label).filter(Boolean) as string[],
    [languageById, selectedLanguageIds]
  )

  const selectedStyleLabels = useMemo(
    () => selectedStyleIds.map((id) => styleById[id]?.label).filter(Boolean) as string[],
    [selectedStyleIds, styleById]
  )

  const summaryRows = useMemo(
    () => [
      { label: 'Stage', value: careerById[selectedStage]?.label || null },
      { label: 'Goal', value: goalById[selectedGoal]?.label || null },
      { label: 'Field', value: selectedFieldLabels.length > 0 ? selectedFieldLabels.join(', ') : null },
      { label: 'Language', value: selectedLanguageLabels.length > 0 ? selectedLanguageLabels.join(', ') : null },
      { label: 'Mentor style', value: selectedStyleLabels.length > 0 ? selectedStyleLabels.join(', ') : null },
    ],
    [careerById, goalById, selectedFieldLabels, selectedGoal, selectedLanguageLabels, selectedStage, selectedStyleLabels]
  )

  const resolvedDomainIds = useMemo(() => {
    const categoryIds = selectedFieldIds
      .map((fieldId) => categoryIdBySlug[fieldById[fieldId]?.categorySlug || ''])
      .filter((value): value is number => Number.isInteger(value))
    return Array.from(new Set(categoryIds))
  }, [categoryIdBySlug, fieldById, selectedFieldIds])

  const learningGoalsPayload = useMemo(() => {
    const values = [
      careerById[selectedStage]?.label,
      goalById[selectedGoal]?.label,
      ...selectedFieldLabels,
      ...selectedStyleLabels,
    ].filter(Boolean) as string[]

    return Array.from(new Set(values))
  }, [careerById, goalById, selectedFieldLabels, selectedGoal, selectedStage, selectedStyleLabels])

  const finishMutation = useMutation(matchingApi.updatePreferences, {
    onSuccess: async () => {
      queryClient.invalidateQueries(['home-data', true])
      queryClient.invalidateQueries('my-matching-preferences')
      clearSkippedOnboarding()
      await refreshUser()
      navigate('/')
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin onboarding lúc này.'
      setError(message)
    },
  })

  const skipMutation = useMutation(
    async () => {
      try {
        await onboardingApi.skip()
      } catch {
        // Keep the current session usable even if the skip endpoint is unavailable.
      }
    },
    {
      onSuccess: async () => {
        skipOnboardingForSession()
        await refreshUser()
        navigate('/')
      },
      onError: () => {
        skipOnboardingForSession()
        navigate('/')
      },
    }
  )

  const isLoading = categoriesQuery.isLoading || preferencesQuery.isLoading
  const isBusy = finishMutation.isLoading || skipMutation.isLoading

  if (!user) {
    return null
  }

  const toggleField = (fieldId: string) => {
    setSelectedFieldIds((prev) => {
      if (prev.includes(fieldId)) {
        return prev.filter((item) => item !== fieldId)
      }
      if (prev.length + customFieldTags.length >= MAX_FIELDS) {
        return prev
      }
      return [...prev, fieldId]
    })
  }

  const addCustomField = () => {
    const value = customFieldInput.trim().replace(/\s+/g, ' ')
    if (!value) {
      return
    }

    if (
      customFieldTags.some((tag) => tag.toLowerCase() === value.toLowerCase()) ||
      FIELD_OPTIONS.some((option) => option.label.toLowerCase() === value.toLowerCase())
    ) {
      setCustomFieldInput('')
      return
    }

    if (selectedFieldIds.length + customFieldTags.length >= MAX_FIELDS || customFieldTags.length >= MAX_CUSTOM_FIELDS) {
      return
    }

    setCustomFieldTags((prev) => [...prev, value])
    setCustomFieldInput('')
  }

  const removeCustomField = (value: string) => {
    setCustomFieldTags((prev) => prev.filter((tag) => tag !== value))
  }

  const toggleLanguage = (languageId: string) => {
    setSelectedLanguageIds((prev) => {
      if (prev.includes(languageId)) {
        return prev.filter((item) => item !== languageId)
      }
      if (prev.length >= MAX_LANGUAGES) {
        return prev
      }
      return [...prev, languageId]
    })
  }

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((prev) => {
      if (prev.includes(styleId)) {
        return prev.filter((item) => item !== styleId)
      }
      if (prev.length >= MAX_STYLES) {
        return prev
      }
      return [...prev, styleId]
    })
  }

  const validateStep = () => {
    if (currentStep === 0 && !selectedStage) {
      setError('Hãy chọn giai đoạn hiện tại để Mentor X hiểu rõ điểm xuất phát của bạn.')
      return false
    }

    if (currentStep === 1 && !selectedGoal) {
      setError('Hãy chọn mục tiêu chính để hệ thống ưu tiên đúng hướng hỗ trợ.')
      return false
    }

    if (currentStep === 2 && selectedFieldIds.length === 0) {
      if (customFieldTags.length === 0) {
        setError('Hãy chọn hoặc tự thêm ít nhất 1 lĩnh vực bạn muốn tập trung.')
        return false
      }
    }

    if (currentStep === 3 && selectedLanguageIds.length === 0) {
      setError('Hãy chọn ít nhất 1 ngôn ngữ để ưu tiên khi matching.')
      return false
    }

    if (currentStep === 4 && selectedStyleIds.length === 0) {
      setError('Hãy chọn ít nhất 1 phong cách mentor bạn thấy phù hợp.')
      return false
    }

    setError('')
    return true
  }

  const handleContinue = () => {
    if (!validateStep()) {
      return
    }

    if (currentStep === STEP_META.length - 1) {
      finishMutation.mutate({
        interestedDomainIds: resolvedDomainIds,
        preferredSkillIds: [],
        learningGoals: learningGoalsPayload,
        preferredLanguages: selectedLanguageLabels,
        onboardingCompleted: true,
      })
      return
    }

    setCurrentStep((prev) => prev + 1)
  }

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-3">
          {CAREER_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedStage === option.id}
              onClick={() => setSelectedStage(option.id)}
            />
          ))}
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-3">
          {GOAL_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedGoal === option.id}
              onClick={() => setSelectedGoal(option.id)}
            />
          ))}
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#6B7280]">Bạn đã chọn {selectedFieldIds.length + customFieldTags.length}/3 lĩnh vực.</p>
            <p className="text-sm text-[#6B7280]">Bạn có thể chọn sẵn hoặc thêm ngành riêng.</p>
          </div>

          <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FCFCFB] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Không thấy ngành của bạn?</p>
                <p className="mt-1 text-sm text-[#6B7280]">Thêm lĩnh vực riêng như Luật, Y tế, Nhân sự, Giáo dục hoặc ngành khác.</p>
              </div>
              <div className="flex w-full gap-2 sm:max-w-[360px]">
                <input
                  value={customFieldInput}
                  onChange={(event) => setCustomFieldInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomField()
                    }
                  }}
                  maxLength={40}
                  placeholder="Ví dụ: Luật, Y tế..."
                  className="h-11 flex-1 rounded-xl border border-[#E8E8E8] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#FDE6B3]"
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  disabled={selectedFieldIds.length + customFieldTags.length >= MAX_FIELDS}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#E8E8E8] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            </div>

            {customFieldTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {customFieldTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeCustomField(tag)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#F59E0B] bg-[#FFF7ED] px-3 py-1.5 text-sm font-medium text-[#111827]"
                  >
                    <span>{tag}</span>
                    <span className="text-[#D97706]">×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FIELD_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={selectedFieldIds.includes(option.id)}
                onClick={() => toggleField(option.id)}
                multiSelect
              />
            ))}
          </div>
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedLanguageIds.includes(option.id)}
              onClick={() => toggleLanguage(option.id)}
              multiSelect
            />
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {STYLE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={selectedStyleIds.includes(option.id)}
            onClick={() => toggleStyle(option.id)}
            multiSelect
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F7F5] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1080px] xl:grid xl:grid-cols-[minmax(0,760px)_256px] xl:items-start xl:justify-center xl:gap-6">
        <section className="w-full overflow-hidden rounded-[28px] border border-[#E8E8E8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#E8E8E8] px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <BrandMark />
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Mentor X onboarding</p>
                  <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#111827] sm:text-[36px]">
                    Hãy giúp Mentor X hiểu bạn hơn
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">Chỉ mất khoảng 30 giây.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => skipMutation.mutate()}
                disabled={isBusy}
                className="inline-flex rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827] disabled:opacity-60"
              >
                {skipMutation.isLoading ? 'Đang bỏ qua...' : 'Skip'}
              </button>
            </div>

            <p className="mt-5 text-sm text-[#6B7280]">
              Bạn có thể bỏ qua bước này và cập nhật lại sau trong hồ sơ nếu cần.
            </p>

            <div className="mt-6">
              <ProgressRail currentStep={currentStep} />
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#F59E0B]" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-[#111827] sm:text-[32px]">
                    {STEP_META[currentStep].question}
                  </h2>
                  <p className="max-w-[620px] text-sm leading-6 text-[#6B7280]">{STEP_META[currentStep].helper}</p>
                </div>

                <div className="min-h-[320px]">{renderStepContent()}</div>

                <div className="grid gap-3 xl:hidden">
                  <FloatingCard title="Your profile">
                    {summaryRows.map((row) => (
                      <SummaryRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </FloatingCard>

                  <FloatingCard title="Why we ask?">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                        <Users className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                        <span>Recommend mentors phù hợp hơn.</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                        <BookOpen className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                        <span>Gợi ý learning roadmap sát với mục tiêu của bạn.</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                        <Briefcase className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                        <span>Match công việc và cơ hội liên quan hơn.</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#16A34A]" />
                        <span>Bạn có thể đổi lại các lựa chọn này bất kỳ lúc nào.</span>
                      </div>
                    </div>
                  </FloatingCard>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-[#E8E8E8] bg-white/95 px-5 py-4 backdrop-blur sm:px-8 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                disabled={currentStep === 0 || isBusy}
                className="inline-flex items-center gap-2 self-start text-sm font-medium text-[#6B7280] transition hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => skipMutation.mutate()}
                  disabled={isBusy}
                  className="hidden h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827] disabled:opacity-60"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={isBusy}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 text-sm font-semibold text-[#111827] shadow-[0_10px_20px_rgba(245,158,11,0.16)] transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#FBBF24] active:translate-y-0.5 disabled:opacity-60"
                >
                  {finishMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {currentStep === STEP_META.length - 1 ? 'Hoàn tất' : 'Continue'}
                  {!finishMutation.isLoading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden xl:sticky xl:top-8 xl:block xl:space-y-4">
          <FloatingCard title="Your profile">
            {summaryRows.map((row) => (
              <SummaryRow key={row.label} label={row.label} value={row.value} />
            ))}
          </FloatingCard>

          <FloatingCard title="Why we ask?">
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                <Users className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                <span>Recommend mentors phù hợp hơn.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                <BookOpen className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                <span>Recommend learning roadmap dựa trên mục tiêu của bạn.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                <Briefcase className="mt-0.5 h-4 w-4 text-[#F59E0B]" />
                <span>Match các công việc phù hợp hơn khi bạn cần.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#6B7280]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#16A34A]" />
                <span>Your data can be changed anytime.</span>
              </div>
            </div>
          </FloatingCard>
        </aside>
      </div>
    </div>
  )
}
