import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { matchingApi } from '@/api/matchingApi'
import { Loader2, Save, Sparkles, X } from 'lucide-react'

const LANGUAGE_OPTIONS = ['Vietnamese', 'English', 'Japanese', 'Chinese', 'Korean']

export default function UserPreferenceForm() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [domainIds, setDomainIds] = useState<number[]>([])
  const [skillIds, setSkillIds] = useState<number[]>([])
  const [learningGoals, setLearningGoals] = useState<string[]>([])
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])

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
      setError('Could not load your interests right now.')
    },
  })

  const updateMutation = useMutation(matchingApi.updatePreferences, {
    onSuccess: (data) => {
      setDomainIds(data.interestedDomainIds || [])
      setSkillIds(data.preferredSkillIds || [])
      setLearningGoals(data.learningGoals || [])
      setPreferredLanguages(data.preferredLanguages || [])
      setError('')
      queryClient.invalidateQueries(['home-data', true])
      queryClient.invalidateQueries('my-matching-preferences')
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Could not save preferences.'
      setError(message)
    },
  })

  const selectedDomainsCount = domainIds.length
  const selectedSkillsCount = skillIds.length
  const isLoading = categoriesQuery.isLoading || skillsQuery.isLoading || preferencesQuery.isLoading

  const filteredSkills = useMemo(() => {
    if (!skillsQuery.data || !categoriesQuery.data || domainIds.length === 0) {
      return skillsQuery.data || []
    }
    const categoryLookup = new Map(categoriesQuery.data.map((item) => [item.id, item.name.toLowerCase()]))
    const selectedDomainNames = domainIds
      .map((id) => categoryLookup.get(id))
      .filter(Boolean) as string[]

    return skillsQuery.data.filter((skill) => {
      const label = `${skill.labelEn} ${skill.labelVi}`.toLowerCase()
      return selectedDomainNames.some((domain) => label.includes(domain))
    })
  }, [skillsQuery.data, categoriesQuery.data, domainIds])

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
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-bold text-indigo-900">Personalized matching preferences</p>
            <p className="mt-1 text-xs text-indigo-700">
              We use your selected domains and skills to prioritize mentors, jobs, and courses in your recommended feed.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Interested domains ({selectedDomainsCount})</h3>
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
        <h3 className="text-sm font-bold text-slate-900">Preferred skills ({selectedSkillsCount})</h3>
        <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
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
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Learning goals</h3>
        <div className="flex gap-2">
          <input
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addLearningGoal()
              }
            }}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            placeholder="Add a goal (e.g. Improve interview readiness)"
          />
          <button
            type="button"
            onClick={addLearningGoal}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {learningGoals.map((goal) => (
            <span key={goal} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
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
        <h3 className="text-sm font-bold text-slate-900">Preferred languages</h3>
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

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={updateMutation.isLoading}
          onClick={savePreferences}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {updateMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save preferences
        </button>
      </div>
    </div>
  )
}
