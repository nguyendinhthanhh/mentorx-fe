import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Loader2, Sparkles, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { matchingApi } from '@/api/matchingApi'
import { onboardingApi } from '@/api/onboardingApi'

const LANGUAGE_OPTIONS = ['Vietnamese', 'English', 'Japanese', 'Chinese', 'Korean']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshUser, skipOnboardingForSession, clearSkippedOnboarding } = useAuthStore()
  const [error, setError] = useState('')
  const [domainIds, setDomainIds] = useState<number[]>([])
  const [skillIds, setSkillIds] = useState<number[]>([])
  const [learningGoals, setLearningGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])

  const categoriesQuery = useQuery('onboarding-categories', categoryApi.getAllActive)
  const skillsQuery = useQuery('onboarding-skills', skillApi.getAllActive)

  const filteredSkills = useMemo(() => {
    if (!skillsQuery.data) return []
    if (!categoriesQuery.data || domainIds.length === 0) return skillsQuery.data
    const selectedDomainNames = new Set(
      categoriesQuery.data
        .filter((item) => domainIds.includes(item.id))
        .map((item) => item.name.toLowerCase())
    )
    return skillsQuery.data.filter((skill) => {
      const label = `${skill.labelEn} ${skill.labelVi}`.toLowerCase()
      for (const domainName of selectedDomainNames) {
        if (label.includes(domainName)) return true
      }
      return false
    })
  }, [skillsQuery.data, categoriesQuery.data, domainIds])

  const finishMutation = useMutation(matchingApi.updatePreferences, {
    onSuccess: async () => {
      queryClient.invalidateQueries(['home-data', true])
      queryClient.invalidateQueries('my-matching-preferences')
      clearSkippedOnboarding()
      await refreshUser()
      navigate('/')
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Could not save onboarding preferences.'
      setError(message)
    },
  })

  const skipMutation = useMutation(
    async () => {
      try {
        await onboardingApi.skip()
      } catch {
        // Fallback if onboarding skip endpoint is unavailable in this environment.
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

  const isLoading = categoriesQuery.isLoading || skillsQuery.isLoading

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

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

  const addGoal = () => {
    const value = goalInput.trim()
    if (!value) return
    if (learningGoals.includes(value)) {
      setGoalInput('')
      return
    }
    setLearningGoals((prev) => [...prev, value].slice(0, 12))
    setGoalInput('')
  }

  const handleContinue = () => {
    setError('')
    finishMutation.mutate({
      interestedDomainIds: domainIds,
      preferredSkillIds: skillIds,
      learningGoals,
      preferredLanguages,
      onboardingCompleted: true,
    })
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Mentor X onboarding
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Set your interests (optional)
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">
                Pick domains and skills to improve recommendations. You can skip now and update later in Profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => skipMutation.mutate()}
              disabled={skipMutation.isLoading || finishMutation.isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {skipMutation.isLoading ? 'Skipping...' : 'Skip for now'}
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Interested domains</h2>
                <div className="flex flex-wrap gap-2">
                  {(categoriesQuery.data || []).map((category) => {
                    const active = domainIds.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleDomain(category.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Preferred skills</h2>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap gap-2">
                    {(filteredSkills || []).map((skill) => {
                      const active = skillIds.includes(skill.id)
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-indigo-500 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          {skill.labelEn}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Learning goals</h2>
                <div className="flex gap-2">
                  <input
                    value={goalInput}
                    onChange={(event) => setGoalInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addGoal()
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="e.g. Improve interview readiness"
                  />
                  <button
                    type="button"
                    onClick={addGoal}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {learningGoals.map((goal) => (
                    <span
                      key={goal}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      {goal}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-rose-500"
                        onClick={() => setLearningGoals((prev) => prev.filter((item) => item !== goal))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Preferred languages</h2>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((language) => {
                    const active = preferredLanguages.includes(language)
                    return (
                      <button
                        key={language}
                        type="button"
                        onClick={() => toggleLanguage(language)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {language}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => skipMutation.mutate()}
              disabled={skipMutation.isLoading || finishMutation.isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={finishMutation.isLoading || skipMutation.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {finishMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
