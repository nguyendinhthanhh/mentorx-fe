import { Check, Bell, Mail, Smartphone, Sparkles } from 'lucide-react'

interface Preferences {
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
}

interface Props {
  preferences: Preferences
  setPreferences: (v: Preferences) => void
}

const notifOptions = [
  { id: 'emailEnabled' as const, label: 'Email Notifications', desc: 'Get updates via email for important activities', icon: Mail, gradient: 'from-blue-500 to-indigo-500' },
  { id: 'pushEnabled' as const, label: 'Push Notifications', desc: 'Real-time alerts on your device', icon: Smartphone, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'inAppEnabled' as const, label: 'In-App Notifications', desc: 'See notifications inside MentorX', icon: Bell, gradient: 'from-amber-500 to-orange-500' },
]

export default function StepPreferences({ preferences, setPreferences }: Props) {
  const toggle = (key: keyof Preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] })
  }

  const anySelected = preferences.emailEnabled || preferences.pushEnabled || preferences.inAppEnabled

  return (
    <div className="onb-fade-in-up space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 4 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          How would you like to stay updated?
        </p>
      </div>

      <div className="space-y-3">
        {notifOptions.map((opt, i) => {
          const enabled = preferences[opt.id]
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`onb-fade-in-up onb-stagger-${i + 1} w-full flex items-center gap-4 p-5 rounded-xl transition-all duration-200 border-2 ${
                enabled
                  ? 'bg-white dark:bg-gray-900 border-primary-500 shadow-lg shadow-primary-500/10'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                enabled
                  ? `bg-gradient-to-br ${opt.gradient} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
              {/* Toggle Switch */}
              <div className={`w-12 h-7 rounded-full p-0.5 transition-all duration-200 ${
                enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          )
        })}
      </div>

      {!anySelected && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠️ Please enable at least one notification channel so you don't miss important updates.
          </p>
        </div>
      )}

      {anySelected && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl onb-fade-in-scale">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" /> You can change these settings anytime from your profile.
          </p>
        </div>
      )}
    </div>
  )
}
