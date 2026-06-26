import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { matchingApi } from '@/api/matchingApi'
import { Loader2, Save, Sparkles, X, Search, Check } from 'lucide-react'

const LANGUAGE_OPTIONS = ['Vietnamese', 'English', 'Japanese', 'Chinese', 'Korean']

export default function UserPreferenceForm() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [skillSearch, setSkillSearch] = useState('')
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

  const isLoading = categoriesQuery.isLoading || skillsQuery.isLoading || preferencesQuery.isLoading

  const filteredSkills = useMemo(() => {
    if (!skillsQuery.data) return []
    if (!skillSearch.trim()) return skillsQuery.data
    const term = skillSearch.toLowerCase()
    return skillsQuery.data.filter(
      (skill) => skill.labelEn.toLowerCase().includes(term) || skill.labelVi.toLowerCase().includes(term)
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading your preferences...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header Section */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Matching Preferences</h2>
        </div>
        <p className="text-sm text-slate-500">
          We use these preferences to prioritize mentors, jobs, and courses in your recommended feed.
        </p>
      </div>

      <div className="space-y-10">
        
        {/* Domains Section */}
        <div className="space-y-4">
          <div>
            <label className="text-base font-semibold text-slate-900">
              Interested Domains
            </label>
            <p className="text-sm text-slate-500 mt-1">Select the broad areas you want to explore or improve in.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(categoriesQuery.data || []).map((category) => {
              const active = domainIds.includes(category.id)
              return (
                <label
                  key={category.id}
                  className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                      checked={active}
                      onChange={() => toggleDomain(category.id)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${active ? 'text-primary-900' : 'text-slate-700'}`}>
                      {category.name}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-4">
          <div>
            <label className="text-base font-semibold text-slate-900">
              Preferred Skills
            </label>
            <p className="text-sm text-slate-500 mt-1">Pinpoint specific tools, frameworks, or methodologies.</p>
          </div>
          
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search for skills..."
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => {
                  const active = skillIds.includes(skill.id)
                  return (
                    <label
                      key={skill.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        active
                          ? 'bg-primary-100/50 text-primary-900'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      } border border-slate-200`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                        checked={active}
                        onChange={() => toggleSkill(skill.id)}
                      />
                      <span className="text-sm font-medium line-clamp-1 flex-1">
                        {skill.labelEn}
                      </span>
                    </label>
                  )
                })
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-slate-500">
                  No skills found matching "{skillSearch}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-4">
          <div>
            <label className="text-base font-semibold text-slate-900">Learning Goals</label>
            <p className="text-sm text-slate-500 mt-1">What exactly are you trying to achieve?</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
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
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. Improve interview readiness"
              />
            </div>
            <button
              type="button"
              onClick={addLearningGoal}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Add Goal
            </button>
          </div>
          
          {learningGoals.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 p-3 shadow-sm">
                  <span className="text-sm font-medium text-slate-700">{goal}</span>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    onClick={() => setLearningGoals((prev) => prev.filter((item) => item !== goal))}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages Section */}
        <div className="space-y-4">
          <div>
            <label className="text-base font-semibold text-slate-900">Preferred Languages</label>
            <p className="text-sm text-slate-500 mt-1">Which languages are you most comfortable communicating in?</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {LANGUAGE_OPTIONS.map((language) => {
              const active = preferredLanguages.includes(language)
              return (
                <label
                  key={language}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                    checked={active}
                    onChange={() => toggleLanguage(language)}
                  />
                  <span className="text-sm font-medium text-slate-700">{language}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-start gap-3">
          <X className="h-5 w-5 text-rose-600 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end border-t border-slate-200 pt-6">
        <button
          type="button"
          disabled={updateMutation.isLoading}
          onClick={savePreferences}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 disabled:opacity-60 transition-colors w-full sm:w-auto"
        >
          {updateMutation.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Save preferences
        </button>
      </div>
    </div>
  )
}
