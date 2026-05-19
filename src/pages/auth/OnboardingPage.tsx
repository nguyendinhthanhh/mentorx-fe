import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { onboardingApi } from '@/api/onboardingApi'
import { useAuthStore } from '@/store/authStore'
import {
  Check, Loader2, Sparkles, User, Zap, Target, Briefcase,
  ArrowRight, ArrowLeft, AlertCircle, Bell, Heart, SkipForward
} from 'lucide-react'

import StepRole from '@/components/onboarding/StepRole'
import StepExpertise from '@/components/onboarding/StepExpertise'
import StepSkills from '@/components/onboarding/StepSkills'
import StepPreferences from '@/components/onboarding/StepPreferences'
import StepGoals from '@/components/onboarding/StepGoals'
import StepProfile from '@/components/onboarding/StepProfile'
import { SupportedLanguage } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5 | 6

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [animKey, setAnimKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  // Step 1: Role
  const [roleChoice, setRoleChoice] = useState('')

  // Step 2: Expertise
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedSkills, setSelectedSkills] = useState<{skillId: number; name: string; level: string}[]>([])

  // Step 3: Skills (handled in step 2 UI but submitted as separate step)

  // Step 4: Preferences
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true
  })

  // Step 5: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')

  // Step 6: Profile
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    avatarUrl: user?.avatarUrl || '',
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    countryCode: user?.countryCode || 'VN',
    preferredLanguage: user?.preferredLanguage || SupportedLanguage.VI
  })

  const { data: progressData, isLoading: isProgressLoading } = useQuery(
    'onboarding-progress',
    () => onboardingApi.getProgress(),
    {
      onSuccess: (data) => {
        if (data?.onboarded) {
          navigate('/')
        } else if (data?.currentStep) {
          const stepMap: Record<string, Step> = {
            'ROLE': 1,
            'INTERESTS': 2,
            'SKILLS': 3,
            'PREFERENCES': 4,
            'GOALS': 5,
            'PROFILE': 6
          }
          const stepNum = stepMap[data.currentStep]
          if (stepNum) {
            setCurrentStep(stepNum)
            setAnimKey(p => p + 1)
          }
        }
      }
    }
  )

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])

  useEffect(() => {
    if (error) {
      setShowError(true)
      const t = setTimeout(() => { setShowError(false); setTimeout(() => setError(null), 300) }, 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  const { data: categories = [] } = useQuery('active-categories', () => categoryApi.getAllActive())
  const { data: allSkills = [] } = useQuery('active-skills', () => skillApi.getAllActive())

  // Submit the current step to backend, then advance
  const stepMutation = useMutation(
    async (step: Step) => {
      switch (step) {
        case 1:
          await onboardingApi.submitRole(roleChoice)
          break
        case 2:
          await onboardingApi.submitInterests(selectedCategoryIds)
          break
        case 3:
          await onboardingApi.submitSkills(
            selectedSkills.map(s => ({ skillId: s.skillId, level: s.level }))
          )
          break
        case 4:
          await onboardingApi.submitPreferences(preferences)
          break
        case 5: {
          const goals = [...selectedGoals]
          if (customGoal.trim()) goals.push(customGoal.trim())
          await onboardingApi.submitGoals(goals.length > 0 ? goals : ['Explore MentorX'])
          break
        }
        case 6:
          await onboardingApi.submitProfile({
            displayName: profileData.displayName,
            avatarUrl: profileData.avatarUrl || undefined
          })
          // Finalize
          await onboardingApi.complete()
          break
      }
    },
    {
      onSuccess: async (_data, step) => {
        if (step === 6) {
          await refreshUser()
          navigate('/')
        } else {
          changeStep((step + 1) as Step)
        }
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || err?.message || 'Something went wrong')
      }
    }
  )

  const changeStep = useCallback((s: Step) => {
    setAnimKey(p => p + 1)
    setCurrentStep(s)
  }, [])

  const handleNext = () => stepMutation.mutate(currentStep)
  const handleBack = () => { if (currentStep > 1) changeStep((currentStep - 1) as Step) }

  const handleSkip = useMutation(
    () => onboardingApi.skip(),
    {
      onSuccess: async () => {
        await refreshUser()
        navigate('/')
      },
      onError: (err: any) => setError(err?.response?.data?.message || 'Skip failed')
    }
  )

  if (!user || isProgressLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">Initializing...</p>
        </div>
      </div>
    )
  }

  // Validation per step
  const isNextDisabled =
    (currentStep === 1 && !roleChoice) ||
    (currentStep === 2 && selectedCategoryIds.length === 0) ||
    (currentStep === 4 && !preferences.emailEnabled && !preferences.pushEnabled && !preferences.inAppEnabled) ||
    (currentStep === 6 && !profileData.displayName.trim()) ||
    stepMutation.isLoading

  const validationMessages: Record<number, string> = {
    1: !roleChoice ? 'Please select your role' : '',
    2: selectedCategoryIds.length === 0 ? 'Select at least 1 field' : '',
    3: '', // Skills are optional
    4: (!preferences.emailEnabled && !preferences.pushEnabled && !preferences.inAppEnabled) ? 'Enable at least 1 notification' : '',
    5: '', // Goals optional
    6: !profileData.displayName.trim() ? 'Display name is required' : '',
  }
  const validationMsg = validationMessages[currentStep] || ''

  const steps = [
    { id: 1, label: 'Role', icon: Target },
    { id: 2, label: 'Interests', icon: Heart },
    { id: 3, label: 'Skills', icon: Zap },
    { id: 4, label: 'Prefs', icon: Bell },
    { id: 5, label: 'Goals', icon: Briefcase },
    { id: 6, label: 'Profile', icon: User },
  ]

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-start md:justify-center p-4 md:p-8 relative overflow-hidden">
      {/* BG decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Error Toast */}
      {error && (
        <div className={`fixed top-6 right-6 z-50 max-w-md transition-all duration-300 ${showError ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          <div className="bg-red-50 dark:bg-red-950/80 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Error</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
            <button onClick={() => { setShowError(false); setTimeout(() => setError(null), 300) }} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl rotate-3 onb-float">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">MentorX</h1>
          </div>

          {/* Step dots */}
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between mb-3">
              {steps.map(s => (
                <button
                  key={s.id}
                  onClick={() => { if (s.id < currentStep) changeStep(s.id as Step) }}
                  disabled={s.id >= currentStep}
                  className="flex flex-col items-center gap-1.5 flex-1 group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    currentStep === s.id
                      ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30 scale-110 shadow-lg'
                      : currentStep > s.id
                      ? 'bg-emerald-500 text-white shadow-md cursor-pointer group-hover:scale-105'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {currentStep > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] font-bold hidden md:block ${currentStep >= s.id ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="onb-glass rounded-2xl md:rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/20 border border-white/60 dark:border-gray-800/60 p-6 md:p-10 min-h-[480px] md:min-h-[520px] flex flex-col">
          <div className="flex-1" key={animKey}>
            {currentStep === 1 && <StepRole roleChoice={roleChoice} setRoleChoice={setRoleChoice} />}
            {currentStep === 2 && (
              <StepExpertise
                categories={categories}
                selectedCategoryIds={selectedCategoryIds} setSelectedCategoryIds={setSelectedCategoryIds}
              />
            )}
            {currentStep === 3 && (
              <StepSkills
                roleChoice={roleChoice}
                allSkills={allSkills}
                selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills}
              />
            )}
            {currentStep === 4 && <StepPreferences preferences={preferences} setPreferences={setPreferences} />}
            {currentStep === 5 && (
              <StepGoals
                roleChoice={roleChoice}
                selectedGoals={selectedGoals} setSelectedGoals={setSelectedGoals}
                customGoal={customGoal} setCustomGoal={setCustomGoal}
              />
            )}
            {currentStep === 6 && <StepProfile profileData={profileData} setProfileData={setProfileData} userName={user.fullName} />}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-gray-200/60 dark:border-gray-800/60">
            {validationMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{validationMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3">
                {/* Skip button */}
                {currentStep <= 3 && (
                  <button
                    onClick={() => handleSkip.mutate()}
                    disabled={handleSkip.isLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> Skip all
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:shadow-xl hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none transition-all duration-200"
                >
                  {stepMutation.isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : currentStep === 6 ? (
                    <><Sparkles className="w-4 h-4" /> Complete Setup</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          You can update your preferences anytime from your profile settings
        </p>
      </div>
    </div>
  )
}
