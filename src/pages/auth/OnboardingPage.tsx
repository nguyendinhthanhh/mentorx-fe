import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nProvider'
import { TranslationKey } from '@/i18n/translations'
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
  HeartPulse,
  Languages,
  LayoutPanelTop,
  Loader2,
  MessageSquare,
  Palette,
  Rocket,
  Scale,
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
    id: 'stage',
    stepLabelKey: 'onboarding.step.stage.label',
    progressLabelKey: 'onboarding.step.stage.progress',
    questionKey: 'onboarding.step.stage.question',
    helperKey: 'onboarding.step.stage.helper',
  },
  {
    id: 'goal',
    stepLabelKey: 'onboarding.step.goal.label',
    progressLabelKey: 'onboarding.step.goal.progress',
    questionKey: 'onboarding.step.goal.question',
    helperKey: 'onboarding.step.goal.helper',
  },
  {
    id: 'fields',
    stepLabelKey: 'onboarding.step.fields.label',
    progressLabelKey: 'onboarding.step.fields.progress',
    questionKey: 'onboarding.step.fields.question',
    helperKey: 'onboarding.step.fields.helper',
  },
  {
    id: 'languages',
    stepLabelKey: 'onboarding.step.languages.label',
    progressLabelKey: 'onboarding.step.languages.progress',
    questionKey: 'onboarding.step.languages.question',
    helperKey: 'onboarding.step.languages.helper',
  },
  {
    id: 'style',
    stepLabelKey: 'onboarding.step.style.label',
    progressLabelKey: 'onboarding.step.style.progress',
    questionKey: 'onboarding.step.style.question',
    helperKey: 'onboarding.step.style.helper',
  },
] as const

const CAREER_OPTIONS: any[] = [
  { id: 'student', labelKey: 'onboarding.career.student', descriptionKey: 'onboarding.career.student.desc', icon: GraduationCap },
  { id: 'intern', labelKey: 'onboarding.career.intern', descriptionKey: 'onboarding.career.intern.desc', icon: Rocket },
  { id: 'new-grad', labelKey: 'onboarding.career.newGrad', descriptionKey: 'onboarding.career.newGrad.desc', icon: Search },
  { id: 'junior', labelKey: 'onboarding.career.junior', descriptionKey: 'onboarding.career.junior.desc', icon: Briefcase },
  { id: 'mid-level', labelKey: 'onboarding.career.midLevel', descriptionKey: 'onboarding.career.midLevel.desc', icon: TrendingUp },
  { id: 'senior', labelKey: 'onboarding.career.senior', descriptionKey: 'onboarding.career.senior.desc', icon: Users },
  { id: 'career-switch', labelKey: 'onboarding.career.careerSwitch', descriptionKey: 'onboarding.career.careerSwitch.desc', icon: Target },
]

const GOAL_OPTIONS: any[] = [
  { id: 'find-mentor', labelKey: 'onboarding.goal.findMentor', descriptionKey: 'onboarding.goal.findMentor.desc', icon: Users },
  { id: 'improve-skills', labelKey: 'onboarding.goal.improveSkills', descriptionKey: 'onboarding.goal.improveSkills.desc', icon: BookOpen },
  { id: 'interview', labelKey: 'onboarding.goal.interview', descriptionKey: 'onboarding.goal.interview.desc', icon: Rocket },
  { id: 'career-planning', labelKey: 'onboarding.goal.careerPlanning', descriptionKey: 'onboarding.goal.careerPlanning.desc', icon: Target },
  { id: 'find-jobs', labelKey: 'onboarding.goal.findJobs', descriptionKey: 'onboarding.goal.findJobs.desc', icon: Briefcase },
  { id: 'build-portfolio', labelKey: 'onboarding.goal.buildPortfolio', descriptionKey: 'onboarding.goal.buildPortfolio.desc', icon: LayoutPanelTop },
]

