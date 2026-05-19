import { Check, GraduationCap, Rocket, Sparkles } from 'lucide-react'

interface Props {
  roleChoice: string
  setRoleChoice: (v: string) => void
}

const roles = [
  { id: 'CLIENT', title: 'I want to learn', desc: 'Find mentors & accelerate your growth', icon: GraduationCap, gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-950/30', ring: 'ring-sky-500' },
  { id: 'MENTOR', title: 'I want to mentor', desc: 'Share expertise & earn income', icon: Rocket, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', ring: 'ring-emerald-500' },
  { id: 'BOTH', title: 'Both!', desc: 'Learn, teach & grow together', icon: Sparkles, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950/30', ring: 'ring-violet-500' },
]

export default function StepRole({ roleChoice, setRoleChoice }: Props) {
  return (
    <div className="onb-fade-in-up space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 1 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
          Welcome to MentorX! 🎉
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          Let's personalize your experience in just a few steps
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">
          What brings you here?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <button
              key={role.id}
              onClick={() => setRoleChoice(role.id)}
              className={`onb-fade-in-up onb-stagger-${i + 1} group relative p-6 rounded-2xl text-center transition-all duration-300 border-2 overflow-hidden ${
                roleChoice === role.id
                  ? `${role.bg} border-transparent ring-2 ${role.ring} shadow-xl scale-[1.03]`
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg'
              }`}
            >
              {roleChoice === role.id && <div className="absolute inset-0 onb-shimmer pointer-events-none" />}
              <div className={`relative w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <role.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="relative font-black text-lg mb-1 text-gray-900 dark:text-white">{role.title}</h3>
              <p className="relative text-sm text-gray-500 dark:text-gray-400">{role.desc}</p>
              {roleChoice === role.id && (
                <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg onb-confetti">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {roleChoice && (
        <div className="onb-fade-in-up p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {roleChoice === 'MENTOR'
              ? 'Great choice! We\'ll tailor the next steps for your mentoring journey.'
              : roleChoice === 'BOTH'
              ? 'Awesome! You\'ll get the best of both worlds.'
              : 'Perfect! Let\'s find the right mentors for you.'}
          </p>
        </div>
      )}
    </div>
  )
}
