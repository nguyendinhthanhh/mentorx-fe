import { Check, Rocket, TrendingUp, Code, GraduationCap, Users, DollarSign, Sparkles, Target } from 'lucide-react'

interface Props {
  roleChoice: string
  selectedGoals: string[]
  setSelectedGoals: (v: string[]) => void
  customGoal: string
  setCustomGoal: (v: string) => void
}

const learnerGoals = [
  { id: 'career_switch', label: 'Career Switch to Tech', icon: Rocket },
  { id: 'skill_up', label: 'Skill Up for Promotion', icon: TrendingUp },
  { id: 'build_project', label: 'Build a Side Project', icon: Code },
  { id: 'interview_prep', label: 'Interview Preparation', icon: GraduationCap },
  { id: 'grow_network', label: 'Grow Professional Network', icon: Users },
]

const mentorGoals = [
  { id: 'earn_income', label: 'Earn Income as Mentor', icon: DollarSign },
  { id: 'give_back', label: 'Give Back to Community', icon: Users },
  { id: 'build_brand', label: 'Build Personal Brand', icon: TrendingUp },
  { id: 'grow_network', label: 'Grow Professional Network', icon: Users },
  { id: 'sharpen_skills', label: 'Sharpen My Skills by Teaching', icon: Target },
]

export default function StepGoals({ roleChoice, selectedGoals, setSelectedGoals, customGoal, setCustomGoal }: Props) {
  const goals = roleChoice === 'MENTOR' ? mentorGoals : learnerGoals

  const toggleGoal = (label: string) => {
    if (selectedGoals.includes(label)) {
      setSelectedGoals(selectedGoals.filter(g => g !== label))
    } else {
      setSelectedGoals([...selectedGoals, label])
    }
  }

  return (
    <div className="onb-fade-in-up space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 5 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          {roleChoice === 'MENTOR' ? 'Your Mentoring Goals' : 'Your Learning Goals'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          {roleChoice === 'MENTOR' 
            ? 'What motivates you to mentor? Select all that apply.'
            : 'What are you hoping to achieve? Select all that apply.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {goals.map((goal, i) => {
          const selected = selectedGoals.includes(goal.label)
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.label)}
              className={`onb-fade-in-up onb-stagger-${Math.min(i + 1, 6)} flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border-2 ${
                selected
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <goal.icon className="w-5 h-5 flex-shrink-0 opacity-70" />
              <span className="font-semibold text-sm flex-1">{goal.label}</span>
              {selected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
          Other Goals <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <textarea
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all outline-none text-gray-900 dark:text-white resize-none text-sm placeholder:text-gray-400"
          placeholder="Describe any other goals you have..."
          rows={2}
          value={customGoal}
          onChange={e => setCustomGoal(e.target.value)}
        />
      </div>

      {selectedGoals.length === 0 && !customGoal && (
        <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 rounded-xl">
          <p className="text-sm text-sky-700 dark:text-sky-400">
            💡 Select at least one goal to help us tailor your experience.
          </p>
        </div>
      )}
    </div>
  )
}