const FIELD_OPTIONS: any[] = [
  { id: 'frontend', labelKey: 'onboarding.field.frontend', descriptionKey: 'onboarding.field.frontend.desc', icon: LayoutPanelTop, categorySlug: 'software-dev' },
  { id: 'backend', labelKey: 'onboarding.field.backend', descriptionKey: 'onboarding.field.backend.desc', icon: Code2, categorySlug: 'software-dev' },
  { id: 'mobile', labelKey: 'onboarding.field.mobile', descriptionKey: 'onboarding.field.mobile.desc', icon: Smartphone, categorySlug: 'software-dev' },
  { id: 'ai', labelKey: 'onboarding.field.ai', descriptionKey: 'onboarding.field.ai.desc', icon: Brain, categorySlug: 'data-ai' },
  { id: 'data', labelKey: 'onboarding.field.data', descriptionKey: 'onboarding.field.data.desc', icon: Database, categorySlug: 'data-ai' },
  { id: 'ui-ux', labelKey: 'onboarding.field.uiux', descriptionKey: 'onboarding.field.uiux.desc', icon: Palette, categorySlug: 'design' },
  { id: 'product', labelKey: 'onboarding.field.product', descriptionKey: 'onboarding.field.product.desc', icon: Target, categorySlug: 'business-finance' },
  { id: 'business', labelKey: 'onboarding.field.business', descriptionKey: 'onboarding.field.business.desc', icon: Briefcase, categorySlug: 'business-finance' },
  { id: 'marketing', labelKey: 'onboarding.field.marketing', descriptionKey: 'onboarding.field.marketing.desc', icon: TrendingUp, categorySlug: 'business-finance' },
  { id: 'sales', labelKey: 'onboarding.field.sales', descriptionKey: 'onboarding.field.sales.desc', icon: TrendingUp, categorySlug: 'business-finance' },
  { id: 'finance', labelKey: 'onboarding.field.finance', descriptionKey: 'onboarding.field.finance.desc', icon: Briefcase, categorySlug: 'business-finance' },
  { id: 'operations', labelKey: 'onboarding.field.operations', descriptionKey: 'onboarding.field.operations.desc', icon: Settings2, categorySlug: 'business-finance' },
  { id: 'hr', labelKey: 'onboarding.field.hr', descriptionKey: 'onboarding.field.hr.desc', icon: Users, categorySlug: 'business-finance' },
  { id: 'education', labelKey: 'onboarding.field.education', descriptionKey: 'onboarding.field.education.desc', icon: BookOpen },
  { id: 'law', labelKey: 'onboarding.field.law', descriptionKey: 'onboarding.field.law.desc', icon: Scale },
  { id: 'healthcare', labelKey: 'onboarding.field.healthcare', descriptionKey: 'onboarding.field.healthcare.desc', icon: HeartPulse },
  { id: 'cyber-security', labelKey: 'onboarding.field.cyber', descriptionKey: 'onboarding.field.cyber.desc', icon: ShieldCheck, categorySlug: 'software-dev' },
  { id: 'cloud', labelKey: 'onboarding.field.cloud', descriptionKey: 'onboarding.field.cloud.desc', icon: Cloud, categorySlug: 'software-dev' },
  { id: 'devops', labelKey: 'onboarding.field.devops', descriptionKey: 'onboarding.field.devops.desc', icon: Settings2, categorySlug: 'software-dev' },
]

const LANGUAGE_OPTIONS: any[] = [
  { id: 'vi', labelKey: 'onboarding.lang.vi', descriptionKey: 'onboarding.lang.vi.desc', icon: Languages },
  { id: 'en', labelKey: 'onboarding.lang.en', descriptionKey: 'onboarding.lang.en.desc', icon: Languages },
  { id: 'ja', labelKey: 'onboarding.lang.ja', descriptionKey: 'onboarding.lang.ja.desc', icon: Languages },
]

const STYLE_OPTIONS: any[] = [
  { id: 'friendly', labelKey: 'onboarding.style.friendly', descriptionKey: 'onboarding.style.friendly.desc', icon: Sparkles },
  { id: 'direct', labelKey: 'onboarding.style.direct', descriptionKey: 'onboarding.style.direct.desc', icon: ArrowRight },
  { id: 'detailed', labelKey: 'onboarding.style.detailed', descriptionKey: 'onboarding.style.detailed.desc', icon: BookOpen },
  { id: 'practical', labelKey: 'onboarding.style.practical', descriptionKey: 'onboarding.style.practical.desc', icon: CheckCircle2 },
  { id: 'flexible', labelKey: 'onboarding.style.flexible', descriptionKey: 'onboarding.style.flexible.desc', icon: MessageSquare },
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
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#059669] text-white shadow-[0_8px_18px_rgba(5,150,105,0.12)]">
      <Sparkles className="h-5 w-5" />
    </div>
  )
}

function ProgressRail({
  currentStep,
}: {
  currentStep: number
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {STEP_META.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={`h-3.5 w-3.5 rounded-full border transition-all duration-200 ${
                index < currentStep
                  ? 'border-[#059669] bg-[#059669]'
                  : index === currentStep
                  ? 'border-[#059669] bg-white ring-4 ring-[#a7f3d0]'
                  : 'border-[#D6D3D1] bg-white'
              }`}
            />
            {index < STEP_META.length - 1 ? (
              <div
                className={`h-px flex-1 transition-all duration-200 ${
                  index < currentStep ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
                }`}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t(STEP_META[currentStep].stepLabelKey as TranslationKey)}</p>
          <p className="mt-1 text-sm text-slate-500">{t(STEP_META[currentStep].progressLabelKey as TranslationKey)}</p>
        </div>
        <p className="text-sm text-slate-500">Khoảng 30 giây</p>
      </div>
    </div>
  )
}

function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: SelectOption
  selected: boolean
  onClick: () => void
}) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group w-full rounded-2xl border px-4 py-2 text-left transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]/40 focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] ${
        selected
          ? 'border-[#059669] bg-[#ecfdf5] shadow-[0_12px_24px_rgba(5,150,105,0.10)]'
          : 'border-[#E8E8E8] bg-white hover:bg-[#FAFAFA]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            selected ? 'bg-[#a7f3d0] text-[#047857]' : 'bg-[#F7F7F5] text-slate-500'
          }`}
        >
          <option.icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{option.label}</p>
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-500">{option.description}</p>
        </div>

        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? 'border-[#059669] bg-[#059669] text-slate-900' : 'border-[#D1D5DB] bg-white text-transparent'
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
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

export default function OnboardingPage() {

  const { t } = useI18n()

  const careerOptionsMapped = CAREER_OPTIONS.map((opt: any) => ({ ...opt, label: t(opt.labelKey as TranslationKey), description: t(opt.descriptionKey as TranslationKey) }))
  const goalOptionsMapped = GOAL_OPTIONS.map((opt: any) => ({ ...opt, label: t(opt.labelKey as TranslationKey), description: t(opt.descriptionKey as TranslationKey) }))
  const fieldOptionsMapped = FIELD_OPTIONS.map((opt: any) => ({ ...opt, label: t(opt.labelKey as TranslationKey), description: t(opt.descriptionKey as TranslationKey) }))
  const languageOptionsMapped = LANGUAGE_OPTIONS.map((opt: any) => ({ ...opt, label: t(opt.labelKey as TranslationKey), description: t(opt.descriptionKey as TranslationKey) }))
  const styleOptionsMapped = STYLE_OPTIONS.map((opt: any) => ({ ...opt, label: t(opt.labelKey as TranslationKey), description: t(opt.descriptionKey as TranslationKey) }))
  
  const careerMap = buildOptionMap(careerOptionsMapped)
  const goalMap = buildOptionMap(goalOptionsMapped)
  const fieldMap = buildOptionMap(fieldOptionsMapped)
  const languageMap = buildOptionMap(languageOptionsMapped)
  const styleMap = buildOptionMap(styleOptionsMapped)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshUser, clearSkippedOnboarding } = useAuthStore()

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
    const knownFieldLabels = new Set(fieldOptionsMapped.map((option) => option.label))
    const knownCareerLabels = new Set(careerOptionsMapped.map((option) => option.label))
    const knownGoalLabels = new Set(goalOptionsMapped.map((option) => option.label))
    const knownStyleLabels = new Set(styleOptionsMapped.map((option) => option.label))
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

  const isLoading = categoriesQuery.isLoading || preferencesQuery.isLoading
  const isBusy = finishMutation.isLoading

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

    if (customFieldTags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setCustomFieldInput('')
      return
    }

    const existingOption = fieldOptionsMapped.find((option) => option.label.toLowerCase() === value.toLowerCase())
    if (existingOption) {
      if (!selectedFieldIds.includes(existingOption.id)) {
        toggleField(existingOption.id)
      }
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
      setError(t("onboarding.error.stage"))
      return false
    }

    if (currentStep === 1 && !selectedGoal) {
      setError(t("onboarding.error.goal"))
      return false
    }

    if (currentStep === 2 && selectedFieldIds.length === 0) {
      if (customFieldTags.length === 0) {
        setError(t("onboarding.error.fields"))
        return false
      }
    }

    if (currentStep === 3 && selectedLanguageIds.length === 0) {
      setError(t("onboarding.error.languages"))
      return false
    }

    if (currentStep === 4 && selectedStyleIds.length === 0) {
      setError(t("onboarding.error.styles"))
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
        <div className="space-y-2">
          {careerOptionsMapped.map((option) => (
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
        <div className="space-y-2">
          {goalOptionsMapped.map((option) => (
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
            <p className="text-sm text-slate-500">Bạn đã chọn {selectedFieldIds.length + customFieldTags.length}/3 lĩnh vực.</p>
            <p className="text-sm text-slate-500">Bạn có thể chọn sẵn hoặc thêm ngành riêng.</p>
          </div>

          <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FCFCFB] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("onboarding.step.fields.customTitle")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("onboarding.step.fields.customHelper")}</p>
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
                  placeholder={t("onboarding.step.fields.placeholder")}
                  className="h-10 flex-1 rounded-xl border border-[#E8E8E8] bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#059669] focus:ring-2 focus:ring-[#a7f3d0]"
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  disabled={selectedFieldIds.length + customFieldTags.length >= MAX_FIELDS}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E8E8] bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="inline-flex items-center gap-2 rounded-full border border-[#059669] bg-[#ecfdf5] px-3 py-1.5 text-sm font-medium text-slate-900"
                  >
                    <span>{tag}</span>
                    <span className="text-[#047857]">×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fieldOptionsMapped.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={selectedFieldIds.includes(option.id)}
                onClick={() => toggleField(option.id)}
              />
            ))}
          </div>
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-2">
          {languageOptionsMapped.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedLanguageIds.includes(option.id)}
              onClick={() => toggleLanguage(option.id)}
            />
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {styleOptionsMapped.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={selectedStyleIds.includes(option.id)}
            onClick={() => toggleStyle(option.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F7F5] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1080px] xl:grid xl:grid-cols-[minmax(0,760px)_256px] xl:items-start xl:justify-center xl:gap-6">
        <section className="w-full overflow-hidden rounded-[28px] border border-[#E8E8E8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#E8E8E8] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <BrandMark />
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">{t("onboarding.profile")}</p>
                  <h1 className="mt-2 text-[24px] font-bold text-slate-900 sm:text-[28px]">{t("onboarding.title")}</h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{t("onboarding.subtitle")}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ProgressRail currentStep={currentStep} />
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5">
            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#059669]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-[22px] font-bold text-slate-900 sm:text-[26px]">
                    {t(STEP_META[currentStep].questionKey as TranslationKey)}
                  </h2>
                  <p className="max-w-[620px] text-sm leading-6 text-slate-500">{t(STEP_META[currentStep].helperKey as TranslationKey)}</p>
                </div>

                <div className="min-h-[320px]">{renderStepContent()}</div>

                <div className="grid gap-3 xl:hidden">
                  <FloatingCard title={t("onboarding.profile")}>
                    {summaryRows.map((row) => (
                      <SummaryRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </FloatingCard>

                  <FloatingCard title={t("onboarding.whyAsk")}>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 text-sm text-slate-500">
                        <Users className="mt-0.5 h-4 w-4 text-[#059669]" />
                        <span>{t("onboarding.whyAsk.reason1")}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-500">
                        <BookOpen className="mt-0.5 h-4 w-4 text-[#059669]" />
                        <span>{t("onboarding.whyAsk.reason2")}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-500">
                        <Briefcase className="mt-0.5 h-4 w-4 text-[#059669]" />
                        <span>{t("onboarding.whyAsk.reason3")}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-500">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#16A34A]" />
                        <span>{t("onboarding.whyAsk.reason4")}</span>
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
                className="inline-flex items-center gap-2 self-start text-sm font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={isBusy}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(5,150,105,0.16)] transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#047857] active:translate-y-0.5 disabled:opacity-60"
                >
                  {finishMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {currentStep === STEP_META.length - 1 ? t("onboarding.finish") : t("onboarding.continue")}
                  {!finishMutation.isLoading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden xl:sticky xl:top-8 xl:block xl:space-y-4">
          <FloatingCard title={t("onboarding.profile")}>
            {summaryRows.map((row) => (
              <SummaryRow key={row.label} label={row.label} value={row.value} />
            ))}
          </FloatingCard>

          <FloatingCard title={t("onboarding.whyAsk")}>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <Users className="mt-0.5 h-4 w-4 text-[#059669]" />
                <span>{t("onboarding.whyAsk.reason1")}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <BookOpen className="mt-0.5 h-4 w-4 text-[#059669]" />
                <span>{t("onboarding.whyAsk.reason2")}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <Briefcase className="mt-0.5 h-4 w-4 text-[#059669]" />
                <span>{t("onboarding.whyAsk.reason3")}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#16A34A]" />
                <span>{t("onboarding.whyAsk.reason4")}</span>
              </div>
            </div>
          </FloatingCard>
        </aside>
      </div>
    </div>
  )
}
